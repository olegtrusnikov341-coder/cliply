// Service Worker для Cliply — версия 2
const CACHE_NAME = 'cliply-v2';
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
  '/cliply/favicon.svg',
  '/cliply/manifest.json'
];

// Установка — кешируем статические ресурсы
self.addEventListener('install', (event) => {
  console.log('[SW v2] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v2] Кеширую файлы:', STATIC_ASSETS.length);
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW v2] Не все ресурсы закешены:', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Активация...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW v2] Удаляю старый кеш:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов — сначала кеш, потом сеть
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
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
