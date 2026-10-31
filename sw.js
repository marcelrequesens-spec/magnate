// Guarda la app para que funcione sin conexión. Cambia VERSION al publicar una actualización.
// La caché «magnate-datos» guarda una copia de tu progreso y nunca se borra.
const VERSION = 'magnate-v17-prestamos-rivales';
const DATA = 'magnate-datos';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== DATA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Página: intenta la red (máx. 4 s) para recibir actualizaciones; si no hay conexión,
// la red tarda o devuelve otra cosa (wifi de aeropuerto), usa la copia guardada.
async function page(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match('./index.html');
  try {
    const r = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('lento')), 4000))]);
    if (r && r.ok && r.type === 'basic') {
      const text = await r.clone().text();
      if (text.includes('<title>Magnate')) { await cache.put('./index.html', r.clone()); return r; }
    }
    if (cached) return cached;
    return r;
  } catch (err) {
    if (cached) return cached;
    return new Response('<h1>Sin conexión</h1><p>Abre Magnate una vez con internet para poder usarla sin conexión.</p>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.includes('/__datos/')) return;
  if (e.request.mode === 'navigate') { e.respondWith(page(e.request)); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
