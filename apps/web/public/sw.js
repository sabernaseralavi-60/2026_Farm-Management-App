// Minimal, dependency-free service worker for the farm PWA.
// Strategy: network-first for navigations (always try to get the freshest
// app shell), falling back to whatever was cached the last time the device
// had a connection. Static Next.js assets (_next/static, icons, fonts) use
// cache-first since they're content-hashed and never change.
const CACHE_NAME = "farm-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add("/")));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache the API/sync traffic — offline queueing is handled by Dexie,
  // and a stale cached API response here would be actively misleading.
  if (url.pathname.startsWith("/api/")) return;

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") || /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? caches.match("/");
      }),
  );
});
