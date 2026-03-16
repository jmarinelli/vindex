// VinDex Service Worker
// Strategies: stale-while-revalidate for app shell, network-first for API/server actions
// Runtime caching only — no pre-cache of authenticated routes.
// All cache.match() calls use ignoreVary to work around Next.js App Router
// Vary headers (RSC, Next-Router-State-Tree, Next-Router-Prefetch) that
// prevent cache hits on direct navigation.

const CACHE_NAME = "vindex-v3";
const MATCH_OPTS = { ignoreVary: true };

// Only pre-cache truly static assets that always return 200
const PRECACHE = ["/manifest.json", "/favicon.ico", "/offline.html"];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // Cache each resource individually so one failure doesn't break install
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(url).catch(() => {
              // Non-critical — SW installs even if a resource fails
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  // Delete old caches when a new SW version activates
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests (server actions are POST)
  if (request.method !== "GET") return;

  // API routes and auth — always network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js internal data fetches — network-first
  if (url.pathname.startsWith("/_next/data/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (_next/static) — cache-first (immutable, hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Icons and other static files — cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages) — stale-while-revalidate with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

/**
 * Navigation handler: stale-while-revalidate with offline fallback page.
 * Pages are cached as the user visits them while online.
 * If offline and no cache exists, show the offline fallback.
 */
async function navigationHandler(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, MATCH_OPTS);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaqueredirect") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(async () => {
      // Network failed — return cached version or offline fallback
      if (cached) return cached;
      const fallback = await caches.match("/offline.html", MATCH_OPTS);
      return (
        fallback ||
        new Response("Offline", { status: 503, statusText: "Offline" })
      );
    });

  return cached || fetchPromise;
}

/**
 * Network-first: try network, fall back to cache.
 * Used for API routes and dynamic data.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, MATCH_OPTS);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

/**
 * Cache-first: serve from cache, fall back to network.
 * Used for immutable static assets (hashed filenames).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH_OPTS);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

/**
 * Stale-while-revalidate: serve from cache immediately, update cache in background.
 * Used for non-navigation resources.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, MATCH_OPTS);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
