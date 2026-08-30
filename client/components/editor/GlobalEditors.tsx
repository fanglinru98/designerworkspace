// Designer OS — 全局任务/待办编辑弹窗（通过事件桥打开，任意按钮可触发）
import { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { useDw } from "@/lib/store";
import {
  TASK_TAG_COLORS,
  TODO_TAG_CLASSES,
  nextTaskId,
  nextTodoId,
  type Task,
  type TaskStatus,
  type Todo,
  type TodoStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------- 事件桥 ----------
export function openTaskEditor(task?: Task | null) {
  window.dispatchEvent(new CustomEvent("dw:edit-task", { detail: task ?? null }));
}
export function openTodoEditor(todo?: Todo | null) {
  window.dispatchEvent(new CustomEvent("dw:edit-todo", { detail: todo ?? null }));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-5 flex items-center gap-2">{footer}</div>
      </div>
    </div>
  );
}

// ---------- 任务编辑 ----------
const taskTags = Object.keys(TASK_TAG_COLORS);
const taskStatuses: TaskStatus[] = ["未开始", "设计中", "已完成"];

function TaskEditor() {
  const [tasks, setTasks] = useDw<Task[]>("projects", []);
  const [target, setTarget] = useState<Task | null | undefined>(undefined);
  const [form, setForm] = useState<{ title: string; project: string; date: string; start: string; tag: string; status: TaskStatus; owner: string; desc: string; price: string }>({ title: "", project: "", date: "", start: "", tag: "新增", status: "未开始", owner: "我", desc: "", price: "" });

  useEffect(() => {
    const h = (e: Event) => {
      const task = (e as CustomEvent).detail as Task | null;
      setTarget(task ?? null);
      setForm(task ? { title: task.title, project: task.project, date: task.date, start: task.start || "", tag: task.tag, status: task.status, owner: task.owner, desc: task.desc || "", price: task.price ? String(task.price) : "" } : { title: "", project: "", date: new Date().toISOString().slice(0, 10), start: "", tag: "新增", status: "未开始", owner: "我", desc: "", price: "" });
    };
    window.addEventListener("dw:edit-task", h);
    return () => window.removeEventListener("dw:edit-task", h);
  }, []);

  if (target === undefined) return null;

  const close = () => setTarget(undefined);
  const save = () => {
    if (!form.title.trim()) return;
    const price = form.price.trim() === "" ? undefined : (parseInt(form.price, 10) || 0);
    const start = form.start.trim() || undefined;
    if (target) {
      setTasks(tasks.map((t) => t.id === target.id ? { ...t, ...form, start, title: form.title.trim(), price } : t));
    } else {
      const task: Task = { id: nextTaskId(tasks), ...form, start, title: form.title.trim(), price, color: TASK_TAG_COLORS[form.tag] || TASK_TAG_COLORS["新增"] };
      setTasks([...tasks, task]);
    }
    close();
  };
  const remove = () => {
    if (target) setTasks(tasks.filter((t) => t.id !== target.id));
    close();
  };

  return (
    <ModalShell title={target ? "编辑任务" : "新增任务"} onClose={close} footer={<>
      {target && <Button variant="ghost" onClick={remove} className="mr-auto h-9 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>}
      <Button variant="outline" onClick={close} className="h-9 px-3 text-xs">取消</Button>
      <Button onClick={save} className="h-9 gap-1.5 px-4 text-xs"><Save className="h-3.5 w-3.5" />保存</Button>
    </>}>
      <Field label="任务标题"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="输入任务标题..." className="h-9 bg-background text-xs" autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="所属项目"><Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="如：品牌重塑 2.0" className="h-9 bg-background text-xs" /></Field>
        <Field label="负责人"><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="姓名" className="h-9 bg-background text-xs" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="开始日期（可选）"><Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="h-9 bg-background text-xs" /></Field>
        <Field label="截止日期"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 bg-background text-xs" /></Field>
      </div>
      <Field label="报价 ¥"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="每个任务独立报价" className="h-9 bg-background text-xs" /></Field>
      <Field label="状态">
        <div className="flex rounded-lg bg-secondary p-0.5">{taskStatuses.map((s) => <button key={s} onClick={() => setForm({ ...form, status: s })} className={cn("flex-1 rounded-md py-1.5 text-[10px] font-bold", form.status === s ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>{s}</button>)}</div>
      </Field>
      <Field label="标签">
        <div className="flex flex-wrap gap-1.5">{taskTags.map((tag) => <button key={tag} onClick={() => setForm({ ...form, tag })} className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors", form.tag === tag ? cn("ring-2 ring-primary ring-offset-1", TASK_TAG_COLORS[tag]) : cn(TASK_TAG_COLORS[tag], "opacity-50 hover:opacity-90"))}>{tag}</button>)}</div>
      </Field>
      <Field label="任务描述"><textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="补充任务细节..." className="min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></Field>
    </ModalShell>
  );
}

// ---------- 待办编辑 ----------
const todoStatuses: TodoStatus[] = ["未开始", "进行中", "已完成"];
const todoTags = Object.keys(TODO_TAG_CLASSES);

function TodoEditor() {
  const [items, setItems] = useDw<Todo[]>("todos", []);
  const [target, setTarget] = useState<Todo | null | undefined>(undefined);
  const [form, setForm] = useState<{ title: string; project: string; due: string; status: TodoStatus; tag: string }>({ title: "", project: "", due: "", status: "未开始", tag: "新增" });

  useEffect(() => {
    const h = (e: Event) => {
      const todo = (e as CustomEvent).detail as Todo | null;
      setTarget(todo ?? null);
      setForm(todo ? { title: todo.title, project: todo.project, due: todo.due, status: todo.status, tag: todo.tag } : { title: "", project: "", due: "今天", status: "未开始", tag: "新增" });
    };
    window.addEventListener("dw:edit-todo", h);
    return () => window.removeEventListener("dw:edit-todo", h);
  }, []);

  if (target === undefined) return null;

  const close = () => setTarget(undefined);
  const save = () => {
    if (!form.title.trim()) return;
    if (target) {
      setItems(items.map((t) => t.id === target.id ? { ...t, ...form, title: form.title.trim(), doneAt: form.status === "已完成" ? (t.doneAt || Date.now()) : undefined } : t));
    } else {
      const todo: Todo = { id: nextTodoId(items), ...form, title: form.title.trim(), tagClass: TODO_TAG_CLASSES[form.tag] || TODO_TAG_CLASSES["新增"], doneAt: form.status === "已完成" ? Date.now() : undefined };
      setItems([...items, todo]);
    }
    close();
  };
  const remove = () => {
    if (target) setItems(items.filter((t) => t.id !== target.id));
    close();
  };

  return (
    <ModalShell title={target ? "编辑待办" : "新增待办"} onClose={close} footer={<>
      {target && <Button variant="ghost" onClick={remove} className="mr-auto h-9 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>}
      <Button variant="outline" onClick={close} className="h-9 px-3 text-xs">取消</Button>
      <Button onClick={save} className="h-9 gap-1.5 px-4 text-xs"><Save className="h-3.5 w-3.5" />保存</Button>
    </>}>
      <Field label="待办标题"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="输入待办标题..." className="h-9 bg-background text-xs" autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="所属项目"><Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="如：品牌重塑 2.0" className="h-9 bg-background text-xs" /></Field>
        <Field label="截止"><Input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} placeholder="今天 / 明天 / 05月28日" className="h-9 bg-background text-xs" /></Field>
      </div>
      <Field label="状态">
        <div className="flex rounded-lg bg-secondary p-0.5">{todoStatuses.map((s) => <button key={s} onClick={() => setForm({ ...form, status: s })} className={cn("flex-1 rounded-md py-1.5 text-[10px] font-bold", form.status === s ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>{s}</button>)}</div>
      </Field>
      <Field label="标签">
        <div className="flex flex-wrap gap-1.5">{todoTags.map((tag) => <button key={tag} onClick={() => setForm({ ...form, tag })} className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors", form.tag === tag ? cn("ring-2 ring-primary ring-offset-1", TODO_TAG_CLASSES[tag]) : cn(TODO_TAG_CLASSES[tag], "opacity-50 hover:opacity-90"))}>{tag}</button>)}</div>
      </Field>
    </ModalShell>
  );
}

/** 挂载全局编辑弹窗（App 里放一次即可） */
export default function GlobalEditors() {
  return <><TaskEditor /><TodoEditor /></>;
}
