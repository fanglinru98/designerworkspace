import { useEffect, useMemo, useState } from "react";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { openTaskEditor } from "@/components/editor/GlobalEditors";
import { useDw } from "@/lib/store";
import { type Task, type Todo } from "@/lib/types";

function useWeather(): string {
  const [temp, setTemp] = useState<string>("--℃");
  useEffect(() => {
    let alive = true;
    fetch("https://wttr.in/?format=j1")
      .then((r) => r.json())
      .then((j) => {
        const t = j?.current_condition?.[0]?.temp_C;
        if (alive && t !== undefined) setTemp(t + "℃");
      })
      .catch(() => { /* 离线/失败显示占位 */ });
    return () => { alive = false; };
  }, []);
  return temp;
}

export default function Topbar({ title, subtitle, home = false }: { title: string; subtitle?: string; home?: boolean }) {
  const [tasks] = useDw<Task[]>("projects", []);
  const [todos] = useDw<Todo[]>("todos", []);
  const temp = useWeather();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // 顶部提醒：到期项目 + 未进行待办（仅在有时才提示）
  const dueProjects = useMemo(() => tasks.filter((t) => t.status !== "已完成" && t.date).length, [tasks]);
  const pendingTodos = useMemo(() => todos.filter((t) => t.status !== "已完成").length, [todos]);
  const reminders = useMemo(() => {
    const parts: string[] = [];
    if (dueProjects > 0) parts.push(`你有 ${dueProjects} 个项目即将到截止日期`);
    if (pendingTodos > 0) parts.push(`你有 ${pendingTodos} 个待办还未进行`);
    return parts.join(" · ");
  }, [dueProjects, pendingTodos]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 text-foreground/70 lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {home ? (
        /* 首页问候模式：早上好 + 提醒小字 */
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-wide text-foreground">{greeting}，迟海</h1>
          {reminders ? <p className="truncate text-xs font-medium text-primary">{reminders}</p> : <p className="truncate text-xs text-muted-foreground">今天也没有截止压力，从容推进</p>}
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-wide text-foreground sm:text-xl">{title}</h1>
          {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full bg-white/60 px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur md:inline-block">{dateStr} · 气温 {temp}</span>
        {home && (
          <Button onClick={() => openTaskEditor(null)} className="h-9 gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background hover:bg-foreground/90"><Plus className="h-3.5 w-3.5" />新增任务</Button>
        )}
      </div>
    </header>
  );
}
