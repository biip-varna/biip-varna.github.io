/* ================================================================
   sw.js — BIIP Service Worker
   Strategy:
   - Network-first for HTML, data files, CSS, and JS (always fresh)
   - Cache-first for images and other truly static assets
   Provides offline fallback for homepage and key pages.
   ================================================================ */

var CACHE_VERSION = 'biip-v4';
var STATIC_CACHE  = CACHE_VERSION + '-static';
var PAGES_CACHE   = CACHE_VERSION + '-pages';

/* Static assets to pre-cache on install (images/icons only — CSS and JS
   are served network-first so they never need pre-caching here) */
var PRECACHE_ASSETS = [
  '/logo.png',
  '/favicon.ico',
  '/articles.json',
  '/manifest.json',
];

/* HTML pages to pre-cache on install */
var PRECACHE_PAGES = [
  '/index-en.html',
  '/index.html',
  '/regions-en.html',
  '/regions.html',
  '/404.html',
  '/404-en.html',
];

/* ── Install: pre-cache key assets ─────────────────────────────── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function(cache) {
        return cache.addAll(PRECACHE_ASSETS);
      }),
      caches.open(PAGES_CACHE).then(function(cache) {
        return cache.addAll(PRECACHE_PAGES);
      }),
    ]).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: remove old caches ───────────────────────────────── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key.startsWith('biip-') && key !== STATIC_CACHE && key !== PAGES_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: serve from cache or network ───────────────────────── */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  var isHTML = event.request.headers.get('Accept') &&
               event.request.headers.get('Accept').indexOf('text/html') !== -1;

  // Data files change with every publish — must always be fetched fresh
  var isDataFile = url.pathname === '/articles.json' ||
                   url.pathname === '/search-index.json';

  // CSS and JS change on every deploy — always fetch fresh, never serve stale
  var isCssOrJs = url.pathname.indexOf('.css') !== -1 ||
                  url.pathname.indexOf('.js') !== -1;

  if (isHTML || isDataFile || isCssOrJs) {
    // Network-first: always try the network, fall back to cache when offline
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            var cloned = response.clone();
            var cacheName = (isHTML || isCssOrJs) ? PAGES_CACHE : STATIC_CACHE;
            caches.open(cacheName).then(function(cache) {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(function() {
          // Offline: serve cached version
          return caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            // Ultimate fallback for HTML: 404 page
            if (isHTML) {
              var lang = url.pathname.indexOf('-en') !== -1 ? '404-en.html' : '404.html';
              return caches.match('/' + lang);
            }
          });
        })
    );
  } else {
    // Cache-first for truly static assets (images, fonts)
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            var cloned = response.clone();
            caches.open(STATIC_CACHE).then(function(cache) {
              cache.put(event.request, cloned);
            });
          }
          return response;
        });
      })
    );
  }
});
