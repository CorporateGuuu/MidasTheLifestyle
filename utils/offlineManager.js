/**
 * Offline Manager for Midas The Lifestyle PWA
 * Handles offline functionality and data synchronization
 */

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.dbName = 'MidasOfflineDB';
        this.dbVersion = 1;
        this.db = null;
        
        this.init();
    }

    async init() {
        console.log('🔄 Offline Manager: Initializing...');
        
        // Initialize IndexedDB
        await this.initDatabase();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Process any queued actions
        if (this.isOnline) {
            await this.processOfflineQueue();
        }
        
        console.log('✅ Offline Manager: Initialized successfully');
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Offline Manager: Database failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('📦 Offline Manager: Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('bookings')) {
                    const bookingStore = db.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
                    bookingStore.createIndex('timestamp', 'timestamp', { unique: false });
                    bookingStore.createIndex('status', 'status', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('contacts')) {
                    const contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
                    contactStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('favorites')) {
                    const favoritesStore = db.createObjectStore('favorites', { keyPath: 'id' });
                    favoritesStore.createIndex('type', 'type', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                console.log('🏗️ Offline Manager: Database schema created');
            };
        });
    }

    setupEventListeners() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 Offline Manager: Connection restored');
            this.isOnline = true;
            this.showConnectionStatus('online');
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Offline Manager: Connection lost');
            this.isOnline = false;
            this.showConnectionStatus('offline');
        });
        
        // Handle form submissions
        document.addEventListener('submit', (event) => {
            if (!this.isOnline) {
                event.preventDefault();
                this.handleOfflineSubmission(event.target);
            }
        });
    }

    showConnectionStatus(status) {
        // Remove existing status
        const existingStatus = document.querySelector('.connection-status-banner');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Create status banner
        const banner = document.createElement('div');
        banner.className = 'connection-status-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        
        if (status === 'online') {
            banner.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            banner.style.color = '#ffffff';
            banner.textContent = '✅ Connection restored - Syncing data...';
            
            // Auto-remove after 3 seconds
            setTimeout(() => banner.remove(), 3000);
        } else {
            banner.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            banner.style.color = '#ffffff';
            banner.textContent = '📡 You\'re offline - Some features may be limited';
        }
        
        document.body.appendChild(banner);
    }

    async handleOfflineSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add metadata
        data.timestamp = Date.now();
        data.formAction = form.action || window.location.pathname;
        data.formMethod = form.method || 'POST';
        
        // Determine submission type
        let storeName = 'contacts';
        if (form.id === 'booking-form' || form.classList.contains('booking-form')) {
            storeName = 'bookings';
            data.status = 'pending_sync';
        }
        
        try {
            await this.storeOfflineData(storeName, data);
            this.showOfflineSubmissionSuccess(storeName);
            
            // Add to sync queue
            this.offlineQueue.push({
                type: storeName,
                data: data,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Offline Manager: Failed to store offline data:', error);
            this.showOfflineSubmissionError();
        }
    }

    async storeOfflineData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => {
                console.log(`💾 Offline Manager: Data stored in ${storeName}`);
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async processOfflineQueue() {
        if (!this.isOnline || this.offlineQueue.length === 0) {
            return;
        }
        
        console.log(`🔄 Offline Manager: Processing ${this.offlineQueue.length} queued items`);
        
        const processedItems = [];
        
        for (const item of this.offlineQueue) {
            try {
                await this.syncDataToServer(item);
                processedItems.push(item);
                console.log(`✅ Offline Manager: Synced ${item.type} data`);
            } catch (error) {
                console.error(`❌ Offline Manager: Failed to sync ${item.type}:`, error);
            }
        }
        
        // Remove processed items from queue
        this.offlineQueue = this.offlineQueue.filter(item => !processedItems.includes(item));
        
        if (processedItems.length > 0) {
            this.showSyncSuccess(processedItems.length);
        }
    }

    async syncDataToServer(item) {
        const endpoint = item.type === 'bookings' ? '/api/bookings' : '/api/contact';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data)
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        // Remove from offline storage after successful sync
        await this.removeOfflineData(item.type, item.data.id);
        
        return response.json();
    }

    async removeOfflineData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    showOfflineSubmissionSuccess(type) {
        const message = type === 'bookings' 
            ? 'Booking saved offline - will sync when connection is restored'
            : 'Message saved offline - will send when connection is restored';
            
        this.showNotification(message, 'success');
    }

    showOfflineSubmissionError() {
        this.showNotification('Failed to save offline - please try again', 'error');
    }

    showSyncSuccess(count) {
        this.showNotification(`${count} item(s) synced successfully`, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
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

    // Public methods for other components
    async saveFavorite(item) {
        if (!this.db) return false;
        
        try {
            await this.storeOfflineData('favorites', {
                id: `${item.type}_${item.id}`,
                ...item,
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error('❌ Offline Manager: Failed to save favorite:', error);
            return false;
        }
    }

    async getFavorites() {
        if (!this.db) return [];
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favorites'], 'readonly');
            const store = transaction.objectStore('favorites');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async cacheData(key, data) {
        if (!this.db) return false;
        
        try {
            await this.storeOfflineData('cache', {
                key: key,
                data: data,
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error('❌ Offline Manager: Failed to cache data:', error);
            return false;
        }
    }

    async getCachedData(key) {
        if (!this.db) return null;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Initialize offline manager
const offlineManager = new OfflineManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}

console.log('🏆 Midas The Lifestyle Offline Manager loaded successfully');
