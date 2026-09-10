/* ============================================================================
 * 灵境 Designer OS — Service Worker
 * 缓存名：lingjing-v6
 * 位置：public/sw.js  →  构建后为 dist/spa/sw.js  →  部署到 gh-pages 根目录
 * ----------------------------------------------------------------------------
 *  ★★★  每次发版必须修改下面的 CACHE 名（lingjing-v6 → lingjing-v7 → v8 …）★★★
 *
 *  为什么：CACHE 名不变时，activate 阶段的「清理旧缓存」永远不会触发，
 *  老用户的浏览器会一直命中旧缓存。表现就是「代码改了、git 也推了，
 *  但手机 / 浏览器打开还是旧版」——而且这种问题不会报错，极难排查。
 *  「只改代码、不改这里」= 线上不会更新。
 *  配套动作：deploy 脚本的 commit message 里也带上新的缓存名，便于回溯。
 * ==========================================================================*/

const CACHE = "lingjing-v6";
const OFFLINE_URL = "./index.html";

/* 预缓存清单：必须离线可用的最小集合
 * ⚠️ 这里的每一项都必须在 public/ 里真实存在。
 * 旧版用 `caches.addAll(CORE)`，只要有任意一项 404（当时 icon-192.png、
 * icon-512.png 就根本不存在），整个 addAll 会 reject → install 事件失败 →
 * SW 永远无法激活 → 离线能力和"添加到主屏幕"全部失效。
 * 所以这里改为逐个 add + Promise.allSettled 吞错：缺一个资源不会拖垮整个 PWA。 */
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const results = await Promise.allSettled(CORE.map((url) => cache.add(url)));
      results.forEach((r, i) => {
        if (r.status === "rejected") console.warn("[SW] 预缓存失败，已跳过:", CORE[i]);
      });
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE && k.startsWith("lingjing-"))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* 不走 SW 的请求：第三方接口、非 GET、分片请求、非 http(s) 协议
 * 旧版只排除了 supabase 与 wttr.in 两个域名，缺的地方见《PWA自查清单.md》第 5 条。 */
const BYPASS_HOSTS = ["wttr.in", "api.github.com"];
const BYPASS_ORIGINS = ["https://ljzawblcyuwvioazjhiv.supabase.co"];

function shouldBypass(request, url) {
  if (request.method !== "GET") return true;            // POST/PUT 等一律不碰
  if (!/^https?:$/.test(url.protocol)) return true;     // chrome-extension: 等
  if (request.headers.has("range")) return true;        // 206 分片：缓存会破坏断点/分段加载
  if (BYPASS_HOSTS.includes(url.hostname)) return true;
  if (BYPASS_ORIGINS.includes(url.origin)) return true;
  if (url.origin !== self.location.origin) return true; // 其余跨域一律不碰
  return false;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (shouldBypass(event.request, url)) return;

  // ---- 页面导航：网络优先，强制校验，失败回退缓存的 index.html ----
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(event.request, { cache: "no-cache" });
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(OFFLINE_URL, copy)).catch(() => {});
          }
          return res;
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // ---- 同源静态资源：网络优先 → 回退缓存 ----
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(event.request);
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.destination === "document") {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
        return Response.error();
      }
    })()
  );
});
