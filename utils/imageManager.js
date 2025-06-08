// Image Manager for Midas The Lifestyle
// Handles high-quality image loading, optimization, and fallbacks

class ImageManager {
    constructor() {
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.fallbackImages = new Map();
        this.imageQualities = ['webp', 'jpg', 'png'];
        this.imageSizes = ['thumbnail', 'medium', 'large', 'hero'];
        this.init();
    }

    init() {
        this.setupImagePaths();
        this.setupFallbacks();
        this.setupLazyLoading();
        this.preloadCriticalImages();
        console.log('🖼️ Image Manager initialized');
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
        // If it's already an external URL, return as-is
        if (src.startsWith('http')) return src;

        const rect = imgElement.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
        const optimalHeight = Math.ceil(rect.height * devicePixelRatio);

        // For local images, we'll implement responsive sizing later
        // For now, return the original path
        return src;
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
