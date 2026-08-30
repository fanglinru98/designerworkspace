// Designer OS — 全局数据 store：组件通过 useDw 读写数据，自动本地缓存 + 云端同步
import { useCallback, useEffect, useState } from "react";
import { schedulePush } from "./supabase";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

/** 订阅数据变化（含 pullMerge 后的重读通知） */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 读取某 key 的本地数据，无则返回 fallback */
export function dwGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem("dw_" + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** 写入数据：更新本地 + 时间戳 + 触发云端推送；失败时提示（防静默丢数据） */
export function dwSet(key: string, value: unknown) {
  try {
    localStorage.setItem("dw_" + key, JSON.stringify(value));
    localStorage.setItem("dw_ts_" + key, String(Date.now()));
  } catch {
    try {
      alert("本地存储空间不足（约 5MB），无法保存「" + key + "」数据。请删减图片/视频素材后重试。");
    } catch { /* ignore */ }
  }
  emit();
  schedulePush();
}

/** React hook：读本地数据并订阅变化；setter 支持直接值或函数式更新 */
export function useDw<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => dwGet(key, fallback));
  useEffect(() => {
    const unsub = subscribe(() => setState(dwGet(key, fallback)));
    return unsub;
  }, [key, fallback]);
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === "function" ? (v as (prev: T) => T)(dwGet(key, fallback)) : v;
      dwSet(key, next);
    },
    [key, fallback],
  );
  return [state, set];
}

/** 登录后拉取云端并通知所有组件重读（供登录流程调用） */
export async function mergeFromCloud(pull: () => Promise<boolean>): Promise<boolean> {
  const ok = await pull();
  if (ok) emit();
  return ok;
}

/** 云端数据已写入 localStorage 后调用：通知所有组件重读 */
export function notifyDataChanged() {
  emit();
}
