/**
 * Push Notifications Manager for Midas The Lifestyle PWA
 * Handles push notification subscriptions and luxury-themed notifications
 */

class PushNotificationManager {
    constructor() {
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKVXTdtToTnMqz9YAChqiOXFcQABWFTBHb2lzMJBMohNWg'; // Replace with your VAPID key
        this.subscription = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = Notification.permission;
        
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.log('📱 Push Notifications: Not supported in this browser');
            return;
        }

        console.log('🔔 Push Notifications: Initializing...');
        
        // Check existing subscription
        await this.checkExistingSubscription();
        
        // Setup UI elements
        this.setupNotificationUI();
        
        console.log('✅ Push Notifications: Initialized successfully');
    }

    async checkExistingSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('📱 Push Notifications: Existing subscription found');
                this.updateUIState('subscribed');
            } else {
                console.log('📱 Push Notifications: No existing subscription');
                this.updateUIState('unsubscribed');
            }
        } catch (error) {
            console.error('❌ Push Notifications: Error checking subscription:', error);
        }
    }

    setupNotificationUI() {
        // Create notification permission banner if needed
        if (this.permission === 'default') {
            setTimeout(() => {
                this.showPermissionBanner();
            }, 10000); // Show after 10 seconds
        }
    }

    showPermissionBanner() {
        // Don't show if already dismissed recently
        if (localStorage.getItem('midas-notification-dismissed')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'notification-permission-banner';
        banner.className = 'notification-banner';
        banner.innerHTML = `
            <div class="notification-banner-content">
                <div class="notification-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                </div>
                <div class="notification-text">
                    <h3>Stay Updated with Luxury Offers</h3>
                    <p>Get notified about exclusive deals, new arrivals, and booking confirmations</p>
                </div>
                <div class="notification-actions">
                    <button class="notification-btn-primary" onclick="pushNotificationManager.requestPermission()">
                        Enable Notifications
                    </button>
                    <button class="notification-btn-secondary" onclick="pushNotificationManager.dismissBanner()">
                        Not Now
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                border: 2px solid #D4AF37;
                border-radius: 16px;
                padding: 20px;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease-out;
                max-width: 500px;
                margin: 0 auto;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .notification-banner-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .notification-icon {
                color: #D4AF37;
                flex-shrink: 0;
            }
            
            .notification-text h3 {
                color: #D4AF37;
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 4px 0;
            }
            
            .notification-text p {
                color: #E5E5E5;
                font-size: 14px;
                margin: 0;
                line-height: 1.4;
            }
            
            .notification-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .notification-btn-primary {
                background: linear-gradient(135deg, #D4AF37, #E8C96A);
                color: #000;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .notification-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            }
            
            .notification-btn-secondary {
                background: transparent;
                color: #E5E5E5;
                border: 1px solid #666;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .notification-btn-secondary:hover {
                color: #D4AF37;
                border-color: #D4AF37;
            }
            
            @media (max-width: 768px) {
                .notification-banner {
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                }
                
                .notification-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .notification-actions {
                    flex-direction: row;
                    width: 100%;
                }
                
                .notification-btn-primary,
                .notification-btn-secondary {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            this.dismissBanner();
        }, 30000);
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('✅ Push Notifications: Permission granted');
                await this.subscribe();
                this.dismissBanner();
                this.showSuccessMessage();
            } else {
                console.log('❌ Push Notifications: Permission denied');
                this.showDeniedMessage();
            }
        } catch (error) {
            console.error('❌ Push Notifications: Error requesting permission:', error);
        }
    }

    async subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            this.subscription = subscription;
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            this.updateUIState('subscribed');
            console.log('✅ Push Notifications: Subscribed successfully');
            
        } catch (error) {
            console.error('❌ Push Notifications: Subscription failed:', error);
        }
    }

    async unsubscribe() {
        if (!this.subscription) return;
        
        try {
            await this.subscription.unsubscribe();
            await this.removeSubscriptionFromServer();
            
            this.subscription = null;
            this.updateUIState('unsubscribed');
            console.log('✅ Push Notifications: Unsubscribed successfully');
            
        } catch (error) {
            console.error('❌ Push Notifications: Unsubscribe failed:', error);
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }
            
            console.log('✅ Push Notifications: Subscription sent to server');
        } catch (error) {
            console.error('❌ Push Notifications: Failed to send subscription:', error);
        }
    }

    async removeSubscriptionFromServer() {
        try {
            await fetch('/api/push-unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: this.subscription.endpoint
                })
            });
            
            console.log('✅ Push Notifications: Subscription removed from server');
        } catch (error) {
            console.error('❌ Push Notifications: Failed to remove subscription:', error);
        }
    }

    dismissBanner() {
        const banner = document.getElementById('notification-permission-banner');
        if (banner) {
            banner.remove();
            // Remember dismissal for 7 days
            localStorage.setItem('midas-notification-dismissed', Date.now() + (7 * 24 * 60 * 60 * 1000));
        }
    }

    showSuccessMessage() {
        this.showNotification('🔔 Notifications enabled! You\'ll receive luxury updates and booking confirmations.', 'success');
    }

    showDeniedMessage() {
        this.showNotification('📱 Notifications blocked. You can enable them later in your browser settings.', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'push-notification-message';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    updateUIState(state) {
        // Update any UI elements based on subscription state
        const subscribeButtons = document.querySelectorAll('.subscribe-notifications');
        const unsubscribeButtons = document.querySelectorAll('.unsubscribe-notifications');
        
        if (state === 'subscribed') {
            subscribeButtons.forEach(btn => btn.style.display = 'none');
            unsubscribeButtons.forEach(btn => btn.style.display = 'block');
        } else {
            subscribeButtons.forEach(btn => btn.style.display = 'block');
            unsubscribeButtons.forEach(btn => btn.style.display = 'none');
        }
    }

    // Utility function to convert VAPID key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Public method to send test notification
    async sendTestNotification() {
        if (!this.subscription) {
            console.log('❌ Push Notifications: No subscription available');
            return;
        }
        
        try {
            await fetch('/api/push-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: this.subscription
                })
            });
            
            console.log('✅ Push Notifications: Test notification sent');
        } catch (error) {
            console.error('❌ Push Notifications: Failed to send test notification:', error);
        }
    }
}

// Initialize push notification manager
const pushNotificationManager = new PushNotificationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
}

console.log('🔔 Midas The Lifestyle Push Notifications loaded successfully');
