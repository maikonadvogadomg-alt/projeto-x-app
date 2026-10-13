const CACHE_NAME = 'cirurgiao-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/main.js',
  '/js/extractor.js',
  '/js/comparator.js',
  '/js/bug-patcher.js',
  '/js/endpoint-tester.js',
  '/js/git-diff-analyzer.js',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALAÇÃO
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache criado:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Alguns arquivos não puderam ser cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// ATIVAÇÃO
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ESTRATÉGIA: Network First (para APIs), Cache First (para assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIs externas (Network First)
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Sem conexão com a API' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Assets locais (Cache First)
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Não cachear respostas inválidas
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar a resposta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback quando offline
        return new Response(
          '<h1>Você está offline</h1><p>Alguns recursos podem não estar disponíveis.</p>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});

// Background Sync (opcional - para sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chats') {
    console.log('[SW] Sincronizando chats...');
    event.waitUntil(
      // Aqui você pode adicionar lógica de sincronização
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker carregado!');
