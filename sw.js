// Service worker: keeps the app working offline and makes it installable.
// The app's own files are network-first, so updates arrive without bumping CACHE.
// Bump CACHE only when the SHELL list changes.
const CACHE = 'skill-trainers-v8';

// Relative to this file, so it works under https://<user>.github.io/<repo>/.
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './firebase-config.js',
  './js/app.js',
  './js/store.js',
  './js/stats.js',
  './js/history.js',
  './js/cloud.js',
  './trainers/index.js',
  './trainers/reaction.js',
  './trainers/notes.js',
  './trainers/notes-logic.js',
  './trainers/notes-audio.js',
  './trainers/notes-history.js',
  './trainers/typing.js',
  './trainers/typing-engine.js',
  './trainers/typing-words.js',
  './trainers/typing-history.js',
  './trainers/typing-source.js',
  './trainers/typing-sound.js',
  './trainers/packs/index.js',
  './trainers/packs/quotes.js',
  './trainers/packs/sense-en.js',
  './trainers/packs/sense-pt.js',
  './trainers/packs/sense-gd.js',
  './trainers/packs/sense-mcf.js',
  './trainers/packs/portuguese.js',
  './trainers/packs/gdscript.js',
  './trainers/packs/mcfunction.js',
  './trainers/keyboard.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

// Third-party files that never change at a given URL (versioned SDK, fonts): cache-first.
const STATIC_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    // no-cache: always ask the server if there's something newer (GitHub Pages caches files 10 min).
    const res = await fetch(request, { cache: 'no-cache' });
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ||
      (fallbackUrl && (await cache.match(fallbackUrl))) ||
      Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // The app's own files: network first, so every update shows up on the next open;
    // the cache is only the offline fallback.
    event.respondWith(networkFirst(req, req.mode === 'navigate' ? './index.html' : null));
    return;
  }

  if (STATIC_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req));
  // Everything else (sign-in, database traffic) goes straight to the network.
});
