/* Colador de Links — service worker: instala como app e abre sem internet (só o próprio colador). */
const CACHE = 'colador-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('colador-') && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return; // os sites abertos nas abas não passam por aqui
  e.respondWith((async () => {
    try { const res = await fetch(r); if (res.ok && res.type === 'basic') (await caches.open(CACHE)).put(r, res.clone()).catch(() => {}); return res; }
    catch (err) { const g = await caches.match(r, { ignoreSearch: true }); if (g) return g; throw err; }
  })());
});
