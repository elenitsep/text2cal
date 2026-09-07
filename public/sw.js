const CACHE = "app-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/index.html"])));
  self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  // Never cache API calls — always go to the network for those.
  if (e.request.url.includes("generativelanguage")) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
