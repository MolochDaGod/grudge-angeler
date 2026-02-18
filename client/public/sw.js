var CACHE_NAME = 'grudge-angeler-v2';
var STATIC_CACHE = 'grudge-static-v2';

var PRECACHE_URLS = [
  '/',
  '/game',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  var url = new URL(event.request.url);

  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|mp3|wav|ogg)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function() {
            return new Response('', { status: 404 });
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME && name !== STATIC_CACHE;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});
