// PWA Manager for Midas The Lifestyle
// Handles Progressive Web App functionality and mobile optimization

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = false;
        this.installButton = null;
        this.init();
    }

    init() {
        this.checkInstallationStatus();
        this.setupInstallPrompt();
        this.createInstallButton();
        this.setupMobileOptimizations();
        this.setupTouchOptimizations();
        this.setupPWAFeatures();
        this.registerServiceWorker();
        console.log('🚀 PWA Manager initialized with full PWA capabilities');
    }

    checkInstallationStatus() {
        // Check if app is running in standalone mode (actually installed and launched as PWA)
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');

        // Only consider app installed if it's actually running in standalone mode
        this.isInstalled = this.isStandalone;

        if (this.isStandalone) {
            // App is actually installed and running as PWA
            document.body.classList.add('pwa-standalone');
            this.addStandaloneStyles();
            console.log('✅ PWA: Running in standalone mode (app is installed)');
        } else {
            // App is running in browser - show install prompt after delay
            console.log('🌐 PWA: Running in browser mode - will show install prompt');
            setTimeout(() => {
                this.showInstallPromptIfAvailable();
            }, 5000);
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Handle app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA: App installed successfully');
            this.handleAppInstalled(true); // Show success message for browser-initiated install
        });
    }

    createInstallButton() {
        // Create install button
        this.installButton = document.createElement('button');
        this.installButton.id = 'pwa-install-btn';
        this.installButton.className = 'pwa-install-button hidden';
        this.installButton.innerHTML = `
            <div class="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Install App</span>
            </div>
        `;

        this.installButton.addEventListener('click', () => {
            this.promptInstall();
        });

        // Add to header or create floating button
        this.addInstallButtonToUI();
    }

    addInstallButtonToUI() {
        // Try to add to navigation first
        const nav = document.querySelector('nav .flex');
        if (nav) {
            nav.appendChild(this.installButton);
        } else {
            // Create floating install button
            this.installButton.className = 'pwa-install-floating hidden';
            document.body.appendChild(this.installButton);
        }
    }

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.classList.remove('hidden');
        }
    }

    showInstallPromptIfAvailable() {
        // Only show if not installed and user hasn't dismissed recently
        if (!this.isInstalled && !this.checkDismissalStatus()) {
            console.log('📱 PWA: Showing install prompt banner');
            this.showInstallBanner();
        } else if (this.isInstalled) {
            console.log('✅ PWA: App already installed, skipping install prompt');
        } else {
            console.log('⏰ PWA: Install prompt dismissed recently, skipping');
        }
    }

    checkDismissalStatus() {
        const dismissed = localStorage.getItem('midas-install-dismissed');
        if (!dismissed) return false;

        const dismissedTime = parseInt(dismissed);
        const now = Date.now();

        // Check if 24 hours have passed since dismissal
        if (now > dismissedTime) {
            // Clear expired dismissal
            localStorage.removeItem('midas-install-dismissed');
            return false;
        }

        return true;
    }

    showInstallBanner() {
        // Double-check conditions before showing banner
        if (this.isInstalled || document.getElementById('install-banner')) {
            console.log('🚫 PWA: Banner not shown - app installed or banner already exists');
            return;
        }

        // Check dismissal status using the new method
        if (this.checkDismissalStatus()) {
            console.log('🚫 PWA: Banner not shown - recently dismissed');
            return;
        }

        console.log('🎯 PWA: Creating install banner');
        const banner = document.createElement('div');
        banner.id = 'install-banner';
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="install-banner-content">
                <div class="flex items-center gap-3">
                    <div class="install-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                    </div>
                    <div class="install-text">
                        <h3>Install Midas The Lifestyle App</h3>
                        <p>Quick access to luxury rentals • Offline browsing • Faster booking</p>
                    </div>
                </div>
                <div class="install-actions">
                    <button class="install-btn-primary" onclick="pwaManager.promptInstall()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Install App
                    </button>
                    <button class="install-btn-secondary" onclick="pwaManager.dismissBanner()">Not Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        console.log('✅ PWA: Install banner displayed');

        // Auto-dismiss after 15 seconds
        setTimeout(() => {
            this.dismissBanner();
        }, 15000);
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('PWA: No install prompt available');
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('PWA: User accepted install');
                this.handleAppInstalled(true); // Show success message for user-initiated install
            } else {
                console.log('PWA: User dismissed install');
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('PWA: Install prompt error:', error);
        }
    }

    handleAppInstalled(showSuccessMessage = false) {
        this.isInstalled = true;
        localStorage.setItem('midas-pwa-installed', 'true');

        // Hide install button and banner
        if (this.installButton) {
            this.installButton.classList.add('hidden');
        }
        this.dismissBanner();

        // Only show success message if explicitly requested (after user action)
        if (showSuccessMessage) {
            this.showInstallSuccess();
        }
    }

    showInstallSuccess() {
        // Create success notification for actual app installation
        const notification = document.createElement('div');
        notification.className = 'install-success-notification';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div>
                    <h3>App Installed Successfully!</h3>
                    <p>Midas The Lifestyle is now available on your home screen</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        console.log('✅ PWA: Install success notification displayed');
    }

    dismissBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.remove();
            // Remember user dismissed the banner for 24 hours
            const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
            localStorage.setItem('midas-install-dismissed', dismissUntil);
            console.log('❌ PWA: Install banner dismissed by user for 24 hours');
        }
    }

    addStandaloneStyles() {
        // Add styles for standalone mode
        const style = document.createElement('style');
        style.textContent = `
            .pwa-standalone {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            .pwa-standalone header {
                padding-top: calc(env(safe-area-inset-top) + 1rem);
            }
        `;
        document.head.appendChild(style);
    }

    setupMobileOptimizations() {
        // Optimize viewport for mobile
        this.optimizeViewport();
        
        // Setup touch gestures
        this.setupTouchGestures();
        
        // Optimize scrolling
        this.optimizeScrolling();
        
        // Handle orientation changes
        this.handleOrientationChange();
    }

    optimizeViewport() {
        // Ensure proper viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
        
        // Add iOS specific meta tags
        this.addIOSMetaTags();
    }

    addIOSMetaTags() {
        const iosTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: 'Midas Luxury' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'msapplication-TileColor', content: '#D4AF37' },
            { name: 'msapplication-tap-highlight', content: 'no' }
        ];

        iosTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });

        // Add iOS splash screens
        this.addIOSSplashScreens();
    }

    addIOSSplashScreens() {
        const splashScreens = [
            { media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/iphone5_splash.png' },
            { media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/iphone6_splash.png' },
            { media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)', href: 'splash/iphoneplus_splash.png' },
            { media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)', href: 'splash/iphonex_splash.png' },
            { media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/iphonexr_splash.png' },
            { media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)', href: 'splash/iphonexsmax_splash.png' },
            { media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/ipad_splash.png' },
            { media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/ipadpro1_splash.png' },
            { media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)', href: 'splash/ipadpro3_splash.png' }
        ];

        splashScreens.forEach(screen => {
            const link = document.createElement('link');
            link.rel = 'apple-touch-startup-image';
            link.media = screen.media;
            link.href = screen.href;
            document.head.appendChild(link);
        });
    }

    setupTouchGestures() {
        // Improve touch responsiveness
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Handle pull-to-refresh
        this.handlePullToRefresh();
    }

    handlePullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        const threshold = 100;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;
                
                if (pullDistance > 0 && pullDistance < threshold) {
                    // Visual feedback for pull-to-refresh
                    document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (pullDistance > threshold) {
                // Trigger refresh
                window.location.reload();
            } else {
                // Reset position
                document.body.style.transform = '';
            }
            startY = 0;
            pullDistance = 0;
        }, { passive: true });
    }

    optimizeScrolling() {
        // Smooth scrolling for iOS
        document.documentElement.style.webkitOverflowScrolling = 'touch';
        
        // Prevent bounce scrolling
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(() => {
                // Trigger resize events
                window.dispatchEvent(new Event('resize'));
                
                // Refresh swiper instances
                if (window.carSwiper) {
                    window.carSwiper.update();
                }
            }, 500);
        });
    }

    setupTouchOptimizations() {
        // Optimize button sizes for touch
        this.optimizeTouchTargets();
        
        // Add haptic feedback
        this.addHapticFeedback();
    }

    optimizeTouchTargets() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                button, .btn, .filter-btn, .swiper-button-next, .swiper-button-prev {
                    min-height: 44px;
                    min-width: 44px;
                    padding: 12px 16px;
                }
                
                .favorite-btn, .compare-btn {
                    min-height: 44px;
                    min-width: 44px;
                }
                
                input, select, textarea {
                    min-height: 44px;
                    font-size: 16px; /* Prevent zoom on iOS */
                }
            }
        `;
        document.head.appendChild(style);
    }

    addHapticFeedback() {
        // Add haptic feedback for supported devices
        const addHaptic = (element, type = 'light') => {
            element.addEventListener('click', () => {
                if (navigator.vibrate) {
                    const patterns = {
                        light: [10],
                        medium: [20],
                        heavy: [30]
                    };
                    navigator.vibrate(patterns[type] || patterns.light);
                }
            });
        };

        // Add haptic feedback to buttons
        document.querySelectorAll('button, .btn').forEach(btn => {
            addHaptic(btn, 'light');
        });
    }

    // Public methods
    checkInstallability() {
        return {
            canInstall: !!this.deferredPrompt,
            isInstalled: this.isInstalled,
            isStandalone: this.isStandalone
        };
    }

    forceInstallPrompt() {
        if (this.deferredPrompt) {
            this.promptInstall();
        } else {
            this.showInstallInstructions();
        }
    }

    showInstallInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'install-instructions-modal';
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructionText = '';
        if (isIOS) {
            instructionText = 'Tap the Share button and select "Add to Home Screen"';
        } else if (isAndroid) {
            instructionText = 'Tap the menu button and select "Add to Home Screen"';
        } else {
            instructionText = 'Use your browser\'s menu to install this app';
        }

        instructions.innerHTML = `
            <div class="modal-content">
                <h3>Install Midas The Lifestyle</h3>
                <p>${instructionText}</p>
                <button onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
        `;

        document.body.appendChild(instructions);
    }

    setupPWAFeatures() {
        this.setupAppShortcuts();
        this.setupShareTarget();
        this.setupFileHandling();
        this.setupProtocolHandling();
        console.log('✅ PWA Features: Advanced PWA features configured');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ PWA: Service Worker registered successfully');

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });

            } catch (error) {
                console.error('❌ PWA: Service Worker registration failed:', error);
            }
        }
    }

    setupAppShortcuts() {
        console.log('🔗 PWA: App shortcuts configured');
    }

    setupShareTarget() {
        if ('serviceWorker' in navigator && 'share' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SHARE_TARGET') {
                    this.handleSharedContent(event.data);
                }
            });
        }
    }

    setupFileHandling() {
        if ('launchQueue' in window) {
            window.launchQueue.setConsumer((launchParams) => {
                if (launchParams.files && launchParams.files.length) {
                    this.handleFiles(launchParams.files);
                }
            });
        }
    }

    setupProtocolHandling() {
        const urlParams = new URLSearchParams(window.location.search);
        const handler = urlParams.get('handler');
        if (handler) {
            this.handleProtocolLink(handler);
        }
    }

    handleSharedContent(data) {
        console.log('📤 PWA: Handling shared content:', data);
    }

    handleFiles(files) {
        console.log('📁 PWA: Handling files:', files);
    }

    handleProtocolLink(handler) {
        console.log('🔗 PWA: Handling protocol link:', handler);
    }

    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>🚀 New version available!</span>
                <button onclick="pwaManager.applyUpdate()" class="update-btn">Update</button>
                <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">Later</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .pwa-update-banner {
                position: fixed; top: 0; left: 0; right: 0;
                background: linear-gradient(135deg, #D4AF37, #E8C96A);
                color: #000; padding: 12px; z-index: 10000;
                text-align: center; font-weight: 600;
            }
            .update-content { display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap; }
            .update-btn, .dismiss-btn { background: rgba(0,0,0,0.8); color: #D4AF37; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(updateBanner);
    }

    async applyUpdate() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        }
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});
