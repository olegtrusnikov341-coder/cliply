// Service Worker для Cliply — базовый офлайн-кеш
const CACHE_NAME = 'cliply-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Кеш создан:', CACHE_NAME);
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Не все ресурсы закешены:', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов — сначала кеш, потом сеть
self.addEventListener('fetch', (event) => {
  // Не кешируем запросы к Supabase и внешним API
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
        // Кешируем только успешные ответы наших страниц
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Если сеть недоступна — показываем офлайн-страницу
        return caches.match('/cliply/index.html');
      });
    })
  );
});
