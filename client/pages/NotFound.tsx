import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid-glow px-6 text-foreground">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-5 text-5xl font-extrabold">404</h1>
        <p className="mt-3 text-muted-foreground">
          这个页面不存在，或许它去灵感库里探险了。
        </p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90">
          <Link to="/">返回工作台</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
