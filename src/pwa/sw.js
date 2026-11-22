// Cache toàn bộ app để chạy offline. Đổi VERSION mỗi lần sửa file.
var VERSION = 'tet-countdown-v2';
var FILES = [
  './',
  'index.html',
  'style.css',
  'lunar.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'fonts/playfair-display-latin-400-normal.woff2',
  'fonts/playfair-display-latin-700-normal.woff2',
  'fonts/playfair-display-latin-400-italic.woff2',
  'fonts/playfair-display-vietnamese-400-normal.woff2',
  'fonts/playfair-display-vietnamese-700-normal.woff2',
  'fonts/playfair-display-vietnamese-400-italic.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    return hit || fetch(e.request);
  }));
});
