import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CircleDashed, Filter, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Status = "未开始" | "设计中" | "已完成";
interface Task { id: string; title: string; project: string; date: string; tag: string; status: Status; owner: string; color: string; }

const tasks: Task[] = [
  { id: "DSK-022", title: "移动端适配与组件切图", project: "品牌重塑 2.0", date: "05-25", tag: "视觉", status: "未开始", owner: "林", color: "bg-amber-100 text-amber-700" },
  { id: "DSK-023", title: "图标系统统一规范", project: "设计系统规范", date: "05-26", tag: "组件", status: "未开始", owner: "陈", color: "bg-sky-100 text-sky-700" },
  { id: "DSK-015", title: "品牌色板与情绪板整理", project: "品牌重塑 2.0", date: "05-22", tag: "灵感", status: "设计中", owner: "房", color: "bg-violet-100 text-violet-700" },
  { id: "DSK-021", title: "首页视觉稿 v3 精修", project: "品牌重塑 2.0", date: "05-24", tag: "高优先级", status: "设计中", owner: "房", color: "bg-rose-100 text-rose-700" },
  { id: "DSK-014", title: "竞品视觉趋势调研", project: "品牌重塑 2.0", date: "05-20", tag: "调研", status: "已完成", owner: "陈", color: "bg-emerald-100 text-emerald-700" },
  { id: "DSK-031", title: "标注文档与切图交付", project: "品牌重塑 2.0", date: "05-30", tag: "交付", status: "已完成", owner: "房", color: "bg-teal-100 text-teal-700" },
];

const columns: { status: Status; icon: typeof CircleDashed; tone: string; dot: string }[] = [
  { status: "未开始", icon: CircleDashed, tone: "bg-white border-border", dot: "bg-amber-400" },
  { status: "设计中", icon: Sparkles, tone: "bg-white border-border", dot: "bg-violet-500" },
  { status: "已完成", icon: CheckCircle2, tone: "bg-white border-border", dot: "bg-emerald-500" },
];

export default function Projects() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => tasks.filter((task) => `${task.title}${task.project}${task.tag}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <AppLayout title="项目总览" subtitle="所有设计任务集中管理，清晰推进每一个交付节点">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-foreground">品牌重塑 2.0</p><p className="mt-1 text-xs text-muted-foreground">7 个任务 · 2 个即将开始 · 最后更新于今天</p></div>
          <div className="flex items-center gap-2"><div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索任务..." className="h-9 w-48 rounded-full bg-card pl-9 text-xs" /></div><Button variant="outline" className="h-9 gap-2 text-xs"><Filter className="h-3.5 w-3.5" />筛选</Button><Button className="h-9 gap-1.5 rounded-full bg-foreground px-3 text-xs text-background hover:bg-foreground/90"><Plus className="h-3.5 w-3.5" />新增任务</Button></div>
        </div>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[{ label: "未开始", value: tasks.filter((task) => task.status === "未开始").length, icon: CircleDashed, tone: "bg-amber-50 text-amber-600", note: "等待启动" }, { label: "设计中", value: tasks.filter((task) => task.status === "设计中").length, icon: Sparkles, tone: "bg-violet-50 text-violet-600", note: "正在推进" }, { label: "已完成", value: tasks.filter((task) => task.status === "已完成").length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600", note: "本项目累计" }, { label: "即将到期", value: 2, icon: CalendarClock, tone: "bg-orange-50 text-orange-600", note: "未来 7 天" }].map((stat) => <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-card"><div className="flex items-center justify-between"><span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stat.tone)}><stat.icon className="h-[18px] w-[18px]" /></span><span className="text-[10px] font-medium text-muted-foreground">{stat.note}</span></div><p className="mt-3 text-2xl font-extrabold text-foreground">{stat.value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p></div>)}
        </section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const Icon = column.icon;
            const items = filtered.filter((task) => task.status === column.status);
            return <section key={column.status} className={cn("min-h-[430px] rounded-2xl border p-3", column.tone)}><div className="flex items-center gap-2 px-1 pb-3"><Icon className="h-4 w-4 text-foreground/60" /><h2 className="text-sm font-bold text-foreground">{column.status}</h2><span className="text-xs text-muted-foreground">{items.length}</span><button className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-white/70"><MoreHorizontal className="h-4 w-4" /></button></div><div className="space-y-3">{items.map((task) => <article key={task.id} className="rounded-xl border border-white/80 bg-card p-3 shadow-sm transition-shadow hover:shadow-md"><div className="flex items-start justify-between gap-2"><Badge className={cn("border-none px-2 py-0.5 text-[10px]", task.color)}>{task.tag}</Badge><span className="text-[10px] text-muted-foreground">{task.id}</span></div><h3 className="mt-2 text-xs font-bold leading-5 text-foreground">{task.title}</h3><p className="mt-1 text-[10px] text-muted-foreground">{task.project}</p><div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5"><span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarClock className="h-3 w-3" />{task.date}</span><Avatar className="h-6 w-6"><AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{task.owner}</AvatarFallback></Avatar></div></article>)}</div><button className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-muted-foreground hover:bg-white/70 hover:text-foreground"><Plus className="h-3.5 w-3.5" />添加任务</button></section>;
          })}
        </div>
      </div>
    </AppLayout>
  );
}
