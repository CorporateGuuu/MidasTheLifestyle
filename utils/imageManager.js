// Image Manager for Midas The Lifestyle
// Handles high-quality image loading, optimization, and fallbacks

class ImageManager {
    constructor() {
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.fallbackImages = new Map();
        this.imageQualities = ['webp', 'jpg', 'png'];
        this.imageSizes = ['thumbnail', 'medium', 'large', 'hero'];
        this.professionalImages = this.initializeProfessionalImages();

        // Mobile optimization properties
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.isMobile = window.innerWidth <= 768;
        this.isRetina = this.devicePixelRatio > 1;
        this.connectionSpeed = this.getConnectionSpeed();
        this.webpSupported = false;
        this.lazyImageObserver = null;

        this.init();
    }

    // Initialize professional image database
    initializeProfessionalImages() {
        return {
            vehicles: {
                cars: {
                    'bugatti-chiron': {
                        hero: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    },
                    'koenigsegg-jesko': {
                        hero: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    },
                    'rolls-royce-phantom': {
                        hero: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    }
                },
                yachts: {
                    'lurssen-90m': {
                        hero: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    },
                    'azimut-grande-35m': {
                        hero: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    }
                },
                jets: {
                    'gulfstream-g700': {
                        hero: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        gallery: [
                            'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                            'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                        ],
                        thumbnail: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    }
                }
            },
            properties: {
                'dubai-marina-penthouse': {
                    hero: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                    gallery: [
                        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    ],
                    thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                },
                'palm-jumeirah-villa': {
                    hero: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                    gallery: [
                        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
                        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                    ],
                    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3'
                }
            }
        };
    }

    init() {
        this.detectWebPSupport();
        this.setupImagePaths();
        this.setupFallbacks();
        this.setupLazyLoading();
        this.setupMobileOptimization();
        this.preloadCriticalImages();
        this.setupProgressiveLoading();
        console.log('🖼️ Enhanced Image Manager with mobile optimization initialized');
    }

    // Detect WebP support
    detectWebPSupport() {
        const webpTestImage = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        const img = new Image();
        img.onload = img.onerror = () => {
            this.webpSupported = img.height === 2;
        };
        img.src = webpTestImage;
    }

