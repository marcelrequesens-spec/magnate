// Guarda la app para que funcione sin conexión. Cambia VERSION al publicar una actualización.
const VERSION = 'magnate-v5-imperio';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Red primero para la página (así llegan las actualizaciones) y caché si no hay conexión.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate';
  e.respondWith(
    isPage
      ? fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
          .catch(() => caches.match('./index.html'))
      : caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
