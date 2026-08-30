import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, CircleDashed, Filter, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDw } from "@/lib/store";
import { openTaskEditor } from "@/components/editor/GlobalEditors";
import { TASK_TAG_COLORS, fmtPrice, type Task, type TaskStatus } from "@/lib/types";

const columns: { status: TaskStatus; icon: typeof CircleDashed; dot: string }[] = [
  { status: "未开始", icon: CircleDashed, dot: "bg-amber-400" },
  { status: "设计中", icon: Sparkles, dot: "bg-violet-500" },
  { status: "已完成", icon: CheckCircle2, dot: "bg-emerald-500" },
];

export default function Projects() {
  const [tasks, setTasks] = useDw<Task[]>("projects", []);
  const [query, setQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("全部");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceEdit, setPriceEdit] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  // 项目统计：从数据实时计算
  const tags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.tag));
    return ["全部", ...Array.from(set)];
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter((task) =>
    (filterTag === "全部" || task.tag === filterTag) &&
    `${task.title}${task.project}${task.tag}`.toLowerCase().includes(query.toLowerCase())
  ), [query, filterTag, tasks]);

  const dueSoon = tasks.filter((t) => t.status !== "已完成" && t.date).length;

  const moveTask = (id: string, status: TaskStatus) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, status } : t));
  };

  const savePrice = (taskId: string) => {
    const v = parseInt(priceDraft, 10);
    if (!isNaN(v) && v >= 0) setTasks(tasks.map((t) => t.id === taskId ? { ...t, price: v } : t));
    setPriceEdit(null);
  };

  return (
    <AppLayout title="项目总览" subtitle="所有设计任务集中管理，清晰推进每一个交付节点">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-foreground">全部项目</p><p className="mt-1 text-xs text-muted-foreground">{tasks.length} 个任务 · {filterTag !== "全部" ? `按「${filterTag}」筛选` : "跨项目汇总"}</p></div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索任务..." className="h-9 w-48 rounded-full bg-card pl-9 text-xs" /></div>
            <div className="relative">
              <Button variant="outline" onClick={() => setFilterOpen((v) => !v)} className="h-9 gap-2 text-xs"><Filter className="h-3.5 w-3.5" />筛选{filterTag !== "全部" && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}</Button>
              {filterOpen && <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-2xl border border-border bg-card p-2 shadow-card">
                  {tags.map((tag) => <button key={tag} onClick={() => { setFilterTag(tag); setFilterOpen(false); }} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold", filterTag === tag ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>{tag}{filterTag === tag && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}</button>)}
                </div>
              </>}
            </div>
            <Button onClick={() => openTaskEditor(null)} className="h-9 gap-1.5 rounded-full bg-foreground px-3 text-xs text-background hover:bg-foreground/90"><Plus className="h-3.5 w-3.5" />新增任务</Button>
          </div>
        </div>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "未开始", value: tasks.filter((task) => task.status === "未开始").length, icon: CircleDashed, tone: "bg-amber-50 text-amber-600", note: "等待启动" },
            { label: "设计中", value: tasks.filter((task) => task.status === "设计中").length, icon: Sparkles, tone: "bg-violet-50 text-violet-600", note: "正在推进" },
            { label: "已完成", value: tasks.filter((task) => task.status === "已完成").length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600", note: "全部任务累计" },
            { label: "未完成", value: dueSoon, icon: CalendarClock, tone: "bg-orange-50 text-orange-600", note: "含日期未完成" },
          ].map((stat) => <div key={stat.label} className="glass-card rounded-2xl p-4"><div className="flex items-center justify-between"><span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stat.tone)}><stat.icon className="h-[18px] w-[18px]" /></span><span className="text-[10px] font-medium text-muted-foreground">{stat.note}</span></div><p className="mt-3 text-2xl font-extrabold text-foreground">{stat.value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p></div>)}
        </section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const Icon = column.icon;
            const items = filtered.filter((task) => task.status === column.status);
            return <section key={column.status} className="glass-inner min-h-[430px] rounded-2xl p-3">
              <div className="flex items-center gap-2 px-1 pb-3">
                <span className={cn("h-2 w-2 rounded-full", column.dot)} />
                <h2 className="text-sm font-bold text-foreground">{column.status}</h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
                <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-muted-foreground" onClick={() => { const next = column.status === "未开始" ? "设计中" : column.status === "设计中" ? "已完成" : "未开始"; items.forEach((t) => moveTask(t.id, next)); }} title="批量移到下一状态"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-3">
                {items.map((task) => <article key={task.id} className="glass-task group cursor-pointer rounded-xl p-3 transition-shadow hover:shadow-md" onClick={() => openTaskEditor(task)}>
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={cn("border-none px-2 py-0.5 text-[10px]", TASK_TAG_COLORS[task.tag] || TASK_TAG_COLORS["新增"])}>{task.tag}</Badge>
                    <span className="text-[10px] text-muted-foreground">{task.id}</span>
                  </div>
                  <h3 className="mt-2 text-xs font-bold leading-5 text-foreground">{task.title}</h3>
                  {task.desc && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{task.desc}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{task.project}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {task.price !== undefined && task.price > 0 ? (
                      <button onClick={(e) => { e.stopPropagation(); setPriceEdit(task.id); setPriceDraft(String(task.price)); }} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground" title="点击修改报价">{fmtPrice(task.price)}<span className="text-[8px] opacity-70">✎</span></button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setPriceEdit(task.id); setPriceDraft(""); }} className="rounded-full border border-dashed border-border px-2 py-0.5 text-[9px] text-muted-foreground hover:border-primary hover:text-primary" title="添加报价">＋ 报价</button>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarClock className="h-3 w-3" />{task.date}</span>
                  </div>
                  {priceEdit === task.id && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5" onClick={(e) => e.stopPropagation()}>
                      <Input autoFocus value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") savePrice(task.id); if (e.key === "Escape") setPriceEdit(null); }} type="number" min={0} placeholder="报价 ¥" className="h-7 flex-1 bg-card text-[11px]" />
                      <Button onClick={() => savePrice(task.id)} className="h-7 shrink-0 bg-primary px-2 text-[10px] text-primary-foreground">保存</Button>
                      <Button variant="ghost" onClick={() => setPriceEdit(null)} className="h-7 shrink-0 px-1.5 text-[10px]">取消</Button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold text-primary">{task.status}</span>
                      <Avatar className="h-6 w-6"><AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{task.owner}</AvatarFallback></Avatar>
                    </div>
                  </div>
                </article>)}
                {items.length === 0 && <div className="rounded-xl border border-dashed border-border py-8 text-center text-[11px] text-muted-foreground">暂无任务</div>}
              </div>
              <Button variant="ghost" onClick={() => openTaskEditor(null)} className="mt-3 flex h-8 w-full items-center justify-center gap-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground"><Plus className="h-3.5 w-3.5" />添加任务</Button>
            </section>;
          })}
        </div>
      </div>
    </AppLayout>
  );
}
