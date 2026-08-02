import { Link, useLocation } from "react-router-dom";
import { Shapes, ChevronsUpDown } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-300 shadow-glow">
          <Shapes className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-tight text-white">灵境</p>
          <p className="text-[11px] leading-tight text-sidebar-foreground/60">
            Design Workbench
          </p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 thin-scrollbar">
        {navItems.map((item) => {
          const active =
            item.path === "/"
              ? pathname === "/"
              : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/50 group-hover:text-primary",
                )}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/45">
            我的工作区
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-white">
            视觉设计部 · 品牌重塑
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[13px] font-bold text-emerald-950">
          房
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">房琳茹</p>
          <p className="truncate text-[11px] text-sidebar-foreground/55">
            高级视觉设计师
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/40" />
      </div>
    </div>
  );
}