    // Get connection speed estimation
    getConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType) {
                switch (connection.effectiveType) {
                    case 'slow-2g':
                    case '2g':
                        return 'slow';
                    case '3g':
                        return 'medium';
                    case '4g':
                        return 'fast';
                    default:
                        return 'medium';
                }
            }
        }
        return 'medium';
    }

    // Setup mobile optimization
    setupMobileOptimization() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.updateImageSizes();
            }, 100);
        });

        // Listen for resize events
        window.addEventListener('resize', this.debounce(() => {
            this.isMobile = window.innerWidth <= 768;
            this.updateImageSizes();
        }, 250));
    }

    // Setup progressive loading
    setupProgressiveLoading() {
        this.progressiveLoadingEnabled = this.connectionSpeed === 'slow' || this.isMobile;
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Update image sizes based on device
    updateImageSizes() {
        const images = document.querySelectorAll('img[data-responsive="true"]');
        images.forEach(img => {
            this.updateImageSrc(img);
        });
    }

    setupImagePaths() {
        this.imagePaths = {
            cars: {
                'bugatti-chiron-001': {
                    hero: '/images/cars/bugatti-chiron/hero.jpg',
                    gallery: [
                        '/images/cars/bugatti-chiron/front.jpg',
                        '/images/cars/bugatti-chiron/side.jpg',
                        '/images/cars/bugatti-chiron/rear.jpg',
                        '/images/cars/bugatti-chiron/interior.jpg',
                        '/images/cars/bugatti-chiron/detail1.jpg',
                        '/images/cars/bugatti-chiron/detail2.jpg'
                    ],
                    thumbnail: '/images/cars/bugatti-chiron/thumbnail.jpg'
                },
                'ferrari-sf90-stradale-001': {
                    hero: '/images/cars/ferrari-sf90/hero.jpg',
                    gallery: [
                        '/images/cars/ferrari-sf90/front.jpg',
                        '/images/cars/ferrari-sf90/side.jpg',
                        '/images/cars/ferrari-sf90/rear.jpg',
                        '/images/cars/ferrari-sf90/interior.jpg',
                        '/images/cars/ferrari-sf90/detail1.jpg',
                        '/images/cars/ferrari-sf90/detail2.jpg'
                    ],
                    thumbnail: '/images/cars/ferrari-sf90/thumbnail.jpg'
                },
                'lamborghini-huracan-evo-001': {
                    hero: '/images/cars/lamborghini-huracan/hero.jpg',
                    gallery: [
                        '/images/cars/lamborghini-huracan/front.jpg',
                        '/images/cars/lamborghini-huracan/side.jpg',
                        '/images/cars/lamborghini-huracan/rear.jpg',
                        '/images/cars/lamborghini-huracan/interior.jpg',
                        '/images/cars/lamborghini-huracan/detail1.jpg'
                    ],
                    thumbnail: '/images/cars/lamborghini-huracan/thumbnail.jpg'
                },
                'mclaren-720s-001': {
                    hero: '/images/cars/mclaren-720s/hero.jpg',
                    gallery: [
                        '/images/cars/mclaren-720s/front.jpg',
                        '/images/cars/mclaren-720s/side.jpg',
                        '/images/cars/mclaren-720s/rear.jpg',
                        '/images/cars/mclaren-720s/interior.jpg',
                        '/images/cars/mclaren-720s/detail1.jpg'
                    ],
                    thumbnail: '/images/cars/mclaren-720s/thumbnail.jpg'
                },
                'rolls-royce-cullinan-001': {
                    hero: '/images/cars/rolls-royce-cullinan/hero.jpg',
                    gallery: [
                        '/images/cars/rolls-royce-cullinan/front.jpg',
                        '/images/cars/rolls-royce-cullinan/side.jpg',
                        '/images/cars/rolls-royce-cullinan/rear.jpg',
                        '/images/cars/rolls-royce-cullinan/interior.jpg',
                        '/images/cars/rolls-royce-cullinan/detail1.jpg'
                    ],
                    thumbnail: '/images/cars/rolls-royce-cullinan/thumbnail.jpg'
                },
                'bentley-continental-gt-001': {
                    hero: '/images/cars/bentley-continental/hero.jpg',
                    gallery: [
                        '/images/cars/bentley-continental/front.jpg',
                        '/images/cars/bentley-continental/side.jpg',
                        '/images/cars/bentley-continental/rear.jpg',
                        '/images/cars/bentley-continental/interior.jpg'
                    ],
                    thumbnail: '/images/cars/bentley-continental/thumbnail.jpg'
                },
                'rolls-royce-phantom-001': {
                    hero: '/images/cars/rolls-royce-phantom/hero.jpg',
                    gallery: [
                        '/images/cars/rolls-royce-phantom/front.jpg',
                        '/images/cars/rolls-royce-phantom/side.jpg',
                        '/images/cars/rolls-royce-phantom/interior.jpg',
                        '/images/cars/rolls-royce-phantom/detail1.jpg'
                    ],
                    thumbnail: '/images/cars/rolls-royce-phantom/thumbnail.jpg'
                }
            },
            yachts: {
                hero: '/images/yachts/hero.jpg',
                gallery: [
                    '/images/yachts/luxury-yacht-1.jpg',
                    '/images/yachts/luxury-yacht-2.jpg',
                    '/images/yachts/yacht-interior-1.jpg',
                    '/images/yachts/yacht-deck.jpg',
                    '/images/yachts/yacht-sunset.jpg'
                ]
            },
            jets: {
                hero: '/images/jets/hero.jpg',
                gallery: [
                    '/images/jets/private-jet-1.jpg',
                    '/images/jets/private-jet-2.jpg',
                    '/images/jets/jet-interior-1.jpg',
                    '/images/jets/jet-cockpit.jpg',
                    '/images/jets/jet-exterior.jpg'
                ]
            },
            properties: {
                hero: '/images/properties/hero.jpg',
                gallery: [
                    '/images/properties/luxury-villa-1.jpg',
                    '/images/properties/luxury-villa-2.jpg',
                    '/images/properties/penthouse-1.jpg',
                    '/images/properties/estate-exterior.jpg',
                    '/images/properties/luxury-interior.jpg'
                ]
            },
            lifestyle: {
                concierge: '/images/lifestyle/concierge-service.jpg',
                delivery: '/images/lifestyle/white-glove-delivery.jpg',
                experience: '/images/lifestyle/luxury-experience.jpg',
                client: '/images/lifestyle/satisfied-client.jpg'
            },
            branding: {
                logo: '/images/branding/midas-logo.png',
                logoWhite: '/images/branding/midas-logo-white.png',
                watermark: '/images/branding/midas-watermark.png'
            }
        };
    }

    setupFallbacks() {
        // High-quality fallback images from premium sources
        this.fallbackImages.set('car-default', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80');
        this.fallbackImages.set('yacht-default', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80');
        this.fallbackImages.set('jet-default', 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80');
        this.fallbackImages.set('property-default', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80');
        this.fallbackImages.set('luxury-default', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80');
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.lazyImageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
    }

    preloadCriticalImages() {
        const criticalImages = [
            '/images/hero/luxury-hero.jpg',
            '/images/cars/bugatti-chiron/hero.jpg',
            '/images/yachts/hero.jpg',
            '/images/jets/hero.jpg',
            '/images/properties/hero.jpg'
        ];

        criticalImages.forEach(src => this.preloadImage(src));
    }

    preloadImage(src) {
        if (this.imageCache.has(src)) return;

        const img = new Image();
        img.onload = () => {
            this.imageCache.set(src, img);
        };
        img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
        };
        img.src = src;
    }

    async loadImage(imgElement) {
        const src = imgElement.dataset.src || imgElement.src;
        const fallbackType = imgElement.dataset.fallback || 'luxury-default';

        if (this.loadingImages.has(src)) return;
        this.loadingImages.add(src);

        try {
            const optimizedSrc = this.getOptimizedImageUrl(src, imgElement);
            
            if (this.imageCache.has(optimizedSrc)) {
                this.setImageSrc(imgElement, optimizedSrc);
                return;
            }

            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(optimizedSrc, img);
                this.setImageSrc(imgElement, optimizedSrc);
                imgElement.classList.add('loaded');
                this.loadingImages.delete(src);
            };

            img.onerror = () => {
                console.warn(`Failed to load image: ${src}, using fallback`);
                const fallbackSrc = this.fallbackImages.get(fallbackType);
                this.setImageSrc(imgElement, fallbackSrc);
                this.loadingImages.delete(src);
            };

            img.src = optimizedSrc;

        } catch (error) {
            console.error('Error loading image:', error);
            const fallbackSrc = this.fallbackImages.get(fallbackType);
            this.setImageSrc(imgElement, fallbackSrc);
            this.loadingImages.delete(src);
        }
    }

    setImageSrc(imgElement, src) {
        imgElement.src = src;
        imgElement.removeAttribute('data-src');
    }

    getOptimizedImageUrl(src, imgElement) {
        // If it's already an external URL with parameters, optimize it
        if (src.startsWith('http')) {
            return this.optimizeExternalImageUrl(src, imgElement);
        }

        const rect = imgElement.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;

        const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
        const optimalHeight = Math.ceil(rect.height * devicePixelRatio);

        // For local images, we'll implement responsive sizing later
        // For now, return the original path
        return src;
    }

    // Optimize external image URLs (Unsplash, etc.)
    optimizeExternalImageUrl(src, imgElement) {
        if (!src.includes('unsplash.com')) return src;

        const rect = imgElement.getBoundingClientRect();
        let targetWidth, targetHeight, quality;

        // Determine optimal size based on device and connection
        if (this.isMobile) {
            targetWidth = Math.min(480, Math.ceil(rect.width * this.devicePixelRatio));
            targetHeight = Math.ceil(targetWidth * 0.75); // 4:3 aspect ratio
            quality = this.connectionSpeed === 'slow' ? 60 : 75;
        } else {
            targetWidth = Math.min(1920, Math.ceil(rect.width * this.devicePixelRatio));
            targetHeight = Math.ceil(targetWidth * 0.6); // 16:10 aspect ratio
            quality = this.connectionSpeed === 'slow' ? 70 : 85;
        }

        // Build optimized URL
        const url = new URL(src);
        url.searchParams.set('w', targetWidth);
        url.searchParams.set('h', targetHeight);
        url.searchParams.set('q', quality);
        url.searchParams.set('fit', 'crop');
        url.searchParams.set('crop', 'center');
        url.searchParams.set('auto', 'format');

        // Add WebP format if supported
        if (this.webpSupported) {
            url.searchParams.set('fm', 'webp');
        }

        return url.toString();
    }

    // Create responsive image with multiple sources
    createResponsiveImageWithSources(baseSrc, alt, className = '') {
        const picture = document.createElement('picture');

        // WebP source for modern browsers
        if (this.webpSupported) {
            const webpSource = document.createElement('source');
            webpSource.type = 'image/webp';
            webpSource.srcset = this.generateSrcSet(baseSrc, 'webp');
            webpSource.sizes = this.generateSizes();
            picture.appendChild(webpSource);
        }

        // JPEG fallback
        const jpegSource = document.createElement('source');
        jpegSource.type = 'image/jpeg';
        jpegSource.srcset = this.generateSrcSet(baseSrc, 'jpg');
        jpegSource.sizes = this.generateSizes();
        picture.appendChild(jpegSource);

        // Fallback img element
        const img = document.createElement('img');
        img.src = this.optimizeExternalImageUrl(baseSrc, { getBoundingClientRect: () => ({ width: 800, height: 600 }) });
        img.alt = alt;
        img.className = className;
        img.loading = 'lazy';
        img.dataset.responsive = 'true';

        // Progressive loading placeholder
        if (this.progressiveLoadingEnabled) {
            img.style.filter = 'blur(5px)';
            img.style.transition = 'filter 0.3s ease';
            img.onload = () => {
                img.style.filter = 'none';
            };
        }

        picture.appendChild(img);
        return picture;
    }

    // Generate srcset for responsive images
    generateSrcSet(baseSrc, format = 'jpg') {
        const sizes = [480, 768, 1024, 1440, 1920];
        const srcset = sizes.map(width => {
            const url = new URL(baseSrc);
            url.searchParams.set('w', width);
            url.searchParams.set('q', this.getQualityForSize(width));
            url.searchParams.set('fit', 'crop');
            url.searchParams.set('crop', 'center');
            url.searchParams.set('auto', 'format');

            if (format === 'webp') {
                url.searchParams.set('fm', 'webp');
            }

            return `${url.toString()} ${width}w`;
        }).join(', ');

        return srcset;
    }

    // Generate sizes attribute
    generateSizes() {
        return '(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }

    // Get quality based on image size
    getQualityForSize(width) {
        if (width <= 480) return this.connectionSpeed === 'slow' ? 60 : 75;
        if (width <= 768) return this.connectionSpeed === 'slow' ? 65 : 80;
        if (width <= 1024) return this.connectionSpeed === 'slow' ? 70 : 85;
        return this.connectionSpeed === 'slow' ? 75 : 90;
    }

    // Update image source for responsive images
    updateImageSrc(imgElement) {
        const originalSrc = imgElement.dataset.originalSrc || imgElement.src;
        const optimizedSrc = this.getOptimizedImageUrl(originalSrc, imgElement);

        if (imgElement.src !== optimizedSrc) {
            imgElement.dataset.originalSrc = originalSrc;
            imgElement.src = optimizedSrc;
        }
    }

    getCarImage(carId, type = 'hero') {
        const carImages = this.imagePaths.cars[carId];
        if (!carImages) return this.fallbackImages.get('car-default');
        
        return carImages[type] || carImages.hero || this.fallbackImages.get('car-default');
    }

    getCarGallery(carId) {
        const carImages = this.imagePaths.cars[carId];
        if (!carImages || !carImages.gallery) return [];
        
        return carImages.gallery;
    }

    getCategoryImage(category, type = 'hero') {
        const categoryImages = this.imagePaths[category];
        if (!categoryImages) return this.fallbackImages.get(`${category}-default`);
        
        return categoryImages[type] || categoryImages.hero || this.fallbackImages.get(`${category}-default`);
    }

    observeImage(imgElement) {
        if (this.lazyImageObserver) {
            this.lazyImageObserver.observe(imgElement);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(imgElement);
        }
    }

    createResponsiveImage(src, alt, className = '', sizes = '100vw') {
        const img = document.createElement('img');
        img.dataset.src = src;
        img.alt = alt;
        img.className = className;
        img.loading = 'lazy';
        img.sizes = sizes;
        
        // Add placeholder while loading
        img.style.backgroundColor = '#1a1a1a';
        img.style.minHeight = '200px';
        
        this.observeImage(img);
        return img;
    }

    createImageGallery(images, containerClass = 'image-gallery') {
        const gallery = document.createElement('div');
        gallery.className = containerClass;
        
        images.forEach((src, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-item';
            
            const img = this.createResponsiveImage(
                src, 
                `Gallery image ${index + 1}`, 
                'gallery-image',
                '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            );
            
            imgContainer.appendChild(img);
            gallery.appendChild(imgContainer);
        });
        
        return gallery;
    }

    // Public methods for integration with other components
    updateCarInventoryImages() {
        if (window.carInventoryManager) {
            window.carInventoryManager.imageManager = this;
        }
    }

    getImagePath(category, id, type = 'hero') {
        if (category === 'cars') {
            return this.getCarImage(id, type);
        } else {
            return this.getCategoryImage(category, type);
        }
    }

    clearCache() {
        this.imageCache.clear();
        this.loadingImages.clear();
    }
}

// Initialize Image Manager
document.addEventListener('DOMContentLoaded', () => {
    window.imageManager = new ImageManager();
});
