import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Link2,
  ListTodo,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav";
import { useDw } from "@/lib/store";
import { AuthCard } from "@/components/auth/AuthModal";
import { openTaskEditor } from "@/components/editor/GlobalEditors";
import { type Todo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickLink { label: string; url: string; color: string; icon: string; }
const defaultQuickLinks: QuickLink[] = [
  { label: "Figma", url: "https://www.figma.com", icon: "shapes", color: "bg-violet-100 text-violet-600" },
  { label: "Notion", url: "https://www.notion.so", icon: "list", color: "bg-slate-100 text-slate-700" },
  { label: "Dribbble", url: "https://dribbble.com", icon: "globe", color: "bg-pink-100 text-pink-500" },
  { label: "Behance", url: "https://www.behance.net", icon: "arrow", color: "bg-blue-100 text-blue-600" },
];

function linkIcon(name: string, className: string) {
  const icons: Record<string, LucideIcon> = { shapes: Shapes, list: ListTodo, globe: Globe2, arrow: ArrowUpRight, link: Link2 };
  const Icon = icons[name] || Link2;
  return <Icon className={className} />;
}

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
  const [todosAll, setTodosAll] = useDw<Todo[]>("todos", []);
  const [calEvents, setCalEvents] = useDw<Record<string, string>>("calendar", {});
  const [quickLinks, setQuickLinks] = useDw<QuickLink[]>("quicklinks", defaultQuickLinks);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ label: "", url: "" });

  // 侧边栏待办 = 云端 todos 前 5 条
  const sidebarTodos = todosAll.slice(0, 5);
  const toggleSidebarTodo = (id: string) => {
    setTodosAll(todosAll.map((t) => t.id === id ? { ...t, status: t.status === "已完成" ? "未开始" : "已完成", doneAt: t.status === "已完成" ? undefined : Date.now() } : t));
  };
  const addQuickLink = () => {
    const label = linkDraft.label.trim();
    const url = linkDraft.url.trim();
    if (!label || !/^https?:\/\//.test(url)) return;
    setQuickLinks([...quickLinks, { label, url, icon: "link", color: "bg-sky-100 text-sky-600" }]);
    setLinkDraft({ label: "", url: "" });
    setShowAddLink(false);
  };
  const removeQuickLink = (label: string) => setQuickLinks(quickLinks.filter((l) => l.label !== label));

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
    <div className="flex h-full w-full flex-col overflow-y-auto bg-white text-sidebar-foreground thin-scrollbar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
          <Sparkles className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight text-foreground">灵境</p>
          <p className="text-[11px] leading-tight text-muted-foreground">Designer OS</p>
        </div>
        <button onClick={() => openTaskEditor(null)} className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-white hover:text-foreground" aria-label="新增任务">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <nav className="space-y-1 px-3 pb-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return <Link key={item.path} to={item.path} onClick={onNavigate} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold", active ? "bg-sidebar-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="h-4 w-4" />{item.label}</Link>;
        })}
      </nav>

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
          <button onClick={() => setMonthOffset((value) => value - 1)} className="rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground" aria-label="上个月">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-foreground">{monthLabel}</span>
          <button onClick={() => setMonthOffset((value) => value + 1)} className="rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground" aria-label="下个月">
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
                    day !== selectedDate && calEvents[String(day)] && "bg-accent font-bold text-accent-foreground",
                    day !== selectedDate && !calEvents[String(day)] && "text-foreground hover:bg-accent hover:text-accent-foreground",
                    day === now.getDate() && monthOffset === 0 && day !== selectedDate && !calEvents[String(day)] && "font-bold text-primary ring-1 ring-primary/30",
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
              {calEvents[String(selectedDate)] ? (
                <div className="flex items-start gap-2 rounded-lg bg-white p-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-foreground">{calEvents[String(selectedDate)]}</p><p className="text-[10px] text-muted-foreground">{monthLabel} {selectedDate} 日</p></div>
                  <button onClick={() => { const next = { ...calEvents }; delete next[String(selectedDate)]; setCalEvents(next); }} className="rounded-md p-1 text-muted-foreground hover:text-destructive" aria-label="删除事务"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="rounded-lg bg-white p-2 text-[10px] text-muted-foreground">当天暂无事务</div>
              )}
              <div className="flex gap-1.5">
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录一件事务..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
                <button onClick={() => { if (note.trim()) setCalEvents({ ...calEvents, [String(selectedDate)]: note.trim() }); setNote(""); }} className="rounded-lg bg-primary px-2.5 text-[10px] font-bold text-primary-foreground">保存</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 px-3 pb-3">
        <div className="mb-2 flex items-center justify-between px-2"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">常用网页</p><button onClick={() => setShowAddLink((v) => !v)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="添加常用网页"><Plus className="h-3.5 w-3.5" /></button></div>
        {showAddLink && (
          <div className="mb-2 flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2">
            <Input value={linkDraft.label} onChange={(e) => setLinkDraft({ ...linkDraft, label: e.target.value })} placeholder="名称（如：AIGC 工具）" className="h-7 bg-background text-[10px]" />
            <Input value={linkDraft.url} onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addQuickLink()} placeholder="https://..." className="h-7 bg-background text-[10px]" />
            <Button onClick={addQuickLink} className="h-6 rounded-lg bg-primary px-2 text-[10px] text-primary-foreground">添加</Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">{quickLinks.map((item) => <div key={item.label} className="group relative"><a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", item.color)}>{linkIcon(item.icon, "h-3.5 w-3.5")}</span><span className="truncate">{item.label}</span></a><button onClick={() => removeQuickLink(item.label)} className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white shadow group-hover:flex" aria-label={`删除${item.label}`}><Trash2 className="h-2.5 w-2.5" /></button></div>)}</div>
      </div>

      <div className="mt-4 px-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">待办事项</p>
          <Link to="/todos" onClick={onNavigate} className="text-[10px] font-semibold text-primary">查看全部</Link>
        </div>
        <div className="space-y-1">
          {sidebarTodos.map((todo) => (
            <button key={todo.id} onClick={() => toggleSidebarTodo(todo.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white">
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", todo.status === "已完成" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{todo.status === "已完成" && <Check className="h-2.5 w-2.5" />}</span>
              <span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", todo.status === "已完成" ? "text-muted-foreground line-through" : "text-foreground")}>{todo.title}</span>
              <span className="shrink-0 text-[9px] text-muted-foreground">{todo.due}</span>
            </button>
          ))}
          {sidebarTodos.length === 0 && <p className="px-2 py-1 text-[10px] text-muted-foreground">暂无待办</p>}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-sidebar-border bg-white px-4 py-3">
        <AuthCard />
      </div>
    </div>
  );
}
