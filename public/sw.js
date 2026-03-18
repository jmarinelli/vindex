// VinDex Service Worker
//
// Purpose: PWA installability + static asset caching for faster loads.
// Offline data persistence is handled by Dexie (IndexedDB), not by this SW.
//
// Strategies:
// - Static assets (_next/static/, icons): cache-first (immutable, hashed filenames)
// - Navigation requests: network-first with 3s timeout, with offline fallback.
//   Next.js App Router embeds route-specific RSC data in each page's HTML, so
//   each URL must be cached separately (a shared "app shell" key won't work).
//   When offline and the exact URL is not cached, we redirect to /dashboard
//   (which is precached) so the user lands on the offline-aware dashboard.
// - Everything else: network-only (pass through)

const CACHE_NAME = "vindex-v10";
const PRECACHE = ["/offline.html"];

// Dashboard is precached so there's always an offline entry point.
// Users navigate to inspect pages via client-side routing (no SW involvement),
// so those routes work offline through Dexie without needing a cached HTML shell.
const DASHBOARD_URL = "/dashboard";

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Precache offline fallback page
        await Promise.all(
          PRECACHE.map((url) => cache.add(url).catch(() => {}))
        );
        // Precache the dashboard so offline always has an entry point
        try {
          const response = await fetch(DASHBOARD_URL);
          if (response.ok) {
            await cache.put(DASHBOARD_URL, response);
          }
        } catch {
          // Offline install — dashboard will be cached on first online visit
        }
      })
      .then(() => self.skipWaiting())
  );
});

// ─── Message — cache pages reached via client-side navigation ────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_PAGE") {
    const url = event.data.url;
    if (!url) return;
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Offline — nothing to cache
      }
    });
  }
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

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  // Static assets — cache-first (immutable, hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation — network-first with timeout, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else — pass through to network
});

// ─── Strategies ──────────────────────────────────────────────────────────────

async function navigationHandler(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);

  try {
    // Race the network against a 3s timeout
    const response = await withTimeout(fetch(request), 3000);
    if (response.ok) {
      await cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    // Network failed or timed out — serve from cache
    const cached = await cache.match(url.pathname);
    if (cached) return cached;

    // No cache for this URL — try dashboard as offline entry point
    const dashboardCached = await cache.match(DASHBOARD_URL);
    if (dashboardCached && url.pathname !== DASHBOARD_URL) {
      return Response.redirect(url.origin + DASHBOARD_URL, 302);
    }

    // Last resort — static offline page
    const fallback = await caches.match("/offline.html");
    return (
      fallback ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
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
