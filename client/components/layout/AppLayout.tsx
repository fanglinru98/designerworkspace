import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
  title,
  subtitle,
  home = false,
  children,
}: {
  title: string;
  subtitle?: string;
  home?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-[300px] shrink-0 border-r border-sidebar-border lg:block">
        <div className="fixed h-screen w-[300px]">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} home={home} />
        <main className="flex-1 bg-grid-glow px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
