import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Image,
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
  { label: "项目总览", path: "/projects", icon: FolderKanban },
  { label: "数据洞察", path: "/analytics", icon: BarChart3 },
  { label: "素材库", path: "/library", icon: Image },
  { label: "设置中心", path: "/settings", icon: Settings },
];
