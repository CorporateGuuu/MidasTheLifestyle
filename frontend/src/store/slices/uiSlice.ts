// UI Redux Slice for Midas The Lifestyle
// Manages global UI state, notifications, modals, and user preferences

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Notification Interface
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Modal Interface
interface Modal {
  id: string;
  type: 'confirmation' | 'form' | 'info' | 'custom';
  title: string;
  content?: string;
  component?: string;
  props?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

// Theme Preferences
interface ThemePreferences {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
}

// UI State Interface
interface UIState {
  // Loading States
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: Modal[];
  
  // Navigation
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Theme and Preferences
  themePreferences: ThemePreferences;
  
  // Layout
  headerHeight: number;
  sidebarWidth: number;
  
  // Search
  globalSearchOpen: boolean;
  globalSearchQuery: string;
  
  // Filters and Panels
  filtersOpen: boolean;
  quickActionsOpen: boolean;
  
  // Page States
  pageTitle: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
  
  // Error States
  globalError: string | null;
  
  // Connection Status
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Performance
  performanceMode: 'high' | 'balanced' | 'battery';
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

// Initial State
const getInitialThemePreferences = (): ThemePreferences => {
  const saved = localStorage.getItem('midas_theme_preferences');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fall back to defaults if parsing fails
    }
  }
  
  return {
    mode: 'dark',
    primaryColor: '#D4AF37',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  };
};

const initialState: UIState = {
  globalLoading: false,
  loadingStates: {},
  notifications: [],
  modals: [],
  sidebarOpen: false,
  mobileMenuOpen: false,
  themePreferences: getInitialThemePreferences(),
  headerHeight: 64,
  sidebarWidth: 280,
  globalSearchOpen: false,
  globalSearchQuery: '',
  filtersOpen: false,
  quickActionsOpen: false,
  pageTitle: '',
  breadcrumbs: [],
  globalError: null,
  isOnline: navigator.onLine,
  connectionQuality: 'excellent',
  performanceMode: 'balanced',
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
};

