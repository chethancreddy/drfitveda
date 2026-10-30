// ============================================================
// Dr Fit Veda — Production Service Worker (v2)
// Safe, medical-grade PWA caching policy:
// - NEVER caches /api/*, /admin/*, /professional/*, /customer/*, /login, or authenticated/medical data.
// - Network-first for public HTML navigation with /offline fallback.
// - Stale-while-revalidate for static public assets (/logo.png, /fonts/*, /_next/static/*).
// ============================================================

const CACHE_VERSION = 'drfitveda-pwa-v2'
const PRECACHE_URLS = ['/', '/offline', '/logo.png', '/manifest.json']

const NEVER_CACHE_PREFIXES = [
  '/api/',
  '/admin',
  '/professional',
  '/customer',
  '/login',
  '/register',
  '/auth',
]

function isSensitiveOrDynamicPath(pathname) {
  return NEVER_CACHE_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || pathname.startsWith(prefix)
  )
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION)
            .map(oldKey => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Strictly bypass API routes, authenticated portals, and login flows
  if (isSensitiveOrDynamicPath(url.pathname)) {
    return
  }

  // 1. Navigation requests (HTML pages): Network-first with /offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {})
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedPage = await caches.match(request)
          if (cachedPage) return cachedPage
          const offlineFallback = await caches.match('/offline')
          if (offlineFallback) return offlineFallback
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Dr Fit Veda</title></head><body style="font-family:sans-serif;padding:32px;text-align:center"><h1>You are currently offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()" style="padding:12px 24px;border-radius:99px;background:#5C8CB5;color:#fff;border:none;font-weight:600">Retry</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        })
    )
    return
  }

  // 2. Static assets (/logo.png, /fonts/*, /_next/static/*, images): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/manifest.json'

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(response => {
            if (response && response.ok && response.status === 200) {
              const copy = response.clone()
              caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {})
            }
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      })
    )
  }
})

