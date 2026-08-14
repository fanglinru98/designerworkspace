import { useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, CircleDashed, Clock3, Filter, ListTodo, Plus, Search, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TodoStatus = "全部" | "未开始" | "进行中" | "已完成";
interface Todo { id: string; title: string; project: string; due: string; status: Exclude<TodoStatus, "全部">; tag: string; tagClass: string; }

const initialTodos: Todo[] = [
  { id: "DSK-021", title: "首页视觉稿 v3 精修", project: "品牌重塑 2.0", due: "今天 18:00", status: "进行中", tag: "高优先级", tagClass: "bg-pink-100 text-pink-700" },
  { id: "DSK-022", title: "移动端适配与组件切图", project: "品牌重塑 2.0", due: "明天 10:00", status: "未开始", tag: "视觉", tagClass: "bg-sky-100 text-sky-700" },
  { id: "DSK-023", title: "图标系统统一规范", project: "设计系统规范", due: "05月26日", status: "未开始", tag: "组件", tagClass: "bg-violet-100 text-violet-700" },
  { id: "DSK-030", title: "设计评审会 · 核心页面", project: "品牌重塑 2.0", due: "05月28日", status: "未开始", tag: "评审", tagClass: "bg-amber-100 text-amber-700" },
  { id: "DSK-014", title: "竞品视觉趋势调研", project: "品牌重塑 2.0", due: "已完成", status: "已完成", tag: "调研", tagClass: "bg-emerald-100 text-emerald-700" },
];

const tabs: TodoStatus[] = ["全部", "未开始", "进行中", "已完成"];

export default function Todos() {
  const [active, setActive] = useState<TodoStatus>("全部");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialTodos);
  const visible = useMemo(() => items.filter((todo) => (active === "全部" || todo.status === active) && `${todo.title}${todo.project}${todo.tag}`.toLowerCase().includes(query.toLowerCase())), [active, items, query]);
  const toggleTodo = (id: string) => setItems((current) => current.map((todo) => todo.id === id ? { ...todo, status: todo.status === "已完成" ? "未开始" : "已完成" } : todo));

  return <AppLayout title="待办事项" subtitle="集中查看、编辑和完成所有设计任务">
    <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "全部任务", value: items.length, icon: ListTodo, tone: "text-primary bg-secondary" }, { label: "未开始", value: items.filter((item) => item.status === "未开始").length, icon: CircleDashed, tone: "text-warning bg-warning/10" }, { label: "进行中", value: items.filter((item) => item.status === "进行中").length, icon: Sparkles, tone: "text-primary bg-primary/10" }, { label: "已完成", value: items.filter((item) => item.status === "已完成").length, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" }].map((stat) => <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-card"><span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", stat.tone)}><stat.icon className="h-4 w-4" /></span><p className="mt-3 text-2xl font-extrabold text-foreground">{stat.value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p></div>)}</section>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1.5">{tabs.map((tab) => <button key={tab} onClick={() => setActive(tab)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", active === tab ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground")}>{tab}</button>)}</div><div className="flex items-center gap-2"><div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索待办..." className="h-9 w-48 rounded-full bg-background pl-9 text-xs" /></div><Button variant="outline" className="h-9 gap-1.5 text-xs"><Filter className="h-3.5 w-3.5" />筛选</Button><Button className="h-9 gap-1.5 rounded-full bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" />新增待办</Button></div></div>
        <div className="mt-5 divide-y divide-border">{visible.map((todo) => <div key={todo.id} className="flex items-center gap-3 py-4"><button onClick={() => toggleTodo(todo.id)} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", todo.status === "已完成" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")} aria-label={`切换${todo.title}状态`}>{todo.status === "已完成" && <Check className="h-3 w-3" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={cn("text-sm font-semibold text-foreground", todo.status === "已完成" && "text-muted-foreground line-through")}>{todo.title}</p><Badge className={cn("border-none text-[10px]", todo.tagClass)}>{todo.tag}</Badge></div><p className="mt-1 text-[11px] text-muted-foreground">{todo.id} · {todo.project}</p></div><span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><CalendarDays className="h-3.5 w-3.5" />{todo.due}</span><span className={cn("hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex", todo.status === "已完成" ? "bg-emerald-50 text-emerald-700" : todo.status === "进行中" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground")}>{todo.status}</span></div>)}{visible.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">没有匹配的待办事项</div>}</div>
      </section>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground"><Clock3 className="h-4 w-4 text-primary" />提示：点击任务左侧圆点即可快速标记完成，首页日历中的事务会同步显示。</div>
    </div>
  </AppLayout>;
}
