// Service Worker для Cliply — версия 7
const CACHE_NAME = 'cliply-v7';
const STATIC_ASSETS = [
  '/cliply/',
  '/cliply/index.html',
  '/cliply/login.html',
  '/cliply/dashboard.html',
  '/cliply/features.html',
  '/cliply/pricing.html',
  '/cliply/examples.html',
  '/cliply/settings.html',
  '/cliply/admin.html',
  '/cliply/auth.js',
  '/cliply/toast.js',
  '/cliply/toast.css',
  '/cliply/skeleton.js',
  '/cliply/skeleton.css',
  '/cliply/transitions.js',
  '/cliply/transitions.css',
  '/cliply/scrollbar.css',
  '/cliply/micro-animations.js',
  '/cliply/micro-animations.css',
  '/cliply/draft.js',
  '/cliply/network.js',
  '/cliply/visual-effects.css',
  '/cliply/mobile.css',
  '/cliply/favicon.svg',
  '/cliply/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW v7] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW v7] Не все ресурсы закешены:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v7] Активация...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW v7] Удаляю старый кеш:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match('/cliply/index.html');
      });
    })
  );
});
