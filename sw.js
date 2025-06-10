// Service Worker for Midas The Lifestyle
// Handles caching for improved performance

const CACHE_NAME = 'midas-luxury-v1';
const STATIC_CACHE = 'midas-static-v1';
const DYNAMIC_CACHE = 'midas-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/utils/performanceOptimizer.js',
    '/utils/accessibilityEnhancer.js',
    '/utils/formValidator.js',
    '/utils/carInventoryManager.js',
    '/utils/bookingCalendar.js',
    '/utils/bookingSystem.js',
    '/utils/paymentSystem.js',
    '/utils/userAuth.js',
    '/utils/vehicleShowcase.js',
    '/utils/imageManager.js',
    '/utils/pwaManager.js',
    '/utils/aiChatbot.js',
    '/utils/advancedAnimations.js',
    '/data/inventory.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap',
    'https://unpkg.com/swiper/swiper-bundle.min.css',
    'https://unpkg.com/swiper/swiper-bundle.min.js',
    'https://js.stripe.com/v3/',
    'https://accounts.google.com/gsi/client'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('SW: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.error('SW: Error caching static assets:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle different types of requests
    if (request.method === 'GET') {
        // Static assets - cache first
        if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
            event.respondWith(cacheFirst(request));
        }
        // Images - cache with fallback
        else if (request.destination === 'image') {
            event.respondWith(cacheWithFallback(request));
        }
        // API calls - network first
        else if (url.pathname.includes('/api/') || url.pathname.includes('.json')) {
            event.respondWith(networkFirst(request));
        }
        // External resources - stale while revalidate
        else if (url.origin !== location.origin) {
            event.respondWith(staleWhileRevalidate(request));
        }
        // Default - network first
        else {
            event.respondWith(networkFirst(request));
        }
    }
});

// Cache first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('SW: Cache first failed:', error);
        return new Response('Offline content not available', { status: 503 });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('SW: Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Content not available offline', { status: 503 });
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Cache with fallback for images
async function cacheWithFallback(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return a fallback image for failed image requests
        return new Response(
            '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" text-anchor="middle" fill="#D4AF37" font-family="Arial" font-size="16">Midas The Lifestyle</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle offline form submissions, bookings, etc.
    console.log('SW: Performing background sync');
}

// Push notifications
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: data.data,
            actions: [
                {
                    action: 'view',
                    title: 'View Details'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

async function syncContent() {
    // Sync inventory data, availability, etc.
    try {
        const response = await fetch('/data/inventory.json');
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put('/data/inventory.json', response);
        }
    } catch (error) {
        console.error('SW: Content sync failed:', error);
    }
}
