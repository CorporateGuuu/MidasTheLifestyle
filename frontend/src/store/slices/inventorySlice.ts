// Inventory Redux Slice for Midas The Lifestyle
// Manages inventory state, search filters, and featured items

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem, SearchFilters } from '@/types/api';

// Inventory State Interface
interface InventoryState {
  items: InventoryItem[];
  featuredItems: InventoryItem[];
  selectedItem: InventoryItem | null;
  searchFilters: SearchFilters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  sortBy: 'price' | 'year' | 'brand' | 'popularity';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  favorites: string[];
  recentlyViewed: string[];
}

// Initial State
const initialState: InventoryState = {
  items: [],
  featuredItems: [],
  selectedItem: null,
  searchFilters: {},
  searchQuery: '',
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  sortBy: 'popularity',
  sortOrder: 'desc',
  viewMode: 'grid',
  favorites: JSON.parse(localStorage.getItem('midas_favorites') || '[]'),
  recentlyViewed: JSON.parse(localStorage.getItem('midas_recently_viewed') || '[]'),
};

// Inventory Slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // Items Management
    setItems: (state, action: PayloadAction<InventoryItem[]>) => {
      state.items = action.payload;
    },
    addItems: (state, action: PayloadAction<InventoryItem[]>) => {
      state.items = [...state.items, ...action.payload];
    },
    setFeaturedItems: (state, action: PayloadAction<InventoryItem[]>) => {
      state.featuredItems = action.payload;
    },
    setSelectedItem: (state, action: PayloadAction<InventoryItem | null>) => {
      state.selectedItem = action.payload;
      
      // Add to recently viewed if item is selected
      if (action.payload) {
        const itemId = action.payload.itemId;
        const recentlyViewed = state.recentlyViewed.filter(id => id !== itemId);
        recentlyViewed.unshift(itemId);
        state.recentlyViewed = recentlyViewed.slice(0, 10); // Keep only last 10
        localStorage.setItem('midas_recently_viewed', JSON.stringify(state.recentlyViewed));
      }
    },

    // Search and Filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.pagination.page = 1; // Reset to first page on new search
    },
    setSearchFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },
    clearSearchFilters: (state) => {
      state.searchFilters = {};
      state.searchQuery = '';
      state.pagination.page = 1;
    },
    addFilter: (state, action: PayloadAction<{ key: keyof SearchFilters; value: any }>) => {
      const { key, value } = action.payload;
      state.searchFilters[key] = value;
      state.pagination.page = 1;
    },
    removeFilter: (state, action: PayloadAction<keyof SearchFilters>) => {
      delete state.searchFilters[action.payload];
      state.pagination.page = 1;
    },

    // Sorting and View
    setSortBy: (state, action: PayloadAction<InventoryState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<InventoryState['sortOrder']>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setViewMode: (state, action: PayloadAction<InventoryState['viewMode']>) => {
      state.viewMode = action.payload;
      localStorage.setItem('midas_view_mode', action.payload);
    },

    // Pagination
    setPagination: (state, action: PayloadAction<Partial<InventoryState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    nextPage: (state) => {
      if (state.pagination.hasMore) {
        state.pagination.page += 1;
      }
    },
    previousPage: (state) => {
      if (state.pagination.page > 1) {
        state.pagination.page -= 1;
      }
    },

    // Favorites
    addToFavorites: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (!state.favorites.includes(itemId)) {
        state.favorites.push(itemId);
        localStorage.setItem('midas_favorites', JSON.stringify(state.favorites));
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.favorites = state.favorites.filter(id => id !== itemId);
      localStorage.setItem('midas_favorites', JSON.stringify(state.favorites));
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (state.favorites.includes(itemId)) {
        state.favorites = state.favorites.filter(id => id !== itemId);
      } else {
        state.favorites.push(itemId);
      }
      localStorage.setItem('midas_favorites', JSON.stringify(state.favorites));
    },
    clearFavorites: (state) => {
      state.favorites = [];
      localStorage.removeItem('midas_favorites');
    },

    // Recently Viewed
    addToRecentlyViewed: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const recentlyViewed = state.recentlyViewed.filter(id => id !== itemId);
      recentlyViewed.unshift(itemId);
      state.recentlyViewed = recentlyViewed.slice(0, 10);
      localStorage.setItem('midas_recently_viewed', JSON.stringify(state.recentlyViewed));
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
      localStorage.removeItem('midas_recently_viewed');
    },

    // Loading and Error States
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Initialize from localStorage
    initializeFromStorage: (state) => {
      const savedViewMode = localStorage.getItem('midas_view_mode') as 'grid' | 'list';
      if (savedViewMode) {
        state.viewMode = savedViewMode;
      }
      
      const savedFavorites = localStorage.getItem('midas_favorites');
      if (savedFavorites) {
        state.favorites = JSON.parse(savedFavorites);
      }
      
      const savedRecentlyViewed = localStorage.getItem('midas_recently_viewed');
      if (savedRecentlyViewed) {
        state.recentlyViewed = JSON.parse(savedRecentlyViewed);
      }
    },

    // Quick Filters
    setQuickFilter: (state, action: PayloadAction<'all' | 'available' | 'featured' | 'favorites'>) => {
      const filter = action.payload;
      state.searchFilters = {};
      state.searchQuery = '';
      
      switch (filter) {
        case 'available':
          // This would be handled by the API query
          break;
        case 'featured':
          // This would be handled by the API query
          break;
        case 'favorites':
          // This would filter by favorite items
          break;
        default:
          // Show all items
          break;
      }
      
      state.pagination.page = 1;
    },

    // Price Range Filter
    setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.searchFilters.priceRange = action.payload;
      state.pagination.page = 1;
    },
    clearPriceRange: (state) => {
      delete state.searchFilters.priceRange;
      state.pagination.page = 1;
    },

    // Category Filter
    setCategory: (state, action: PayloadAction<string>) => {
      state.searchFilters.category = action.payload as any;
      state.pagination.page = 1;
    },
    clearCategory: (state) => {
      delete state.searchFilters.category;
      state.pagination.page = 1;
    },

    // Item Type Filter
    setItemType: (state, action: PayloadAction<string>) => {
      state.searchFilters.itemType = action.payload as any;
      state.pagination.page = 1;
    },
    clearItemType: (state) => {
      delete state.searchFilters.itemType;
      state.pagination.page = 1;
    },

    // Location Filter
    setLocation: (state, action: PayloadAction<string>) => {
      state.searchFilters.location = action.payload;
      state.pagination.page = 1;
    },
    clearLocation: (state) => {
      delete state.searchFilters.location;
      state.pagination.page = 1;
    },

    // Features Filter
    setFeatures: (state, action: PayloadAction<string[]>) => {
      state.searchFilters.features = action.payload;
      state.pagination.page = 1;
    },
    addFeature: (state, action: PayloadAction<string>) => {
      const features = state.searchFilters.features || [];
      if (!features.includes(action.payload)) {
        state.searchFilters.features = [...features, action.payload];
        state.pagination.page = 1;
      }
    },
    removeFeature: (state, action: PayloadAction<string>) => {
      const features = state.searchFilters.features || [];
      state.searchFilters.features = features.filter(feature => feature !== action.payload);
      state.pagination.page = 1;
    },
    clearFeatures: (state) => {
      delete state.searchFilters.features;
      state.pagination.page = 1;
    },

    // Reset State
    resetInventoryState: (state) => {
      return {
        ...initialState,
        favorites: state.favorites,
        recentlyViewed: state.recentlyViewed,
        viewMode: state.viewMode,
      };
    },
  },
});

