// Designer OS — 登录/注册弹窗
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, LogIn, LogOut, User } from "lucide-react";
import { login, logout, signup, subscribeAuth, getSession, syncAfterLogin, type DwSession } from "@/lib/supabase";
import { notifyDataChanged } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async () => {
    setErr("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) return setErr("请输入正确的邮箱");
    if (pass.length < 6) return setErr("密码至少 6 位");
    if (mode === "signup" && confirm !== pass) return setErr("两次密码不一致");
    setBusy(true);
    let e: string | null = null;
    try {
      e = mode === "signup" ? await signup(email, pass) : await login(email, pass);
    } catch {
      e = "网络异常，请检查网络后重试";
    }
    if (e) {
      setErr(e);
      setBusy(false);
      return;
    }
    // 登录成功：先关弹窗、解除 busy，再后台同步云端（不等同步结果，避免卡"请稍候…"）
    onClose();
    setBusy(false);
    syncAfterLogin()
      .then(() => notifyDataChanged())
      .catch(() => { /* 同步失败不阻塞界面 */ });
  };

  // portal 到 body：弹窗在侧边栏内渲染会被其层叠上下文困住（被主内容盖住/错位）
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[340px] rounded-3xl border border-border bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
            <User className="h-4 w-4 text-primary-foreground" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">登录灵境 Designer OS</p>
            <p className="text-[11px] text-muted-foreground">数据多端同步 · 随时续上工作</p>
          </div>
        </div>

        <div className="mt-5 flex rounded-full bg-secondary p-0.5">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(""); }}
              className={cn("flex-1 rounded-full py-1.5 text-xs font-bold transition-colors", mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" className="h-10 bg-background text-xs" type="email" />
          <Input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="密码（至少 6 位）" className="h-10 bg-background text-xs" type="password" />
          {mode === "signup" && <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="确认密码" className="h-10 bg-background text-xs" type="password" />}
          {err && <p className="text-[11px] font-semibold text-destructive">{err}</p>}
        </div>

        <Button onClick={submit} disabled={busy} className="mt-4 h-10 w-full gap-1.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {busy ? "请稍候…" : mode === "login" ? "登 录" : "注册并登录"}
        </Button>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          注册即自动登录（无需邮箱验证）· 数据保存在云端，换设备登录即同步
        </p>
      </div>
    </div>,
    document.body
  );
}

/** 侧边栏用户卡片：登录状态展示 + 打开弹窗 */
export function AuthCard() {
  const [session, setSession] = useState<DwSession | null>(() => getSession());
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeAuth((s) => setSession(s)), []);

  return (
    <>
      <button onClick={() => { if (!session) setOpen(true); }} className="mb-2 flex w-full items-center gap-2 rounded-xl bg-white p-2.5 text-left hover:bg-secondary/60">
        {session ? (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-[12px] font-bold text-white">{session.email.charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold text-foreground">{session.email}</span>
              <span className="block truncate text-[10px] text-emerald-600">云端已同步</span>
            </span>
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          </>
        ) : (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-[12px] font-bold text-white">访</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-foreground">未登录</span>
              <span className="block text-[10px] text-muted-foreground">点击登录，数据云端同步</span>
            </span>
            <LogIn className="h-3.5 w-3.5 text-primary" />
          </>
        )}
      </button>
      {session && (
        <button onClick={() => logout()} className="w-full rounded-lg py-1 text-[10px] font-semibold text-muted-foreground hover:text-destructive">
          退出登录
        </button>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