// UI Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading States
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    },
    clearAllLoadingStates: (state) => {
      state.loadingStates = {};
    },

    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<Notification> }>) => {
      const { id, updates } = action.payload;
      const index = state.notifications.findIndex(n => n.id === id);
      if (index >= 0) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
    },

    // Modals
    openModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        id: Date.now().toString(),
        size: 'medium',
        ...action.payload,
      };
      state.modals.push(modal);
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },
    closeTopModal: (state) => {
      state.modals.pop();
    },
    closeAllModals: (state) => {
      state.modals = [];
    },
    updateModal: (state, action: PayloadAction<{ id: string; updates: Partial<Modal> }>) => {
      const { id, updates } = action.payload;
      const index = state.modals.findIndex(m => m.id === id);
      if (index >= 0) {
        state.modals[index] = { ...state.modals[index], ...updates };
      }
    },

    // Navigation
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    // Theme and Preferences
    setThemePreferences: (state, action: PayloadAction<Partial<ThemePreferences>>) => {
      state.themePreferences = { ...state.themePreferences, ...action.payload };
      localStorage.setItem('midas_theme_preferences', JSON.stringify(state.themePreferences));
    },
    toggleThemeMode: (state) => {
      state.themePreferences.mode = state.themePreferences.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('midas_theme_preferences', JSON.stringify(state.themePreferences));
    },
    setAnimations: (state, action: PayloadAction<boolean>) => {
      state.themePreferences.animations = action.payload;
      localStorage.setItem('midas_theme_preferences', JSON.stringify(state.themePreferences));
    },

    // Layout
    setHeaderHeight: (state, action: PayloadAction<number>) => {
      state.headerHeight = action.payload;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },

    // Global Search
    setGlobalSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.globalSearchOpen = action.payload;
      if (!action.payload) {
        state.globalSearchQuery = '';
      }
    },
    setGlobalSearchQuery: (state, action: PayloadAction<string>) => {
      state.globalSearchQuery = action.payload;
    },
    toggleGlobalSearch: (state) => {
      state.globalSearchOpen = !state.globalSearchOpen;
      if (!state.globalSearchOpen) {
        state.globalSearchQuery = '';
      }
    },

    // Filters and Panels
    setFiltersOpen: (state, action: PayloadAction<boolean>) => {
      state.filtersOpen = action.payload;
    },
    toggleFilters: (state) => {
      state.filtersOpen = !state.filtersOpen;
    },
    setQuickActionsOpen: (state, action: PayloadAction<boolean>) => {
      state.quickActionsOpen = action.payload;
    },
    toggleQuickActions: (state) => {
      state.quickActionsOpen = !state.quickActionsOpen;
    },

    // Page States
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} - Midas The Lifestyle`;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Error States
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },

    // Connection Status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (!action.payload) {
        state.connectionQuality = 'offline';
      }
    },
    setConnectionQuality: (state, action: PayloadAction<UIState['connectionQuality']>) => {
      state.connectionQuality = action.payload;
    },

    // Performance
    setPerformanceMode: (state, action: PayloadAction<UIState['performanceMode']>) => {
      state.performanceMode = action.payload;
      localStorage.setItem('midas_performance_mode', action.payload);
    },

    // Accessibility
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload;
      localStorage.setItem('midas_high_contrast', action.payload.toString());
    },
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload;
      localStorage.setItem('midas_reduced_motion', action.payload.toString());
    },
    setScreenReader: (state, action: PayloadAction<boolean>) => {
      state.screenReader = action.payload;
    },

    // Utility Actions
    showSuccessNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'success',
        duration: 4000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    showErrorNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'error',
        duration: 6000,
        persistent: true,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    showWarningNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'warning',
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    showInfoNotification: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'info',
        duration: 4000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },

    // Confirmation Modal
    showConfirmationModal: (state, action: PayloadAction<{
      title: string;
      content: string;
      onConfirm: () => void;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
    }>) => {
      const modal: Modal = {
        id: Date.now().toString(),
        type: 'confirmation',
        size: 'small',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...action.payload,
      };
      state.modals.push(modal);
    },

    // Initialize from localStorage
    initializeUIFromStorage: (state) => {
      // Performance mode
      const savedPerformanceMode = localStorage.getItem('midas_performance_mode') as UIState['performanceMode'];
      if (savedPerformanceMode) {
        state.performanceMode = savedPerformanceMode;
      }

      // High contrast
      const savedHighContrast = localStorage.getItem('midas_high_contrast');
      if (savedHighContrast) {
        state.highContrast = savedHighContrast === 'true';
      }

      // Reduced motion
      const savedReducedMotion = localStorage.getItem('midas_reduced_motion');
      if (savedReducedMotion) {
        state.reducedMotion = savedReducedMotion === 'true';
      }

      // Detect screen reader
      state.screenReader = window.navigator.userAgent.includes('NVDA') || 
                          window.navigator.userAgent.includes('JAWS') ||
                          window.speechSynthesis !== undefined;
    },

    // Reset UI State
    resetUIState: () => initialState,
  },
});

// Export actions
export const {
  setGlobalLoading,
  setLoadingState,
  clearAllLoadingStates,
  addNotification,
  removeNotification,
  clearAllNotifications,
  updateNotification,
  openModal,
  closeModal,
  closeTopModal,
  closeAllModals,
  updateModal,
  setSidebarOpen,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  setThemePreferences,
  toggleThemeMode,
  setAnimations,
  setHeaderHeight,
  setSidebarWidth,
  setGlobalSearchOpen,
  setGlobalSearchQuery,
  toggleGlobalSearch,
  setFiltersOpen,
  toggleFilters,
  setQuickActionsOpen,
  toggleQuickActions,
  setPageTitle,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setGlobalError,
  clearGlobalError,
  setOnlineStatus,
  setConnectionQuality,
  setPerformanceMode,
  setHighContrast,
  setReducedMotion,
  setScreenReader,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  showConfirmationModal,
  initializeUIFromStorage,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingStates = (state: { ui: UIState }) => state.ui.loadingStates;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) => state.ui.mobileMenuOpen;
export const selectThemePreferences = (state: { ui: UIState }) => state.ui.themePreferences;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectGlobalError = (state: { ui: UIState }) => state.ui.globalError;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectConnectionQuality = (state: { ui: UIState }) => state.ui.connectionQuality;

// Export reducer
export default uiSlice.reducer;
