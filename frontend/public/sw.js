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
  const { request } = e
  // Only handle GET requests on same origin — skip everything else
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Skip cross-origin requests (e.g. upload.muzasufy.com)
  if (url.origin !== location.origin) return
  // Skip API calls
  if (url.pathname.startsWith('/api/')) return
  // Skip socket.io
  if (url.pathname.startsWith('/socket.io')) return

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/))) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return response
      }).catch(() => cached || new Response('', {status: 408}))
    })
  )
})
