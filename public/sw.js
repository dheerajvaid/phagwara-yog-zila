// public/sw.js

const CACHE_NAME = 'joinyog-cache-v1';
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add any critical CSS or JS here, like:
  // '/css/main.css', '/js/app.js'
];

// Install & cache
self.addEventListener('install', event => {
  console.log('✅ JoinYog SW Installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
