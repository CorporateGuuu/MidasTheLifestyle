// Redux Store Configuration for Midas The Lifestyle Frontend
// Comprehensive state management with RTK Query for API caching

import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TokenManager } from '@/services/api';

// Auth Slice
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import inventoryReducer from './slices/inventorySlice';
import uiReducer from './slices/uiSlice';

// API Base Query with Authentication
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || '/.netlify/functions',
  prepareHeaders: (headers) => {
    const token = TokenManager.getToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Enhanced Base Query with Token Refresh
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth-refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { token } = refreshResult.data as any;
        TokenManager.setToken(token);
        
        // Retry original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout user
        TokenManager.clearTokens();
        api.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
      }
    } else {
      // No refresh token, logout user
      TokenManager.clearTokens();
      api.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
  }

  return result;
};

// RTK Query API
export const midasApi = createApi({
  reducerPath: 'midasApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Booking',
    'Inventory',
    'Availability',
    'Dashboard',
    'Report',
    'Customer',
  ],
  endpoints: (builder) => ({
    // Authentication Endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth-login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth-register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getCurrentUser: builder.query({
      query: () => '/auth-me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/auth-profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Inventory Endpoints
    getInventory: builder.query({
      query: (params = {}) => ({
        url: '/inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    getInventoryItem: builder.query({
      query: (itemId) => `/inventory/${itemId}`,
      providesTags: (result, error, itemId) => [{ type: 'Inventory', id: itemId }],
    }),
    searchInventory: builder.query({
      query: (params) => ({
        url: '/inventory/search',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    getFeaturedInventory: builder.query({
      query: (limit = 6) => ({
        url: '/inventory/featured',
        params: { limit },
      }),
      providesTags: ['Inventory'],
    }),

    // Availability Endpoints
    checkAvailability: builder.query({
      query: (params) => ({
        url: '/availability-check',
        params,
      }),
      providesTags: ['Availability'],
    }),
    checkMultipleAvailability: builder.query({
      query: (params) => ({
        url: '/availability-check',
        params: { action: 'multiple', ...params },
      }),
      providesTags: ['Availability'],
    }),

    // Booking Endpoints
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/booking-management',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking', 'Availability'],
    }),
    getBooking: builder.query({
      query: (bookingId) => `/booking-management/${bookingId}`,
      providesTags: (result, error, bookingId) => [{ type: 'Booking', id: bookingId }],
    }),
    getMyBookings: builder.query({
      query: (params = {}) => ({
        url: '/booking-management',
        params: { action: 'my-bookings', ...params },
      }),
      providesTags: ['Booking'],
    }),
    updateBooking: builder.mutation({
      query: ({ bookingId, ...data }) => ({
        url: `/booking-management/${bookingId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'Booking', id: bookingId },
        'Booking',
      ],
    }),
    cancelBooking: builder.mutation({
      query: ({ bookingId, reason }) => ({
        url: `/booking-management/${bookingId}`,
        method: 'DELETE',
        body: { reason },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'Booking', id: bookingId },
        'Booking',
        'Availability',
      ],
    }),

    // Admin Dashboard Endpoints
    getDashboardOverview: builder.query({
      query: (dateRange = '30') => ({
        url: '/admin-dashboard',
        params: { action: 'overview', dateRange },
      }),
      providesTags: ['Dashboard'],
    }),
    getRealTimeMetrics: builder.query({
      query: () => ({
        url: '/admin-dashboard',
        params: { action: 'realtime' },
      }),
      providesTags: ['Dashboard'],
      // Refetch every 30 seconds for real-time data
      pollingInterval: 30000,
    }),
    getInventoryAnalytics: builder.query({
      query: (dateRange = '30') => ({
        url: '/admin-dashboard',
        params: { action: 'inventory-analytics', dateRange },
      }),
      providesTags: ['Dashboard'],
    }),
    getCustomerAnalytics: builder.query({
      query: (dateRange = '30') => ({
        url: '/admin-dashboard',
        params: { action: 'customer-analytics', dateRange },
      }),
      providesTags: ['Dashboard'],
    }),

    // Admin Inventory Management
    getAllInventoryAdmin: builder.query({
      query: (params = {}) => ({
        url: '/admin-inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    createInventoryItem: builder.mutation({
      query: (itemData) => ({
        url: '/admin-inventory',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Inventory'],
    }),
    updateInventoryItem: builder.mutation({
      query: ({ itemId, ...data }) => ({
        url: `/admin-inventory/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        'Inventory',
      ],
    }),
    deleteInventoryItem: builder.mutation({
      query: (itemId) => ({
        url: `/admin-inventory/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Admin Customer Management
    getAllCustomers: builder.query({
      query: (params = {}) => ({
        url: '/admin-customers',
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query({
      query: (customerId) => `/admin-customers/${customerId}`,
      providesTags: (result, error, customerId) => [{ type: 'Customer', id: customerId }],
    }),
    updateCustomer: builder.mutation({
      query: ({ customerId, ...data }) => ({
        url: `/admin-customers/${customerId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
        'Customer',
      ],
    }),

    // Admin Reports
    generateReport: builder.query({
      query: ({ reportType, ...params }) => ({
        url: '/admin-reports',
        params: { reportType, ...params },
      }),
      providesTags: ['Report'],
    }),
    exportReport: builder.mutation({
      query: ({ reportType, format, ...params }) => ({
        url: '/admin-reports/export',
        params: { reportType, format, ...params },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

// Export hooks for components
export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,

  // Inventory hooks
  useGetInventoryQuery,
  useGetInventoryItemQuery,
  useSearchInventoryQuery,
  useGetFeaturedInventoryQuery,

  // Availability hooks
  useCheckAvailabilityQuery,
  useCheckMultipleAvailabilityQuery,

  // Booking hooks
  useCreateBookingMutation,
  useGetBookingQuery,
  useGetMyBookingsQuery,
  useUpdateBookingMutation,
  useCancelBookingMutation,

  // Admin Dashboard hooks
  useGetDashboardOverviewQuery,
  useGetRealTimeMetricsQuery,
  useGetInventoryAnalyticsQuery,
  useGetCustomerAnalyticsQuery,

  // Admin Inventory hooks
  useGetAllInventoryAdminQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,

  // Admin Customer hooks
  useGetAllCustomersQuery,
  useGetCustomerQuery,
  useUpdateCustomerMutation,

  // Admin Reports hooks
  useGenerateReportQuery,
  useExportReportMutation,
} = midasApi;

// Configure Store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    inventory: inventoryReducer,
    ui: uiReducer,
    [midasApi.reducerPath]: midasApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(midasApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store;
