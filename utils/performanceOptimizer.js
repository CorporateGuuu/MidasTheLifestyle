/**
 * Performance Optimizer for Midas The Lifestyle
 * Comprehensive performance optimization targeting Core Web Vitals
 * Maintains luxury styling while achieving <1.5s FCP, <2.5s LCP, <3.0s SI
 */

class PerformanceOptimizer {
    constructor() {
        this.criticalResources = new Set();
        this.lazyImages = [];
        this.intersectionObserver = null;
        this.performanceMetrics = {};
        this.isOptimized = false;
        
        this.init();
    }

    init() {
        // Initialize performance optimizations immediately
        this.inlineCriticalCSS();
        this.optimizeFontLoading();
        this.setupLazyLoading();
        this.optimizeEventListeners();
        this.preloadCriticalResources();
        this.setupPerformanceMonitoring();
        
        // Defer non-critical optimizations
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.deferredOptimizations());
        } else {
            this.deferredOptimizations();
        }
    }

    // Inline critical CSS for above-the-fold content
    inlineCriticalCSS() {
        const criticalCSS = `
            /* Critical CSS for immediate rendering */
            body, html { 
                background: #0A0A0A !important; 
                color: #FFFFFF !important; 
                margin: 0; 
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .hero-section { 
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,26,0.8)) !important;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .gold-accent, .luxury-heading { 
                color: #D4AF37 !important; 
                font-family: 'Playfair Display', serif !important;
            }
            .luxury-button, .btn-luxury {
                background: linear-gradient(135deg, #D4AF37, #E8C96A) !important;
                color: #000000 !important;
                border: none !important;
                padding: 12px 24px !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
            }
            .nav-container {
                background: rgba(0, 0, 0, 0.95) !important;
                backdrop-filter: blur(10px) !important;
            }
            .loading-placeholder {
                background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .error-message {
                color: #ff6b6b;
                font-size: 12px;
                margin-top: 5px;
                display: none;
            }
            .error-message.show {
                display: block;
            }
            input.error, select.error, textarea.error {
                border-color: #ff6b6b !important;
                box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2) !important;
            }
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    // Optimize font loading strategy
    optimizeFontLoading() {
        // Preload critical fonts
        const fontPreloads = [
            { family: 'Playfair Display', weight: '700', display: 'swap' },
            { family: 'Inter', weight: '400,600', display: 'swap' }
        ];

        fontPreloads.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(' ', '+')}:wght@${font.weight}&display=${font.display}`;
            document.head.appendChild(link);
        });
    }

    // Setup lazy loading for images and videos
    setupLazyLoading() {
        const imageObserverOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, imageObserverOptions);

        // Find all images with lazy loading
        this.lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
        this.lazyImages.forEach(img => {
            // Add placeholder while loading
            if (!img.src && img.dataset.src) {
                img.src = this.generatePlaceholder(img.width || 800, img.height || 600);
                img.classList.add('loading-placeholder');
            }
            this.intersectionObserver.observe(img);
        });
    }

    // Load image with WebP support and fallback
    loadImage(img) {
        const originalSrc = img.dataset.src || img.src;
        
        // Check WebP support and optimize URL
        if (this.supportsWebP()) {
            const webpSrc = this.convertToWebP(originalSrc);
            img.src = webpSrc;
        } else {
            img.src = originalSrc;
        }

        img.classList.remove('loading-placeholder');
        img.classList.add('loaded');
        
        // Add fade-in animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
        };
    }

    // Check WebP support
    supportsWebP() {
        if (this.webpSupport !== undefined) return this.webpSupport;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this.webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this.webpSupport;
    }

    // Convert image URL to WebP if supported
    convertToWebP(url) {
        if (url.includes('unsplash.com')) {
            return url.includes('&fm=') ? url.replace(/&fm=\w+/, '&fm=webp') : url + '&fm=webp';
        }
        return url;
    }

    // Generate placeholder image
    generatePlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create luxury gradient placeholder
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.5, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        return canvas.toDataURL();
    }

    // Optimize event listeners for better performance
    optimizeEventListeners() {
        // Use passive listeners for scroll events
        const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
        
        passiveEvents.forEach(eventType => {
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (passiveEvents.includes(type) && typeof options !== 'object') {
                    options = { passive: true };
                } else if (typeof options === 'object' && options.passive === undefined) {
                    options.passive = true;
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
        });

        // Debounce resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        }, { passive: true });
    }

    // Preload critical resources
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/utils/bookingSystem.js', as: 'script' },
            { href: '/utils/vehicleShowcase.js', as: 'script' },
            { href: 'https://unpkg.com/swiper/swiper-bundle.min.css', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.as === 'script') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.performanceMetrics.lcp = lastEntry.startTime;
                console.log('LCP:', lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.performanceMetrics.fid = entry.processingStart - entry.startTime;
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.performanceMetrics.cls = clsValue;
                console.log('CLS:', clsValue);
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    // Deferred optimizations after initial load
    deferredOptimizations() {
        this.isOptimized = true;
    }

    // Handle resize events efficiently
    handleResize() {
        // Recalculate lazy loading thresholds
        if (this.intersectionObserver) {
            this.lazyImages.forEach(img => {
                if (!img.classList.contains('loaded')) {
                    this.intersectionObserver.observe(img);
                }
            });
        }
    }

    // Public method to get performance status
    getPerformanceStatus() {
        return {
            isOptimized: this.isOptimized,
            metrics: this.performanceMetrics,
            lazyImagesLoaded: this.lazyImages.filter(img => img.classList.contains('loaded')).length,
            totalLazyImages: this.lazyImages.length
        };
    }
}

// Initialize performance optimizer immediately
const performanceOptimizer = new PerformanceOptimizer();
