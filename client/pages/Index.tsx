import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Lightbulb,
  PenTool,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import DesignDeck from "@/components/dashboard/DesignDeck";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "doing" | "done";

interface Task {
  id: string;
  title: string;
  tag: string;
  tagClass: string;
  assignee: string;
  date: string;
  status: TaskStatus;
}

interface TaskGroup {
  name: string;
  tasks: Task[];
}

const taskGroups: TaskGroup[] = [
  {
    name: "灵感收集",
    tasks: [
      {
        id: "DSK-014",
        title: "竞品视觉趋势调研",
        tag: "调研",
        tagClass: "bg-sky-400/10 text-sky-300",
        assignee: "陈",
        date: "05-20",
        status: "done",
      },
      {
        id: "DSK-015",
        title: "品牌色板与情绪板整理",
        tag: "灵感",
        tagClass: "bg-violet-400/10 text-violet-300",
        assignee: "房",
        date: "05-22",
        status: "doing",
      },
    ],
  },
  {
    name: "视觉设计",
    tasks: [
      {
        id: "DSK-021",
        title: "首页视觉稿 v3 精修",
        tag: "高优先级",
        tagClass: "bg-primary/10 text-primary",
        assignee: "房",
        date: "05-24",
        status: "doing",
      },
      {
        id: "DSK-022",
        title: "移动端适配与组件切图",
        tag: "视觉",
        tagClass: "bg-amber-400/10 text-amber-300",
        assignee: "林",
        date: "05-25",
        status: "todo",
      },
      {
        id: "DSK-023",
        title: "图标系统统一规范",
        tag: "组件",
        tagClass: "bg-sky-400/10 text-sky-300",
        assignee: "陈",
        date: "05-26",
        status: "todo",
      },
    ],
  },
  {
    name: "设计评审 · 交付",
    tasks: [
      {
        id: "DSK-030",
        title: "设计评审会 · 核心页面",
        tag: "评审",
        tagClass: "bg-rose-400/10 text-rose-300",
        assignee: "周",
        date: "05-28",
        status: "todo",
      },
      {
        id: "DSK-031",
        title: "标注文档与切图交付",
        tag: "交付",
        tagClass: "bg-emerald-400/10 text-emerald-300",
        assignee: "房",
        date: "05-30",
        status: "todo",
      },
    ],
  },
];

const stats = [
  {
    label: "今日待办",
    value: 12,
    delta: "+20%",
    up: true,
    icon: ClipboardList,
    iconClass: "bg-sky-400/10 text-sky-300",
  },
  {
    label: "设计中",
    value: 8,
    delta: "+8%",
    up: true,
    icon: PenTool,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    label: "已完成",
    value: 24,
    delta: "+15%",
    up: true,
    icon: CheckCircle2,
    iconClass: "bg-emerald-400/10 text-emerald-300",
  },
  {
    label: "已延期",
    value: 2,
    delta: "-40%",
    up: false,
    icon: AlertTriangle,
    iconClass: "bg-rose-400/10 text-rose-300",
  },
];

const suggestions = [
  "建议先跟视觉团队对齐首页文档结构",
  "检测到近期风险，需求范围有变化",
  "已发现 3 处组件不一致，建议统一规范",
];

const timelineTasks = [
  { label: "灵感收集", range: "05-19 ~ 05-24", left: 4, width: 18, color: "bg-sky-400" },
  { label: "视觉稿设计", range: "05-22 ~ 05-30", left: 20, width: 30, color: "bg-primary" },
  { label: "设计评审", range: "05-28 ~ 06-02", left: 48, width: 16, color: "bg-amber-400" },
  { label: "交付验收", range: "06-01 ~ 06-08", left: 62, width: 22, color: "bg-emerald-400" },
];

