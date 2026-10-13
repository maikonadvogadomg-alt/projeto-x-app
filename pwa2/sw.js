/* Caça-Bug — service worker: deixa instalar como app e abrir sem internet.
   Sempre busca a versão nova primeiro; a cópia guardada só é usada sem internet. */
const CACHE = 'caca-bug-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('caca-bug-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok && res.type === 'basic') { const c = await caches.open(CACHE); c.put(r, res.clone()).catch(() => {}); }
      return res;
    } catch (err) {
      const g = await caches.match(r, { ignoreSearch: true });
      if (g) return g;
      throw err;
    }
  })());
});
