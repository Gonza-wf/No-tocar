const CACHE_NAME = 'no-tocar-v4';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Instalar y cachear todo
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto, guardando assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Borrando cache viejo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: cache first, network fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si está en cache, devolver
                if (response) {
                    return response;
                }
                // Si no, buscar en red
                return fetch(event.request).then((response) => {
                    // No cachear si no es válido
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Clonar y guardar en cache
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                return new Response(
                    '<html><body style="background:#000;color:#cc0000;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;"><h1>Offline. El botón descansa.</h1></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            })
    );
});
