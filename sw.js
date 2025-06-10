/**
 * Midas The Lifestyle - Advanced PWA Service Worker
 * Premium offline experience for luxury rentals
 * Version: 2.1.0
 */

const CACHE_NAME = 'midas-luxury-v2.1.0';
const STATIC_CACHE = 'midas-static-v2.1.0';
const DYNAMIC_CACHE = 'midas-dynamic-v2.1.0';
const OFFLINE_PAGE = '/offline.html';
const FALLBACK_IMAGE = '/images/fallback-luxury.jpg';

// Critical assets to cache immediately for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/fleet-details.html',
    '/property-details.html',
    '/offline.html',
    '/script.js',
    '/manifest.json',

    // Enhanced PWA utilities
    '/utils/contrastEnhancer.js',
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
    '/utils/offlineManager.js',
    '/utils/pushNotifications.js',

    // Data files
    '/data/inventory.json',

    // Essential images
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png',
    '/images/fallback-luxury.jpg',

    // External dependencies
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/swiper/swiper-bundle.min.css',
    'https://unpkg.com/swiper/swiper-bundle.min.js'
];

// Install event - cache critical assets for offline functionality
self.addEventListener('install', event => {
    console.log('🚀 Midas PWA: Service Worker installing...');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('📦 Midas PWA: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),

            // Cache offline page
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('📄 Midas PWA: Caching offline page');
                return cache.add(OFFLINE_PAGE);
            })
        ])
        .then(() => {
            console.log('✅ Midas PWA: Installation complete');
            return self.skipWaiting();
        })
        .catch(error => {
            console.error('❌ Midas PWA: Installation failed:', error);
        })
    );
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

// Enhanced push notifications for luxury experience
self.addEventListener('push', event => {
    console.log('📱 Midas PWA: Push notification received');

    let notificationData = {
        title: 'Midas The Lifestyle',
        body: 'You have a new luxury service update',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/badge-72x72.png',
        image: '/images/notification-banner.jpg',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: '/images/icons/action-view.png'
            },
            {
                action: 'book',
                title: 'Book Now',
                icon: '/images/icons/action-book.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/images/icons/action-dismiss.png'
            }
        ],
        tag: 'midas-notification',
        renotify: true
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('❌ Midas PWA: Error parsing notification data:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', event => {
    console.log('🔔 Midas PWA: Notification clicked:', event.action);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        if (event.action === 'view' || event.action === 'book') {
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK',
                                action: event.action,
                                data: event.notification.data
                            });
                            return client.focus();
                        }
                    }
                }

                // Open new window if app not open
                if (event.action === 'view' || event.action === 'book' || !event.action) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
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
