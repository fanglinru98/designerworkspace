import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "页面不存在 — 灵境 Designer OS";
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Compass className="h-7 w-7 text-primary" />
      </div>
      <p className="mt-6 text-5xl font-extrabold tracking-tight text-foreground">404</p>
      <p className="mt-2 text-sm text-muted-foreground">
        这个页面不存在或已被移动 · {pathname}
      </p>
      <Button asChild className="mt-6 rounded-full bg-primary px-5 text-xs text-primary-foreground shadow-glow hover:bg-primary/90">
        <Link to="/">回到工作台</Link>
      </Button>
    </div>
  );
}
