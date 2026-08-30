import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, CircleDashed, Clock3, Filter, ListTodo, Pencil, Plus, Search, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDw } from "@/lib/store";
import { openTodoEditor } from "@/components/editor/GlobalEditors";
import { sortTodos, pruneStaleTodos, TODO_TAG_CLASSES, type Todo, type TodoStatus } from "@/lib/types";

type Tab = "全部" | TodoStatus;
const tabs: Tab[] = ["全部", "未开始", "进行中", "已完成"];

export default function Todos() {
  const [active, setActive] = useState<Tab>("全部");
  const [query, setQuery] = useState("");
  const [items, setItems] = useDw<Todo[]>("todos", []);
  const [filterTag, setFilterTag] = useState<string>("全部");
  const [filterOpen, setFilterOpen] = useState(false);

  // 24 小时后自动清除已完成的待办
  useEffect(() => {
    const cleaned = pruneStaleTodos(items);
    if (cleaned.length !== items.length) setItems(cleaned);
  }, [items, setItems]);

  const sortedItems = useMemo(() => sortTodos(items), [items]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t) => set.add(t.tag));
    return ["全部", ...Array.from(set)];
  }, [items]);

  const visible = useMemo(() => sortedItems.filter((todo) =>
    (active === "全部" || todo.status === active) &&
    (filterTag === "全部" || todo.tag === filterTag) &&
    `${todo.title}${todo.project}${todo.tag}`.toLowerCase().includes(query.toLowerCase())
  ), [active, sortedItems, query, filterTag]);

  const toggleTodo = (id: string) => setItems((current) => current.map((todo) => todo.id === id ? { ...todo, status: todo.status === "已完成" ? "未开始" : "已完成", doneAt: todo.status === "已完成" ? undefined : Date.now() } : todo));

  return <AppLayout title="待办事项" subtitle="集中查看、编辑和完成所有设计任务">
    <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "全部任务", value: items.length, icon: ListTodo, tone: "text-primary bg-secondary" }, { label: "未开始", value: items.filter((item) => item.status === "未开始").length, icon: CircleDashed, tone: "text-warning bg-warning/10" }, { label: "进行中", value: items.filter((item) => item.status === "进行中").length, icon: Sparkles, tone: "text-primary bg-primary/10" }, { label: "已完成", value: items.filter((item) => item.status === "已完成").length, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" }].map((stat) => <div key={stat.label} className="glass-card rounded-2xl p-4"><span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", stat.tone)}><stat.icon className="h-4 w-4" /></span><p className="mt-3 text-2xl font-extrabold text-foreground">{stat.value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p></div>)}</section>
      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", active === tab ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground")}>{tab}</button>)}</div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索待办..." className="h-9 w-48 rounded-full bg-background pl-9 text-xs" /></div>
            <div className="relative">
              <Button variant="outline" onClick={() => setFilterOpen((v) => !v)} className="h-9 gap-1.5 text-xs"><Filter className="h-3.5 w-3.5" />筛选{filterTag !== "全部" && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}</Button>
              {filterOpen && <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-2xl border border-border bg-card p-2 shadow-card">
                  {tags.map((tag) => <button key={tag} onClick={() => { setFilterTag(tag); setFilterOpen(false); }} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold", filterTag === tag ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>{tag}{filterTag === tag && <Check className="h-3.5 w-3.5 text-primary" />}</button>)}
                </div>
              </>}
            </div>
            <Button onClick={() => openTodoEditor(null)} className="h-9 gap-1.5 rounded-full bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" />新增待办</Button>
          </div>
        </div>
        <div className="mt-5 divide-y divide-border">
          {visible.map((todo) => <div key={todo.id} className="group flex items-center gap-3 py-4">
            <button onClick={() => toggleTodo(todo.id)} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors", todo.status === "已完成" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")} aria-label={`切换${todo.title}状态`}>{todo.status === "已完成" && <Check className="h-3 w-3" />}</button>
            <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => openTodoEditor(todo)}>
              <div className="flex flex-wrap items-center gap-2"><p className={cn("text-sm font-semibold", todo.status === "已完成" ? "text-muted-foreground line-through" : "text-foreground")}>{todo.title}</p><Badge className={cn("border-none text-[10px]", TODO_TAG_CLASSES[todo.tag] || TODO_TAG_CLASSES["新增"])}>{todo.tag}</Badge></div>
              <p className="mt-1 text-[11px] text-muted-foreground">{todo.id} · {todo.project}</p>
            </button>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><CalendarDays className="h-3.5 w-3.5" />{todo.due}</span>
            <span className={cn("hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex", todo.status === "已完成" ? "bg-emerald-50 text-emerald-700" : todo.status === "进行中" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground")}>{todo.status}</span>
            <button onClick={() => openTodoEditor(todo)} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-primary group-hover:opacity-100" aria-label={`编辑${todo.title}`}><Pencil className="h-3.5 w-3.5" /></button>
          </div>)}
          {visible.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">{items.length === 0 ? "还没有待办，点右上角「新增待办」开始吧" : "没有匹配的待办事项"}</div>}
        </div>
      </section>
      <div className="glass-inner flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-muted-foreground"><Clock3 className="h-4 w-4 text-primary" />提示：点击左侧圆点快速标记完成，点击条目可编辑或删除，首页日历中的事务会同步显示。</div>
    </div>
  </AppLayout>;
}
