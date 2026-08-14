import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock3,
  ExternalLink,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  ListTodo,
  Plus,
  Shapes,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav";

const quickLinks: { label: string; url: string; icon: LucideIcon; color: string }[] = [
  { label: "Figma", url: "https://www.figma.com", icon: Shapes, color: "bg-violet-100 text-violet-600" },
  { label: "Notion", url: "https://www.notion.so", icon: ListTodo, color: "bg-slate-100 text-slate-700" },
  { label: "Dribbble", url: "https://dribbble.com", icon: Globe2, color: "bg-pink-100 text-pink-500" },
  { label: "Behance", url: "https://www.behance.net", icon: ArrowUpRight, color: "bg-blue-100 text-blue-600" },
];

const projects = [
  { name: "品牌重塑 2.0", detail: "进行中 · 68%", color: "bg-violet-500" },
  { name: "移动端体验升级", detail: "进行中 · 42%", color: "bg-sky-400" },
  { name: "设计系统规范", detail: "待开始 · 12%", color: "bg-amber-400" },
];

const todos = [
  { text: "首页视觉稿 v3 精修", time: "今天 18:00", checked: false },
  { text: "整理品牌色板与情绪板", time: "明天 10:00", checked: false },
  { text: "竞品视觉趋势调研", time: "已完成", checked: true },
];

function daysForMonth(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const value = index - offset + 1;
    return value > 0 && value <= count ? value : null;
  });
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const now = new Date();
  const [view, setView] = useState<"日" | "周" | "月">("月");
  const [selectedDate, setSelectedDate] = useState(now.getDate());
  const [monthOffset, setMonthOffset] = useState(0);
  const [openTodo, setOpenTodo] = useState(true);
  const [note, setNote] = useState("");
  const [todosState, setTodosState] = useState(todos);

  const monthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const days = useMemo(
    () => daysForMonth(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate.getFullYear(), monthDate.getMonth()],
  );
  const monthLabel = `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`;

  const selectDate = (day: number) => {
    setSelectedDate(day);
    setOpenTodo(true);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-sidebar text-sidebar-foreground thin-scrollbar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
          <Sparkles className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight text-foreground">灵境</p>
          <p className="text-[11px] leading-tight text-muted-foreground">Designer OS</p>
        </div>
        <button className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="新增">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-3 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold text-foreground">智能日历</p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <div className="flex rounded-lg bg-secondary p-0.5">
            {(["日", "周", "月"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
                  view === item ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => setMonthOffset((value) => value - 1)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="上个月">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-foreground">{monthLabel}</span>
          <button onClick={() => setMonthOffset((value) => value + 1)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="下个月">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {view === "月" && (
          <>
            <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
              {['一', '二', '三', '四', '五', '六', '日'].map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
              {days.map((day, index) => (
                <button
                  key={`${day}-${index}`}
                  disabled={!day}
                  onClick={() => day && selectDate(day)}
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-[11px] transition-colors",
                    !day && "pointer-events-none",
                    day === selectedDate && monthOffset === 0 && "bg-primary font-bold text-primary-foreground shadow-glow",
                    day !== selectedDate && "text-foreground hover:bg-accent hover:text-accent-foreground",
                    day === now.getDate() && monthOffset === 0 && day !== selectedDate && "font-bold text-primary ring-1 ring-primary/30",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
        )}
        {view === "周" && (
          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, index) => {
              const day = ((now.getDate() - now.getDay() + 6 + index) % 31) + 1;
              return <button key={day} onClick={() => selectDate(day)} className={cn("rounded-xl border border-border p-2 text-center", day === selectedDate && "border-primary bg-primary/10")}><span className="block text-[10px] text-muted-foreground">周{['一','二','三','四','五','六','日'][index]}</span><span className="mt-1 block text-sm font-bold text-foreground">{day}</span></button>;
            })}
          </div>
        )}
        {view === "日" && (
          <button onClick={() => setOpenTodo(true)} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-primary/10 p-3 text-left">
            <span className="text-2xl font-extrabold text-primary">{selectedDate}</span>
            <span><span className="block text-xs font-bold text-foreground">今日安排</span><span className="mt-0.5 block text-[10px] text-muted-foreground">点击查看当日事务</span></span>
          </button>
        )}
        {openTodo && (
          <div className="mt-3 border-t border-border pt-3 animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-foreground">{monthLabel} {selectedDate} 日事务</p>
              <button onClick={() => setOpenTodo(false)} className="text-[10px] text-muted-foreground hover:text-primary">收起</button>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-start gap-2 rounded-lg bg-secondary/70 p-2">
                <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div><p className="text-[11px] font-semibold text-foreground">首页视觉稿评审会</p><p className="text-[10px] text-muted-foreground">14:00 - 15:00 · 会议室 A</p></div>
              </div>
              <div className="flex gap-1.5">
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录一件事务..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
                <button onClick={() => setNote("")} className="rounded-lg bg-primary px-2.5 text-[10px] font-bold text-primary-foreground">保存</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 px-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">待办事项</p>
          <button className="text-[10px] font-semibold text-primary">查看全部</button>
        </div>
        <div className="space-y-1">
          {todosState.map((todo, index) => (
            <button key={todo.text} onClick={() => setTodosState((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, checked: !item.checked } : item))} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-secondary">
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", todo.checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{todo.checked && <Check className="h-2.5 w-2.5" />}</span>
              <span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", todo.checked ? "text-muted-foreground line-through" : "text-foreground")}>{todo.text}</span>
              <span className="shrink-0 text-[9px] text-muted-foreground">{todo.time}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 px-3">
        <div className="mb-2 flex items-center justify-between px-2"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">设计项目一览</p><FolderKanban className="h-3.5 w-3.5 text-muted-foreground" /></div>
        <div className="space-y-1.5">
          {projects.map((project) => <button key={project.name} className="w-full rounded-xl border border-border bg-card p-2.5 text-left shadow-sm hover:border-primary/40"><div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", project.color)} /><span className="truncate text-[11px] font-bold text-foreground">{project.name}</span><ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" /></div><p className="mt-1 pl-4 text-[10px] text-muted-foreground">{project.detail}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary"><span className={cn("block h-full rounded-full", project.color)} style={{ width: project.detail.match(/\d+/)?.[0] + "%" }} /></div></button>)}
        </div>
      </div>

      <div className="mt-4 px-3 pb-3">
        <div className="mb-2 flex items-center justify-between px-2"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">常用网页</p><Plus className="h-3.5 w-3.5 text-muted-foreground" /></div>
        <div className="grid grid-cols-2 gap-2">{quickLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"><span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", item.color)}><item.icon className="h-3.5 w-3.5" /></span><span>{item.label}</span></a>)}</div>
      </div>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-secondary/60 p-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-[12px] font-bold text-white">房</div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-foreground">房琳茹</p><p className="truncate text-[10px] text-muted-foreground">高级视觉设计师</p></div><ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
        <nav className="space-y-0.5">{navItems.slice(0, 4).map((item) => { const Icon = item.icon; const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path); return <Link key={item.path} to={item.path} onClick={onNavigate} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium", active ? "bg-sidebar-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="h-3.5 w-3.5" />{item.label}</Link>; })}</nav>
      </div>
    </div>
  );
}
