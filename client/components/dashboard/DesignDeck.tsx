import { FileImage } from "lucide-react";

const backCards = [0, 1, 2, 3, 4];

export default function DesignDeck() {
  return (
    <div className="relative hidden h-56 w-56 shrink-0 select-none items-center justify-center xl:flex">
      {backCards.map((i) => (
        <div
          key={i}
          className="absolute h-40 w-28 rounded-xl border border-white/10 bg-gradient-to-b from-secondary to-secondary/60 shadow-card"
          style={{
            transform: `rotate(${(i - 2) * 9}deg) translateY(${Math.abs(i - 2) * 4}px)`,
            zIndex: i,
          }}
        />
      ))}
      <div
        className="relative z-10 flex h-44 w-32 flex-col justify-between overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-b from-emerald-400/20 to-primary/10 p-3 shadow-glow"
        style={{ transform: "rotate(-4deg)" }}
      >
        <div className="flex items-center justify-between">
          <FileImage className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-semibold text-primary">2025-Q2</span>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-white">87%</p>
          <p className="text-[10px] text-white/60">完成度</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[87%] rounded-full bg-primary" />
        </div>
        <p className="truncate text-[10px] font-medium text-white/70">
          首页视觉稿 · v3
        </p>
      </div>
    </div>
  );
}
