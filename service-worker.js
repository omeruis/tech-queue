/**
 * Service Worker pour TechQueue PWA
 * Permet le fonctionnement hors ligne et la mise en cache
 */

const CACHE_NAME = 'techqueue-v1';
const RUNTIME_CACHE = 'techqueue-runtime';

// Fichiers à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/developer.html',
    '/techlead.html',
    '/css/style.css',
    '/css/developer.css',
    '/css/techlead.css',
    '/css/enhanced-features.css',
    '/js/common.js',
    '/js/peer-service.js',
    '/js/storage.js',
    '/js/notifications.js',
    '/js/developer.js',
    '/js/techlead.js',
    '/js/theme.js',
    '/js/analytics.js',
    '/js/tags.js',
    '/js/push-notifications.js',
    '/js/chat-enhanced.js',
    '/js/knowledge-base.js',
    '/js/gamification.js',
    '/js/keyboard-shortcuts.js',
    '/js/indexed-db.js',
    '/js/data-export.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[Service Worker] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers les API externes (PeerJS, etc.)
    const url = new URL(event.request.url);
    if (!url.origin.includes(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Retourner la réponse en cache si disponible
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Sinon, faire la requête réseau
                return fetch(event.request)
                    .then((response) => {
                        // Ne pas mettre en cache les réponses invalides
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Cloner la réponse
                        const responseToCache = response.clone();

                        // Mettre en cache pour les prochaines fois
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // En cas d'erreur réseau, retourner une page offline si disponible
                        return caches.match('/offline.html');
                    });
            })
    );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Synchronisation:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

/**
 * Synchronise les données locales
 */
async function syncData() {
    try {
        console.log('[Service Worker] Synchronisation des données');
        // Logique de synchronisation ici
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Erreur de synchronisation:', error);
        return Promise.reject(error);
    }
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Notification push reçue');

    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || 'TechQueue';
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Clic sur notification:', event.action);

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

// Messages depuis l'application
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message reçu:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Périodique - nettoyage du cache
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupCache());
    }
});

/**
 * Nettoie le cache excessif
 */
async function cleanupCache() {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();

    // Garder seulement les 50 dernières entrées
    if (requests.length > 50) {
        const toDelete = requests.slice(0, requests.length - 50);
        await Promise.all(toDelete.map(request => cache.delete(request)));
    }
}

console.log('[Service Worker] Chargé');
