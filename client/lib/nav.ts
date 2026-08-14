import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "工作台", path: "/", icon: LayoutDashboard },
  { label: "待办事项", path: "/todos", icon: ListTodo },
  { label: "项目总览", path: "/projects", icon: FolderKanban },
  { label: "设置中心", path: "/settings", icon: Settings },
];
