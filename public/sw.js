// VinDex Service Worker
// Strategies: stale-while-revalidate for app shell, network-first for API/server actions
// Runtime caching only — no pre-cache of authenticated routes.
//
// Key design decision: navigation requests are cached using the URL pathname
// (not the full Request object) to avoid issues with Next.js App Router's
// Vary headers and streaming responses.

const CACHE_NAME = "vindex-v4";
const MATCH_OPTS = { ignoreVary: true };

// Only pre-cache truly static assets that always return 200
const PRECACHE = ["/manifest.json", "/favicon.ico", "/offline.html"];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
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

  // Navigation requests (HTML pages) — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(url));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

/**
 * Navigation handler: network-first with offline fallback.
 * Uses the URL pathname+origin as the cache key (not the Request object)
 * to avoid Vary header and streaming issues with Next.js App Router.
 */
async function navigationHandler(url) {
  // Use a clean URL (no query params) as cache key
  const cacheKey = url.origin + url.pathname;
  const cache = await caches.open(CACHE_NAME);

  try {
    // Always try network first for navigation
    const response = await fetch(cacheKey);
    if (response.ok) {
      // Read full body to avoid streaming issues, then cache a complete copy
      const body = await response.arrayBuffer();
      const headers = new Headers(response.headers);
      // Remove Vary to ensure future cache matches work
      headers.delete("vary");

      const cacheResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(cacheKey, cacheResponse);

      // Return a fresh response with the same body
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    return response;
  } catch {
    // Network failed — try cache, then offline fallback
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const fallback = await cache.match("/offline.html");
    return (
      fallback ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
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
 * Used for non-navigation resources (RSC fetches, etc).
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
