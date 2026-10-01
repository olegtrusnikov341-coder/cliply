// Service Worker для Cliply — версия 12
// Стратегия: Network First (сначала сеть, потом кеш)
const CACHE_NAME = 'cliply-v12';
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
  '/cliply/faq.html',
  '/cliply/support.html',
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
  console.log('[SW v12] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW v12] Не все ресурсы закешены:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v12] Активация...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW v12] Удаляю старый кеш:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Не кешируем запросы к Supabase и CDN
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic') ||
      event.request.method !== 'GET') {
    return;
  }
  
  // Стратегия Network First: сначала пробуем сеть, потом кеш
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если сеть ответила успешно — обновляем кеш
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сети нет — берём из кеша
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/cliply/index.html');
        });
      })
  );
});
