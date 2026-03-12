// VinDex Service Worker — placeholder
// Full implementation in Phase 5

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass through — no caching yet
  event.respondWith(fetch(event.request));
});
