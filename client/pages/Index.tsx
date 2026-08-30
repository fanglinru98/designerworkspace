import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, CheckCircle2, CircleDashed, Pencil, Plus, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDw } from "@/lib/store";
import { sortTodos, pruneStaleTodos, nextTodoId, TODO_TAG_CLASSES, fmtPrice, type Task, type TaskStatus, type Todo } from "@/lib/types";
import { openTaskEditor, openTodoEditor } from "@/components/editor/GlobalEditors";

const DAY = 86400000;

const boardColumns: { status: TaskStatus; icon: typeof CircleDashed; dot: string }[] = [
  { status: "未开始", icon: CircleDashed, dot: "bg-amber-400" },
  { status: "设计中", icon: Sparkles, dot: "bg-violet-500" },
  { status: "已完成", icon: CheckCircle2, dot: "bg-emerald-500" },
];

/** 甘特图任务条按状态配色（双生胶囊：淡色条身 + 实心圆帽 + 深色文字） */
const barTone: Record<TaskStatus, { body: string; border: string; cap: string; text: string }> = {
  未开始: { body: "bg-amber-100/80", border: "border-amber-300/70", cap: "bg-gradient-to-b from-amber-300 to-amber-400", text: "text-amber-700" },
  设计中: { body: "bg-violet-100/80", border: "border-violet-300/70", cap: "bg-gradient-to-b from-violet-400 to-violet-500", text: "text-violet-700" },
  已完成: { body: "bg-pink-100/80", border: "border-pink-300/70", cap: "bg-gradient-to-b from-pink-300 to-pink-400", text: "text-pink-700" },
};

