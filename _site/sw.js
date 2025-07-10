const CACHE_NAME = 'moone-v1';
const STATIC_CACHE_NAME = 'moone-static-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
    '/',
    '/dist/output.css',
    '/js/main.js',
    '/img/dashboard.gif',
    '/img/optimized/moon.webp',
    '/img/moon/moon.png'
];

// Third-party resources to cache
const THIRD_PARTY_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/quicksand/v30/6xKtdSZaM9iE8KbpRA_hK1QNYuDyP6ab.woff2',
    'https://cdn.cookie-script.com/s/bcb8f2d8f394d9e54bf16bef90ad28b4.js',
    'https://client.crisp.chat/l.js'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.addAll(STATIC_RESOURCES);
            }),
            caches.open(CACHE_NAME).then((cache) => {
                // Pre-cache third-party resources with custom headers
                return Promise.all(
                    THIRD_PARTY_RESOURCES.map(url => {
                        return fetch(url, {
                            mode: 'cors',
                            cache: 'force-cache'
                        }).then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        }).catch(err => {
                            console.log('Failed to cache:', url, err);
                        });
                    })
                );
            })
        ])
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Handle third-party resources
    if (url.hostname === 'fonts.googleapis.com' || 
        url.hostname === 'fonts.gstatic.com' ||
        url.hostname === 'cdn.cookie-script.com' ||
        url.hostname === 'client.crisp.chat') {
        
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request, {
                    mode: 'cors',
                    cache: 'force-cache'
                }).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Return a fallback for critical resources
                    if (url.hostname === 'fonts.googleapis.com') {
                        return new Response('/* Fallback CSS */', {
                            headers: { 'Content-Type': 'text/css' }
                        });
                    }
                });
            })
        );
        return;
    }
    
    // Handle static resources
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request).then((response) => {
                    // Only cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        const cacheToUse = STATIC_RESOURCES.includes(url.pathname) ? 
                            STATIC_CACHE_NAME : CACHE_NAME;
                        
                        caches.open(cacheToUse).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(
            // Sync any pending analytics data
            self.registration.sync.register('analytics-sync')
        );
    }
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/img/moon/moon.png',
            badge: '/img/moon/moon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        
        event.waitUntil(
            self.registration.showNotification('Moone', options)
        );
    }
}); 