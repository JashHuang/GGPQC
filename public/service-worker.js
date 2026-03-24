/* eslint-env serviceworker */
const CACHE_NAME = 'gm-v6-bg-cache-v1';
const MAX_CACHE_SIZE = 20;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (!isImageRequest(url)) {
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

const isImageRequest = (url) => {
  return (
    url.hostname.includes('pexels.com') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('pexels') ||
    url.hostname.includes('loremflickr') ||
    url.hostname.includes('picsum') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp')
  );
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        
        trimCache(cache);
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise;
};

const trimCache = async (cache) => {
  const keys = await cache.keys();
  if (keys.length >= MAX_CACHE_SIZE) {
    await cache.delete(keys[0]);
  }
};
