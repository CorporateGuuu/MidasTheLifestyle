// Performance Optimizer for Midas The Lifestyle
// Handles image optimization, lazy loading, caching, and SEO enhancements

class PerformanceOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.lazyLoadObserver = null;
        this.preloadedImages = new Set();
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupSEOEnhancements();
        this.setupCaching();
        this.setupPerformanceMonitoring();
        console.log('🚀 Performance Optimizer initialized');
    }

    // Lazy Loading Implementation
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.lazyLoadObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all images with lazy loading
            this.observeLazyImages();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    observeLazyImages() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
    }

    loadImage(img) {
        const src = img.dataset.src || img.src;
        if (src && !img.dataset.loaded) {
            // Create optimized image URL
            const optimizedSrc = this.optimizeImageUrl(src, img);
            
            // Preload image
            const preloadImg = new Image();
            preloadImg.onload = () => {
                img.src = optimizedSrc;
                img.dataset.loaded = 'true';
                img.classList.add('loaded');
                this.imageCache.set(src, optimizedSrc);
            };
            preloadImg.onerror = () => {
                // Fallback to original src
                img.src = src;
                img.dataset.loaded = 'true';
            };
            preloadImg.src = optimizedSrc;
        }
    }

    loadAllImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => this.loadImage(img));
    }

    // Image Optimization
    setupImageOptimization() {
        // Preload critical images
        this.preloadCriticalImages();
        
        // Setup responsive image handling
        this.setupResponsiveImages();
    }

    optimizeImageUrl(src, imgElement) {
        // Get optimal dimensions based on container
        const rect = imgElement.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
        const optimalHeight = Math.ceil(rect.height * devicePixelRatio);

        // For Unsplash images, add optimization parameters
        if (src.includes('unsplash.com')) {
            const url = new URL(src);
            url.searchParams.set('w', Math.min(optimalWidth, 1200));
            url.searchParams.set('h', Math.min(optimalHeight, 800));
            url.searchParams.set('fit', 'crop');
            url.searchParams.set('auto', 'format,compress');
            url.searchParams.set('q', '85');
            return url.toString();
        }

        return src;
    }

    preloadCriticalImages() {
        // Preload hero images and above-the-fold content
        const criticalImages = [
            'https://source.unsplash.com/1920x1080?bugatti',
            'https://source.unsplash.com/1920x1080?superyacht',
            'https://source.unsplash.com/1920x1080?private-jet',
            'https://source.unsplash.com/1920x1080?luxury-villa'
        ];

        criticalImages.forEach(src => {
            if (!this.preloadedImages.has(src)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                document.head.appendChild(link);
                this.preloadedImages.add(src);
            }
        });
    }

    setupResponsiveImages() {
        // Handle responsive images based on viewport
        const handleResize = () => {
            const images = document.querySelectorAll('img[data-responsive]');
            images.forEach(img => {
                const newSrc = this.optimizeImageUrl(img.src, img);
                if (newSrc !== img.src) {
                    img.src = newSrc;
                }
            });
        };

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
    }

    // SEO Enhancements
    setupSEOEnhancements() {
        this.addStructuredData();
        this.optimizeMetaTags();
        this.setupOpenGraph();
        this.addBreadcrumbs();
    }

    addStructuredData() {
        // Add JSON-LD structured data for luxury car rentals
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "AutoRental",
            "name": "Midas The Lifestyle - Luxury Car Rentals",
            "description": "Premium luxury car rental service featuring exotic cars, supercars, and luxury vehicles in Dubai, Washington DC, Atlanta, Maryland, and Northern Virginia.",
            "url": window.location.origin,
            "logo": `${window.location.origin}/logo.png`,
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+971-123-456-789",
                "contactType": "customer service",
                "email": "concierge@midasthelifestyle.com"
            },
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dubai",
                "addressCountry": "UAE"
            },
            "areaServed": [
                "Dubai", "Washington DC", "Atlanta", "Maryland", "Northern Virginia"
            ],
            "priceRange": "$1500-$6000 per day",
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Luxury Vehicle Fleet",
                "itemListElement": this.generateVehicleStructuredData()
            }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    generateVehicleStructuredData() {
        // This would be populated from the car inventory
        return [
            {
                "@type": "Vehicle",
                "name": "Bugatti Chiron",
                "brand": "Bugatti",
                "model": "Chiron",
                "vehicleEngine": {
                    "@type": "EngineSpecification",
                    "enginePower": "1479 HP"
                },
                "offers": {
                    "@type": "Offer",
                    "price": "5500",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                }
            }
            // More vehicles would be added dynamically
        ];
    }

    optimizeMetaTags() {
        // Update meta descriptions for better SEO
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = "Rent luxury cars in Dubai, Washington DC, Atlanta. Premium fleet including Bugatti, Ferrari, Lamborghini, Rolls-Royce. White glove service, instant booking, 24/7 concierge.";
        }

        // Add additional meta tags
        this.addMetaTag('keywords', 'luxury car rental, exotic car rental, supercar rental, Dubai car rental, Washington DC luxury cars, Atlanta exotic cars, Bugatti rental, Ferrari rental, Lamborghini rental');
        this.addMetaTag('author', 'Midas The Lifestyle');
        this.addMetaTag('robots', 'index, follow, max-image-preview:large');
    }

    addMetaTag(name, content) {
        if (!document.querySelector(`meta[name="${name}"]`)) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        }
    }

    setupOpenGraph() {
        // Enhance Open Graph tags for social sharing
        const ogTags = {
            'og:type': 'website',
            'og:site_name': 'Midas The Lifestyle',
            'og:locale': 'en_US',
            'twitter:card': 'summary_large_image',
            'twitter:site': '@midasthelifestyle'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (!document.querySelector(`meta[property="${property}"]`)) {
                const meta = document.createElement('meta');
                meta.setAttribute('property', property);
                meta.content = content;
                document.head.appendChild(meta);
            }
        });
    }

    addBreadcrumbs() {
        // Add breadcrumb structured data
        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": window.location.origin
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Luxury Car Rentals",
                    "item": `${window.location.origin}#cars`
                }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(breadcrumbData);
        document.head.appendChild(script);
    }

    // Caching Strategy
    setupCaching() {
        // Service Worker registration for caching
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Local storage caching for API responses
        this.setupLocalStorageCaching();
    }

    registerServiceWorker() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }

    setupLocalStorageCaching() {
        // Cache inventory data
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url] = args;
            
            if (url.includes('inventory.json')) {
                const cacheKey = `cache_${url}`;
                const cached = localStorage.getItem(cacheKey);
                const cacheTime = localStorage.getItem(`${cacheKey}_time`);
                
                // Use cache if less than 1 hour old
                if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                    return new Response(cached, {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                const response = await originalFetch(...args);
                if (response.ok) {
                    const data = await response.clone().text();
                    localStorage.setItem(cacheKey, data);
                    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                }
                return response;
            }
            
            return originalFetch(...args);
        };
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Monitor resource loading
        this.monitorResourceLoading();
    }

    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    monitorResourceLoading() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
            
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                if (resource.duration > 1000) {
                    console.warn('Slow resource:', resource.name, resource.duration);
                }
            });
        });
    }

    // Public methods for manual optimization
    preloadImage(src) {
        if (!this.preloadedImages.has(src)) {
            const img = new Image();
            img.src = src;
            this.preloadedImages.add(src);
        }
    }

    clearImageCache() {
        this.imageCache.clear();
    }

    getPerformanceMetrics() {
        return {
            imagesCached: this.imageCache.size,
            imagesPreloaded: this.preloadedImages.size,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            } : null
        };
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});
