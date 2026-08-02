import { Bell, Menu, MessageSquare, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";

export default function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-foreground/70 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索任务、项目或文件..."
          className="h-10 rounded-full border-border bg-secondary/60 pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden text-foreground/70 hover:text-foreground sm:inline-flex"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden text-foreground/70 hover:text-foreground sm:inline-flex"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
        </Button>
        <Button className="h-10 gap-1.5 rounded-full bg-primary px-3.5 text-primary-foreground shadow-glow hover:bg-primary/90 sm:px-4">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">新增任务</span>
        </Button>
      </div>
    </header>
  );
}
