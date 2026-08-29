/* 灵境 Designer OS — Service Worker（离线缓存，PWA 安装所需） */
const CACHE = "lingjing-v4";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 网络优先，失败回退缓存（页面可离线打开）
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 不缓存 API 请求（Supabase/天气）
  if (url.origin === "https://ljzawblcyuwvioazjhiv.supabase.co" || url.hostname === "wttr.in") return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match("./index.html")))
  );
});
