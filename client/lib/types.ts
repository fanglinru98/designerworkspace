// Designer OS — 共享数据类型

export type TaskStatus = "未开始" | "设计中" | "已完成";

export interface Task {
  id: string;
  title: string;
  project: string;
  date: string;
  /** 开始日期 YYYY-MM-DD（可选；甘特图条从开始画到截止） */
  start?: string;
  tag: string;
  status: TaskStatus;
  owner: string;
  color: string;
  desc?: string;
  /** 任务独立报价（每个任务价格可不同） */
  price?: number;
}

export type TodoStatus = "未开始" | "进行中" | "已完成";

export interface Todo {
  id: string;
  title: string;
  project: string;
  due: string;
  status: TodoStatus;
  tag: string;
  tagClass: string;
  /** 完成时间戳（ms），用于 24 小时后自动清除 */
  doneAt?: number;
}

/** 排序：未完成在前、已完成沉底；同状态保持原顺序 */
export function sortTodos(todos: Todo[]): Todo[] {
  const undone = todos.filter((t) => t.status !== "已完成");
  const done = todos.filter((t) => t.status === "已完成");
  return [...undone, ...done];
}

/** 清除已完成超过 24 小时的待办 */
export function pruneStaleTodos(todos: Todo[]): Todo[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return todos.filter((t) => !(t.status === "已完成" && t.doneAt && t.doneAt < cutoff));
}

/** 生成下一个任务编号（DSK-xxx） */
export function nextTaskId(tasks: { id: string }[]): string {
  let max = 0;
  tasks.forEach((t) => {
    const m = t.id.match(/DSK-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "DSK-" + String(max + 1).padStart(3, "0");
}

/** 生成下一个待办编号 */
export function nextTodoId(todos: { id: string }[]): string {
  let max = 0;
  todos.forEach((t) => {
    const m = t.id.match(/DSK-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "DSK-" + String(Math.max(max, 99) + 1).padStart(3, "0");
}

/** 任务标签配色 */
export const TASK_TAG_COLORS: Record<string, string> = {
  视觉: "bg-sky-100 text-sky-700",
  组件: "bg-violet-100 text-violet-700",
  灵感: "bg-amber-100 text-amber-700",
  高优先级: "bg-rose-100 text-rose-700",
  调研: "bg-emerald-100 text-emerald-700",
  交付: "bg-teal-100 text-teal-700",
  评审: "bg-orange-100 text-orange-700",
  新增: "bg-slate-100 text-slate-700",
};

/** 待办标签配色 */
export const TODO_TAG_CLASSES: Record<string, string> = {
  高优先级: "bg-pink-100 text-pink-700",
  视觉: "bg-sky-100 text-sky-700",
  组件: "bg-violet-100 text-violet-700",
  评审: "bg-amber-100 text-amber-700",
  调研: "bg-emerald-100 text-emerald-700",
  新增: "bg-slate-100 text-slate-700",
};

/** 项目价格元数据：按项目名记录报价 */
export interface ProjectMeta {
  price: number;
  cat: string;
}

export const fmtPrice = (n: number) => "¥" + (Number(n) || 0).toLocaleString("zh-CN");
