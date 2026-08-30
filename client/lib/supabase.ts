// Designer OS — Supabase 认证 + 云端同步模块（纯 fetch，无 SDK 依赖）
// 复用 GO RUN 已验证的模式：/auth/v1 认证 + /rest/v1 upsert + 时间戳合并同步

export const SB_URL = "https://ljzawblcyuwvioazjhiv.supabase.co";
export const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqemF3YmxjeXV3dmlvYXpqaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzY0NDAsImV4cCI6MjEwMjAxMjQ0MH0._osewlf207aS9K78wdDt1EoZbrlIzfcfr2suenWFe4E";

// 需要云端同步的数据 key（localStorage 前缀 dw_，表 dw_data 的 data_key）
export const SYNC_KEYS = ["projects", "todos", "calendar", "sidebar"];

export interface DwSession {
  token: string;
  email: string;
  uid: string;
  refresh?: string;
}

let session: DwSession | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
const authListeners = new Set<(s: DwSession | null) => void>();

try {
  const raw = localStorage.getItem("dw_session");
  if (raw) session = JSON.parse(raw);
} catch {
  /* ignore */
}

export function isLoggedIn(): boolean {
  return !!session;
}

export function getSession(): DwSession | null {
  return session;
}

export function subscribeAuth(fn: (s: DwSession | null) => void): () => void {
  authListeners.add(fn);
  return () => {
    authListeners.delete(fn);
  };
}

function notifyAuth() {
  authListeners.forEach((fn) => fn(session));
}

interface ApiOpts {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

function api(path: string, opts: ApiOpts = {}) {
  const headers: Record<string, string> = {
    apikey: SB_KEY,
    ...(opts.headers ?? {}),
  };
  if (!headers["Authorization"] && session) {
    headers["Authorization"] = "Bearer " + session.token;
  }
  const init: RequestInit = { method: opts.method, headers };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  // 15s 超时：网络慢/断时不再无限挂起按钮的"请稍候…"
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  init.signal = ctrl.signal;
  return fetch(SB_URL + path, init)
    .then(async (r) => {
      let body: unknown = null;
      try {
        body = await r.json();
      } catch {
        /* no body */
      }
      return { ok: r.ok, status: r.status, body: body as any };
    })
    .catch(() => ({ ok: false, status: 0, body: { msg: "网络异常，请检查网络后重试" } }))
    .finally(() => clearTimeout(timer));
}

function saveSession(tk: string, email: string, uid: string, refresh?: string) {
  session = { token: tk, email, uid, refresh };
  try {
    localStorage.setItem("dw_session", JSON.stringify(session));
  } catch {
    /* ignore */
  }
  notifyAuth();
}

function clearSession() {
  session = null;
  try {
    localStorage.removeItem("dw_session");
  } catch {
    /* ignore */
  }
  notifyAuth();
}

// ---------- 认证 ----------

export async function signup(email: string, password: string): Promise<string | null> {
  const r = await api("/auth/v1/signup", { method: "POST", body: { email, password } });
  if (r.ok && (r.body?.id || r.body?.user)) {
    saveSession(
      r.body.access_token,
      email,
      r.body.user?.id || r.body.id,
      r.body.refresh_token,
    );
    return null;
  }
  return r.body?.msg || "注册失败，请重试";
}

export async function login(email: string, password: string): Promise<string | null> {
  const r = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });
  if (r.ok && r.body?.access_token) {
    saveSession(r.body.access_token, email, r.body.user.id, r.body.refresh_token);
    return null;
  }
  return r.body?.msg || r.body?.error_description || "登录失败，请重试";
}

export function logout() {
  clearSession();
}

// ---------- 同步 ----------

function lsGet(key: string) {
  try {
    const v = localStorage.getItem("dw_" + key);
    return v === null ? null : JSON.parse(v);
  } catch {
    return null;
  }
}

function tsGet(key: string): number {
  try {
    return parseInt(localStorage.getItem("dw_ts_" + key) || "0", 10);
  } catch {
    return 0;
  }
}

function pushKey(key: string) {
  const v = lsGet(key);
  if (v === null || !session) return;
  api("/rest/v1/dw_data?on_conflict=user_id,data_key", {
    method: "POST",
    body: { user_id: session.uid, data_key: key, data: v, updated_at: new Date().toISOString() },
  });
}

/** 数据变更后调用：防抖 600ms 推送云端 */
export function schedulePush() {
  if (!session) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    SYNC_KEYS.forEach(pushKey);
  }, 600);
}

/** 拉取云端并合并：云端新覆盖本地，本地新推云端。返回是否有云端数据（行数>0） */
export async function pullMerge(): Promise<boolean> {
  if (!session) return false;
  const r = await api(
    "/rest/v1/dw_data?select=data_key,data,updated_at&user_id=eq." + session.uid,
  );
  if (!r.ok) return false;
  const rows = (r.body || []) as { data_key: string; data: unknown; updated_at: string }[];
  rows.forEach((row) => {
    const cloudTs = new Date(row.updated_at).getTime();
    const localTs = tsGet(row.data_key);
    if (cloudTs > localTs) {
      try {
        localStorage.setItem("dw_" + row.data_key, JSON.stringify(row.data));
        localStorage.setItem("dw_ts_" + row.data_key, String(cloudTs));
      } catch {
        /* ignore */
      }
    } else if (localTs > cloudTs) {
      pushKey(row.data_key);
    }
  });
  return rows.length > 0;
}

/** 登录/注册完成后：拉云端合并；若云端无数据则把本地（含默认值）推上去 */
export async function syncAfterLogin(): Promise<void> {
  const hadCloud = await pullMerge();
  if (!hadCloud) {
    SYNC_KEYS.forEach(pushKey);
  }
}

/** 启动时恢复登录态；token 过期自动用 refresh_token 续期，然后拉取云端 */
export function restoreSession(): Promise<boolean> {
  if (!session) return Promise.resolve(false);
  return api("/auth/v1/user", { headers: { Authorization: "Bearer " + session.token } }).then(
    (r) => {
      if (r.ok && r.body?.id) {
        session = { token: session!.token, email: r.body.email || session!.email, uid: r.body.id, refresh: session!.refresh };
        notifyAuth();
        return pullMerge();
      }
      if (session?.refresh) {
        return api("/auth/v1/token?grant_type=refresh_token", {
          method: "POST",
          body: { refresh_token: session.refresh },
        }).then((r2) => {
          if (r2.ok && r2.body?.access_token) {
            saveSession(
              r2.body.access_token,
              session!.email,
              r2.body.user?.id || session!.uid,
              r2.body.refresh_token || session!.refresh,
            );
            return pullMerge();
          }
          clearSession();
          return false;
        });
      }
      clearSession();
      return false;
    },
  );
}
