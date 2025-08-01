const CACHE_VERSION = 'v2'; // 🔁 Change this to invalidate old cache
const CACHE_NAME = `joinyog-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS/JS with ?v=123 in HTML or include here
];

self.addEventListener('install', event => {
  console.log('✅ JoinYog SW Installed');
  self.skipWaiting(); // Forces activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('♻️ Activating new SW...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME) // 🧹 Delete old caches
          .map(name => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // 🔁 Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Optionally update the cache
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request); // fallback
      })
  );
});
