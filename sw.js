// Memory Match PWA - Service Worker
// Version: 2.3.0
// Strategy: Network-first with Cache fallback for offline support

const CACHE_NAME = 'memory-match-v2.3.0';
const RUNTIME_CACHE = 'memory-match-runtime';

// Files to cache immediately on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './logo.png'
];

// ============================================
// Install Event - Cache static assets
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2.3.0...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// ============================================
// Activate Event - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v2.3.0...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// ============================================
// Fetch Event - Network-first with Cache fallback
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        networkFirstStrategy(request)
    );
});

// ============================================
// Network-first Strategy
// Try network first, fallback to cache if offline
// ============================================
async function networkFirstStrategy(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        // Try to fetch from network
        const networkResponse = await fetch(request);
        
        // If successful, cache the response and return it
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache for:', request.url);
        
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // If not in runtime cache, try static cache
        const staticCache = await caches.open(CACHE_NAME);
        const staticResponse = await staticCache.match(request);
        
        if (staticResponse) {
            return staticResponse;
        }

        // If offline and not cached, return offline page or error
        return new Response(
            JSON.stringify({ 
                error: 'Offline and resource not cached',
                message: 'האפליקציה זמינה במצב לא מקוון, אך המשאב המבוקש לא נמצא במטמון'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
                statusText: 'Service Unavailable'
            }
        );
    }
}

// ============================================
// Message Event - Handle messages from app
// ============================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// ============================================
// Background Sync (if supported)
// ============================================
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-game-stats') {
        event.waitUntil(syncGameStats());
    }
});

async function syncGameStats() {
    // Placeholder for future analytics sync
    console.log('[SW] Syncing game statistics...');
    return Promise.resolve();
}

// ============================================
// Push Notifications (future feature)
// ============================================
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Memory Match';
    const options = {
        body: data.body || 'יש לך משחק לא גמור!',
        icon: data.icon || './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: data.url || './',
        actions: [
            { action: 'open', title: 'פתח משחק' },
            { action: 'close', title: 'סגור' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || './')
        );
    }
});

// ============================================
// Periodic Background Sync (future feature)
// ============================================
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'daily-challenge') {
        event.waitUntil(checkDailyChallenge());
    }
});

async function checkDailyChallenge() {
    console.log('[SW] Checking for daily challenge...');
    // Future implementation
    return Promise.resolve();
}

console.log('[SW] Service Worker script loaded');
