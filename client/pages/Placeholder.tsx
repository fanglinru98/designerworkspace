import { Compass } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function Placeholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <AppLayout title={title} subtitle="敬请期待">
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-5 text-lg font-bold text-foreground">
          {title}页面即将上线
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description ??
            "这个板块正在设计中。继续和我们说说你想在这里看到什么内容，我们会为你生成完整页面。"}
        </p>
      </div>
    </AppLayout>
  );
}