// Export actions
export const {
  setItems,
  addItems,
  setFeaturedItems,
  setSelectedItem,
  setSearchQuery,
  setSearchFilters,
  clearSearchFilters,
  addFilter,
  removeFilter,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  setViewMode,
  setPagination,
  setPage,
  nextPage,
  previousPage,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  clearFavorites,
  addToRecentlyViewed,
  clearRecentlyViewed,
  setLoading,
  setError,
  clearError,
  initializeFromStorage,
  setQuickFilter,
  setPriceRange,
  clearPriceRange,
  setCategory,
  clearCategory,
  setItemType,
  clearItemType,
  setLocation,
  clearLocation,
  setFeatures,
  addFeature,
  removeFeature,
  clearFeatures,
  resetInventoryState,
} = inventorySlice.actions;

// Selectors
export const selectInventory = (state: { inventory: InventoryState }) => state.inventory;
export const selectInventoryItems = (state: { inventory: InventoryState }) => state.inventory.items;
export const selectFeaturedItems = (state: { inventory: InventoryState }) => state.inventory.featuredItems;
export const selectSelectedItem = (state: { inventory: InventoryState }) => state.inventory.selectedItem;
export const selectSearchFilters = (state: { inventory: InventoryState }) => state.inventory.searchFilters;
export const selectSearchQuery = (state: { inventory: InventoryState }) => state.inventory.searchQuery;
export const selectInventoryPagination = (state: { inventory: InventoryState }) => state.inventory.pagination;
export const selectSortBy = (state: { inventory: InventoryState }) => state.inventory.sortBy;
export const selectSortOrder = (state: { inventory: InventoryState }) => state.inventory.sortOrder;
export const selectViewMode = (state: { inventory: InventoryState }) => state.inventory.viewMode;
export const selectFavorites = (state: { inventory: InventoryState }) => state.inventory.favorites;
export const selectRecentlyViewed = (state: { inventory: InventoryState }) => state.inventory.recentlyViewed;
export const selectInventoryLoading = (state: { inventory: InventoryState }) => state.inventory.isLoading;
export const selectInventoryError = (state: { inventory: InventoryState }) => state.inventory.error;

// Export reducer
export default inventorySlice.reducer;