/** 解析 YYYY-MM-DD 或 MM-DD（按今年）为本地零点时间戳 */
function parseDay(d?: string): number | null {
  if (!d) return null;
  const m = d.match(/(\d{4})-(\d{2})-(\d{2})/) || d.match(/(\d{2})-(\d{2})/);
  if (!m) return null;
  const dt = m.length === 4 ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(new Date().getFullYear(), +m[1] - 1, +m[2]);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

/** 时间戳 → YYYY-MM-DD（用本地时区拼装，避免 toISOString 的时区偏移） */
function fmtDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface GanttBar { task: Task; s: number; e: number }

export default function Index() {
  const [todos, setTodos] = useDw<Todo[]>("todos", []);
  const [tasks, setTasks] = useDw<Task[]>("projects", []);
  const [addingTodo, setAddingTodo] = useState(false);
  const [todoDraft, setTodoDraft] = useState("");

  // 24 小时后自动清除已完成的待办
  useEffect(() => {
    const cleaned = pruneStaleTodos(todos);
    if (cleaned.length !== todos.length) setTodos(cleaned);
  }, [todos, setTodos]);

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);
  const toggleTodo = (id: string) => setTodos(todos.map((t) => t.id === id ? { ...t, status: t.status === "已完成" ? "未开始" : "已完成", doneAt: t.status === "已完成" ? undefined : Date.now() } : t));
  const addTodo = () => {
    const title = todoDraft.trim();
    if (!title) return;
    const todo: Todo = { id: nextTodoId(todos), title, project: "", due: "今天", status: "未开始", tag: "新增", tagClass: TODO_TAG_CLASSES["新增"] };
    setTodos([...todos, todo]);
    setTodoDraft("");
    setAddingTodo(false);
  };

  // 甘特图项目重命名（「未分类项目」行重命名会把整组任务归入新项目）
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);
  const saveRename = () => {
    const name = renameDraft.trim();
    if (renaming !== null && name) {
      const row = gantt.projects.find((p) => p.name === renaming);
      if (row) {
        const ids = new Set(row.taskIds);
        setTasks(tasks.map((t) => ids.has(t.id) ? { ...t, project: name } : t));
      }
    }
    setRenaming(null);
  };

  // 统计：4 张卡（含项目总价，按任务独立价格求和）
  const totalPrice = tasks.reduce((a, t) => a + (t.price || 0), 0);
  const stats = [
    { label: "待办总数", value: String(todos.length), note: `${todos.filter((t) => t.status === "已完成").length} 已完成` },
    { label: "设计中", value: String(tasks.filter((t) => t.status === "设计中").length), note: `${tasks.filter((t) => t.status === "未开始").length} 待启动` },
    { label: "任务完成", value: String(tasks.filter((t) => t.status === "已完成").length), note: "全部任务累计" },
    { label: "项目总价", value: fmtPrice(totalPrice), note: `${tasks.filter((t) => t.price).length} 个任务已报价` },
  ];

  // ===== 甘特图：项目分组 + 每任务独占一条时间轴 =====
  // 日 = 以今天为中心的 14 天；周 = 8 周；月 = 6 个月（24 周）
  const [ganttView, setGanttView] = useState<"日" | "周" | "月">("周");
  const gantt = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const totalDays = ganttView === "日" ? 14 : ganttView === "周" ? 56 : 168;
    let anchor: Date;
    if (ganttView === "日") {
      anchor = new Date(now.getTime() - 7 * DAY); // 今天居中：前 7 天 + 后 7 天
    } else {
      anchor = new Date(now);
      anchor.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7); // 上周一
    }
    const rangeStart = anchor.getTime();
    const rangeEnd = rangeStart + totalDays * DAY; // 开区间
    const pct = (ts: number) => ((ts - rangeStart) / (totalDays * DAY)) * 100;
    const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => {
      const ws = rangeStart + i * 7 * DAY;
      return { start: new Date(ws), end: new Date(Math.min(ws + 6 * DAY, rangeEnd - DAY)) };
    });
    const days = Array.from({ length: totalDays }, (_, i) => new Date(rangeStart + i * DAY));
    // 月份分段表头
    const months: { label: string; days: number }[] = [];
    for (let i = 0; i < totalDays;) {
      const label = `${new Date(rangeStart + i * DAY).getFullYear()}年${new Date(rangeStart + i * DAY).getMonth() + 1}月`;
      let days0 = 0;
      while (i + days0 < totalDays) {
        const cur = new Date(rangeStart + (i + days0) * DAY);
        if (`${cur.getFullYear()}年${cur.getMonth() + 1}月` !== label) break;
        days0++;
      }
      months.push({ label, days: days0 });
      i += days0;
    }
    // 按项目分组；组内每个任务一行（时间窗外的任务不占行）
    const projectMap = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const key = t.project.trim() || "未分类项目";
      const cur = projectMap.get(key) || [];
      cur.push(t);
      projectMap.set(key, cur);
    });
    const projects = Array.from(projectMap.entries()).map(([name, items]) => {
      const inRange = (t: Task) => {
        const e = parseDay(t.date);
        if (e === null) return false;
        const s = parseDay(t.start) ?? e;
        return e >= rangeStart && s < rangeEnd;
      };
      const dated = items.filter(inRange).sort((a, b) => {
        const sa = parseDay(a.start) ?? parseDay(a.date)!;
        const sb = parseDay(b.start) ?? parseDay(b.date)!;
        return sa - sb || a.date.localeCompare(b.date);
      });
      const undated = items.filter((t) => parseDay(t.date) === null);
      return { name, dated, undated, taskIds: items.map((t) => t.id) };
    }).filter((p) => p.dated.length > 0 || p.undated.length > 0);
    return { weeks, days, months, projects, pct, totalDays, todayPos: Math.min(Math.max(pct(now.getTime()), 0), 100) };
  }, [tasks, ganttView]);

  // ===== 甘特图拖拽：整体移动 / 两端调起止（按天吸附） =====
  const [dragPreview, setDragPreview] = useState<{ id: string; start: number; end: number } | null>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize-l" | "resize-r"; startTs: number; endTs: number; x0: number; dayW: number; moved: boolean } | null>(null);
  const previewRef = useRef<{ id: string; start: number; end: number } | null>(null);
  const suppressClickRef = useRef(false);

  const beginDrag = (e: ReactPointerEvent<HTMLElement>, mode: "move" | "resize-l" | "resize-r", bar: GanttBar) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const track = (e.currentTarget as HTMLElement).closest(".gantt-track") as HTMLElement | null;
    const barEl = (e.currentTarget as HTMLElement).closest(".gantt-bar") as HTMLElement | null;
    if (!track || !barEl) return;
    dragRef.current = { id: bar.task.id, mode, startTs: bar.s, endTs: bar.e, x0: e.clientX, dayW: track.getBoundingClientRect().width / gantt.totalDays, moved: false };
    barEl.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const delta = Math.round((e.clientX - d.x0) / d.dayW);
    if (delta === 0 && !d.moved) return;
    d.moved = true;
    let s = d.startTs;
    let end = d.endTs;
    if (d.mode === "move") { s += delta * DAY; end += delta * DAY; }
    else if (d.mode === "resize-l") { s = Math.min(d.startTs + delta * DAY, d.endTs); }
    else { end = Math.max(d.endTs + delta * DAY, d.startTs); }
    previewRef.current = { id: d.id, start: s, end };
    setDragPreview(previewRef.current);
  };

  const onDragEnd = () => {
    const d = dragRef.current;
    const pv = previewRef.current;
    dragRef.current = null;
    previewRef.current = null;
    setDragPreview(null);
    if (!d || !d.moved || !pv || pv.id !== d.id) return;
    suppressClickRef.current = true;
    setTasks((prev) => prev.map((t) => {
      if (t.id !== d.id) return t;
      if (d.mode === "move") return { ...t, date: fmtDay(pv.end), start: fmtDay(pv.start) };
      if (d.mode === "resize-l") return { ...t, start: fmtDay(pv.start) };
      return { ...t, date: fmtDay(pv.end) };
    }));
  };

  // 甘特图轨道底纹：纯白背景 + 细分隔线（日=每天一条，周/月=每周一条）
  const trackBg = ganttView === "日"
    ? `repeating-linear-gradient(90deg, rgba(35,37,74,0.06) 0, rgba(35,37,74,0.06) 1px, transparent 1px, transparent calc(100%/${gantt.totalDays}))`
    : `repeating-linear-gradient(90deg, rgba(35,37,74,0.06) 0, rgba(35,37,74,0.06) 1px, transparent 1px, transparent calc(100%/${gantt.totalDays / 7}))`;

  return (
    <AppLayout title="设计工作台" subtitle="一个视图，掌握所有设计进展" home>
      <div className="wb-wrap" style={{ paddingTop: 8 }}>
        {/* 4 统计卡 */}
        <div className="wb-stats">
          {stats.map((stat) => <div key={stat.label} className="wb-stat"><div className="lab">{stat.label}</div><div className="val">{stat.value}</div><div className="note">{stat.note}</div></div>)}
        </div>

        {/* 左 2fr + 右 1fr */}
        <div className="wb-grid">
          <div className="wb-col">
            {/* 项目看板 */}
            <div className="wb-card">
              <h2>项目看板</h2>
              <div className="wb-boards">
                {boardColumns.map((column) => {
                  const Icon = column.icon;
                  const items = tasks.filter((task) => task.status === column.status);
                  return <div key={column.status} className="wb-board">
                    <h3><span>{column.status}</span><b>{items.length}</b></h3>
                    {items.map((task) => <div key={task.id} className="wb-task" onClick={() => openTaskEditor(task)}>
                      <div className="t">{task.title}</div>
                      <div className="m">
                        <span>{task.project}</span>
                        <span className="flex items-center gap-1.5">
                          {task.price !== undefined && task.price > 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{fmtPrice(task.price)}</span>}
                          <Avatar className="h-5 w-5"><AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">{task.owner}</AvatarFallback></Avatar>
                        </span>
                      </div>
                    </div>)}
                    {items.length === 0 && <div className="rounded-xl border border-dashed border-white/70 py-6 text-center text-[11px] text-muted-foreground">暂无任务</div>}
                    <button onClick={() => openTaskEditor(null)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-primary"><Plus className="h-3.5 w-3.5" />添加任务</button>
                  </div>;
                })}
              </div>
            </div>
          </div>

          <div className="wb-col">
            {/* 待办事项 */}
            <div className="wb-card">
              <h2>待办事项</h2>
              {addingTodo && (
                <div className="mb-3 flex gap-2">
                  <Input autoFocus value={todoDraft} onChange={(e) => setTodoDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTodo(); if (e.key === "Escape") { setAddingTodo(false); setTodoDraft(""); } }} placeholder="输入待办标题，回车添加..." className="h-9 rounded-xl bg-white/70 text-xs" />
                  <Button onClick={addTodo} className="h-9 shrink-0 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] px-4 text-xs text-white">添加</Button>
                </div>
              )}
              <div className="max-h-[300px] overflow-y-auto pr-1">
                {sortedTodos.slice(0, 20).map((todo) => <button key={todo.id} onClick={() => openTodoEditor(todo)} className="wb-todo w-full text-left" title={todo.title}>
                  <span onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }} className={cn("wb-cb shrink-0", todo.status === "已完成" && "ok")}>{todo.status === "已完成" && <Check className="h-2.5 w-2.5 text-white" />}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-xs leading-5", todo.status === "已完成" && "text-muted-foreground line-through")}>{todo.title}</span>
                  <span className="shrink-0 text-[10px] opacity-50">{todo.due}</span>
                </button>)}
                {todos.length === 0 && !addingTodo && <p className="py-4 text-center text-[11px] text-muted-foreground">暂无待办，点下方「增加待办」添加</p>}
              </div>
              <button onClick={() => setAddingTodo(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary/60 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary"><Plus className="h-3.5 w-3.5" />增加待办</button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">已完成自动沉底 · 24h 后自动清除</p>
            </div>
          </div>
        </div>

        {/* 甘特图：时间轴常显（无排期也显示日/周/月表头与今天线），项目分组 + 每任务独占一行 */}
        <div className="wb-card mt-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 style={{ marginBottom: 0 }}>项目时间节点 · 甘特图</h2>
            <div className="flex rounded-full bg-secondary p-0.5">
              {(["日", "周", "月"] as const).map((v) => (
                <button key={v} onClick={() => setGanttView(v)} className={cn("rounded-full px-3 py-1 text-[10px] font-bold transition-colors", ganttView === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{v}</button>
              ))}
            </div>
          </div>
          <div className="mb-3 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full border border-amber-300/70 bg-amber-100/80" />未开始</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full border border-violet-300/70 bg-violet-100/80" />设计中</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full border border-pink-300/70 bg-pink-100/80" />已完成</span>
            <span className="ml-auto">拖动任务条调整时间 · 拖两端设置起止 · 点任务名编辑</span>
          </div>
          <div className="overflow-x-auto pb-1">
            <div style={{ minWidth: ganttView === "日" ? Math.max(560, gantt.totalDays * 40) : ganttView === "月" ? Math.max(760, gantt.totalDays * 8) : Math.max(560, gantt.totalDays * 13) }}>
              {/* 表头：月份 + 周/日 + 今天标记（无论有无数据常显） */}
              <div className="flex items-stretch border-b border-border pb-1">
                <div className="w-44 shrink-0 pr-3 text-[11px] font-bold text-foreground">项目 / 任务</div>
                <div className="min-w-0 flex-1">
                  <div className="flex">
                    {gantt.months.map((m, i) => <div key={m.label + i} className={cn("px-2 text-[10px] font-bold text-foreground", i > 0 && "border-l border-border/50")} style={{ width: `${(m.days / gantt.totalDays) * 100}%` }}>{m.label}</div>)}
                  </div>
                  {ganttView === "日" ? (
                    <div className="flex pt-0.5">
                      {gantt.days.map((d, i) => <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{d.getDate()}</div>)}
                    </div>
                  ) : (
                    <div className="flex pt-0.5">
                      {gantt.weeks.map((w, i) => (
                        <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
                          {ganttView === "月" ? `${w.start.getMonth() + 1}/${w.start.getDate()}` : `${w.start.getMonth() + 1}/${w.start.getDate()}-${w.end.getDate()}`}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative h-4">
                    <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-400 px-1.5 text-[9px] font-bold leading-4 text-white shadow-sm" style={{ left: `${gantt.todayPos}%` }}>今天</span>
                  </div>
                </div>
              </div>
              {gantt.projects.length === 0 ? (
                /* 空态：轨道与今天线照常显示，居中提示 */
                <div className="gantt-track relative mt-3 flex items-center justify-center rounded-xl border border-dashed border-border" style={{ height: 96, backgroundImage: trackBg }}>
                  <div className="absolute top-0 z-10 h-full w-0.5 rounded-full bg-rose-400/80" style={{ left: `${gantt.todayPos}%` }} title="今天" />
                  <p className="z-20 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm">暂无排期任务 · 给任务设置截止日期后会自动显示在这里</p>
                </div>
              ) : (
                <>
                  {/* 项目分组 */}
                  {gantt.projects.map((p) => (
                    <div key={p.name} className="mt-2.5 first:mt-2">
                      {/* 项目组头（纯白 + 描边） */}
                      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-white px-2 py-1.5">
                        <div className="flex w-40 shrink-0 items-center gap-1.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          {renaming === p.name ? (
                            <div className="flex min-w-0 flex-1 items-center gap-1">
                              <Input autoFocus ref={renameRef} value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }} className="h-6 min-w-0 flex-1 rounded-md px-1.5 text-[11px]" placeholder="新名称" />
                              <button onClick={saveRename} className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">✓</button>
                            </div>
                          ) : (
                            <button onClick={() => { setRenaming(p.name); setRenameDraft(p.name === "未分类项目" ? "" : p.name); }} title="点击重命名项目" className="flex min-w-0 flex-1 items-center gap-1 text-left">
                              <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground hover:text-primary">{p.name}</span>
                              <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-primary" />
                            </button>
                          )}
                          <span className="shrink-0 rounded-full bg-violet-100 px-1.5 text-[9px] font-bold text-violet-600">{p.taskIds.length}</span>
                        </div>
                        <span className="min-w-0 flex-1 truncate text-[10px] text-violet-400/90">{p.dated.length} 个已排期{p.undated.length > 0 ? ` · ${p.undated.length} 个未排期` : ""}</span>
                      </div>
                      {/* 任务行：每任务独占一条时间轴 */}
                      {p.dated.map((t) => {
                        const s = parseDay(t.start) ?? parseDay(t.date)!;
                        const e = parseDay(t.date)!;
                        const bar: GanttBar = { task: t, s, e };
                        const pv = dragPreview && dragPreview.id === t.id ? dragPreview : null;
                        const bs = pv ? pv.start : s;
                        const be = pv ? pv.end : e;
                        const rawLeft = gantt.pct(bs);
                        const rawRight = gantt.pct(be + DAY);
                        if (rawRight <= 0 || rawLeft >= 100) return null;
                        const left = Math.max(rawLeft, 0);
                        const right = Math.min(rawRight, 100);
                        const w = Math.max(right - left, 1.8);
                        return (
                          <div key={t.id} className="flex items-center border-b border-border/40 last:border-0">
                            <button onClick={() => openTaskEditor(t)} title={t.title} className="w-44 shrink-0 cursor-pointer truncate py-1.5 pl-6 pr-3 text-left text-[11px] text-muted-foreground hover:text-primary">
                              {t.title}
                            </button>
                            <div className="gantt-track relative min-w-0 flex-1" style={{ height: 28, backgroundImage: trackBg }}>
                              {/* 今天线 */}
                              <div className="absolute top-0 z-10 h-full w-0.5 rounded-full bg-rose-400/80" style={{ left: `${gantt.todayPos}%` }} title="今天" />
                              {/* 任务条（双生胶囊：圆帽 + 淡色条身，独占一行可拖拽调期） */}
                              <div className={cn("gantt-bar absolute z-20 flex items-center gap-1.5 overflow-hidden rounded-full border pl-1 pr-2", barTone[t.status].body, barTone[t.status].border, pv && "z-30 ring-2 ring-primary/60")} style={{ left: `${left}%`, width: `${w}%`, minWidth: 30, top: 5, height: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(35,37,74,0.1)" }} title={`${t.title} · ${fmtDay(bs)} ~ ${fmtDay(be)}`} onPointerDown={(ev) => beginDrag(ev, "move", bar)} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onClick={() => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } openTaskEditor(t); }}>
                                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", barTone[t.status].cap)} />
                                <span className={cn("min-w-0 flex-1 truncate text-[9.5px] font-bold", barTone[t.status].text)}>{t.title}</span>
                                <span onPointerDown={(ev) => beginDrag(ev, "resize-l", bar)} className="gantt-handle absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-full bg-white/0 hover:bg-white/70" />
                                <span onPointerDown={(ev) => beginDrag(ev, "resize-r", bar)} className="gantt-handle absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-full bg-white/0 hover:bg-white/70" />
                              </div>
                              {/* 条尾日期小签 */}
                              <span className="pointer-events-none absolute z-20 rounded-full border border-violet-200/80 bg-white px-1.5 text-[9px] font-semibold leading-[13px] text-muted-foreground" style={{ left: `calc(${right}% + 6px)`, top: 7 }}>{fmtDay(be).slice(5)}</span>
                            </div>
                          </div>
                        );
                      })}
                      {/* 未排期任务：同样独占一行，粉色虚线小签提示 */}
                      {p.undated.map((t) => (
                        <div key={t.id} className="flex items-center border-b border-border/40 last:border-0">
                          <button onClick={() => openTaskEditor(t)} title="未排期，点击设置日期" className="w-44 shrink-0 cursor-pointer truncate py-1.5 pl-6 pr-3 text-left text-[11px] text-muted-foreground/70 hover:text-primary">
                            {t.title}
                          </button>
                          <div className="gantt-track relative min-w-0 flex-1" style={{ height: 28, backgroundImage: trackBg }}>
                            <div className="absolute top-0 z-10 h-full w-0.5 rounded-full bg-rose-400/80" style={{ left: `${gantt.todayPos}%` }} title="今天" />
                            <button onClick={() => openTaskEditor(t)} className="absolute left-1 z-20 rounded-md border border-dashed border-pink-300/80 bg-pink-50/70 px-1.5 text-[9px] text-pink-500 hover:border-pink-400 hover:text-pink-600" style={{ top: 5, height: 18 }}>未排期 · 点击设置日期</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
