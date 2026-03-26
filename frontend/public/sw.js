const CACHE_NAME = 'asf-v1'

// Assets to pre-cache on install
const PRE_CACHE = ['/']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRE_CACHE))
  )
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // Remove outdated caches
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // Only cache GET requests; skip API calls and cross-origin requests
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/')) return

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return response
      })
    })
  )
})