const tabs: { key: "all" | TaskStatus; label: string }[] = [
  { key: "all", label: "全部任务" },
  { key: "doing", label: "进行中" },
  { key: "done", label: "已完成" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<"all" | TaskStatus>("all");

  const filteredGroups = useMemo(
    () =>
      taskGroups
        .map((group) => ({
          ...group,
          tasks:
            activeTab === "all"
              ? group.tasks
              : group.tasks.filter((t) => t.status === activeTab),
        }))
        .filter((group) => group.tasks.length > 0),
    [activeTab],
  );

  return (
    <AppLayout title="设计工作台" subtitle="高效规划、智能协同、结果驱动">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-card animate-fade-up sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    s.iconClass,
                  )}
                >
                  <s.icon className="h-[18px] w-[18px]" />
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    s.up ? "text-primary" : "text-rose-400",
                  )}
                >
                  {s.up ? "↑" : "↓"} {s.delta}
                </span>
              </div>
              <p className="mt-4 text-2xl font-extrabold text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                任务看板 · 品牌重塑项目
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row">
              <div className="min-w-0 flex-1 space-y-5">
                {filteredGroups.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    该分类下暂无任务
                  </p>
                )}
                {filteredGroups.map((group) => (
                  <div key={group.name}>
                    <div className="mb-2 flex items-center gap-2">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">
                        {group.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {group.tasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3.5 py-3 transition-colors hover:border-primary/40"
                        >
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              task.status === "done"
                                ? "bg-emerald-400"
                                : task.status === "doing"
                                  ? "bg-primary"
                                  : "bg-muted-foreground/50",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm font-medium text-foreground",
                                task.status === "done" &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {task.title}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {task.id}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "hidden shrink-0 border-none sm:inline-flex",
                              task.tagClass,
                            )}
                          >
                            {task.tag}
                          </Badge>
                          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                            {task.date}
                          </span>
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                              {task.assignee}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <DesignDeck />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">AI 灵感助手</h3>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                已优化
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-secondary/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  DSK-2025-021
                </span>
                <Badge className="border-none bg-primary/15 text-primary">
                  高优先级
                </Badge>
              </div>
              <p className="mt-1.5 text-sm font-bold text-foreground">
                首页视觉稿评审会
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                针对首页新版视觉稿，对齐核心目标与结果，输出评审结论。
              </p>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">负责人</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                        房
                      </AvatarFallback>
                    </Avatar>
                    房琳茹
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">所属项目</span>
                  <span className="font-medium text-foreground">品牌重塑 2.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">截止时间</span>
                  <span className="font-medium text-foreground">2025-05-24 18:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">当前状态</span>
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    进行中
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {["视觉稿", "评审", "首页"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-none bg-secondary text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-foreground">
                AI 助手建议
              </p>
              <ul className="mt-2.5 space-y-2.5">
                {suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {s}
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                className="mt-1 h-auto p-0 text-xs text-primary"
              >
                查看建议详情 →
              </Button>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-secondary"
              >
                编辑任务
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90">
                完成任务
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">项目时间线 · 2025 年 5 月</h3>
            <span className="text-xs text-muted-foreground">品牌重塑项目</span>
          </div>

          <div className="mt-5 overflow-x-auto thin-scrollbar">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 border-b border-border pb-2 text-center text-[11px] text-muted-foreground">
                {[19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1].map(
                  (day, i) => (
                    <span
                      key={i}
                      className={cn(
                        "rounded-md py-1",
                        day === 24 &&
                          "bg-primary/15 font-bold text-primary",
                      )}
                    >
                      {day}
                    </span>
                  ),
                )}
              </div>

              <div className="relative mt-4 space-y-4">
                {timelineTasks.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-foreground">
                      {t.label}
                    </span>
                    <div className="relative h-6 flex-1 rounded-full bg-secondary/40">
                      <div
                        className={cn(
                          "absolute top-0 h-6 rounded-full",
                          t.color,
                        )}
                        style={{ left: `${t.left}%`, width: `${t.width}%` }}
                      />
                    </div>
                    <span className="hidden w-32 shrink-0 text-right text-[11px] text-muted-foreground sm:inline">
                      {t.range}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
