// Main Entry Point for Midas The Lifestyle Frontend
// React application initialization with providers and global setup

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Service Worker for PWA
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Global styles
import './index.css';

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring
function sendToAnalytics(metric: any) {
  // Send to analytics service (Google Analytics, etc.)
  console.log('Performance metric:', metric);
}

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('SW registered: ', registration);
  },
  onUpdate: (registration) => {
    console.log('SW updated: ', registration);
    // Show update available notification
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  },
});

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to error tracking service
});

// Online/offline status monitoring
window.addEventListener('online', () => {
  console.log('Application is online');
});

window.addEventListener('offline', () => {
  console.log('Application is offline');
});

// Prevent zoom on mobile devices
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// Disable context menu on production
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}
