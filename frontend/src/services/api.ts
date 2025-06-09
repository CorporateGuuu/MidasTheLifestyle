// API Service Layer for Midas The Lifestyle Frontend
// Comprehensive service for all backend API endpoints with error handling and token management

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiResponse,
  AuthRequest,
  RegisterRequest,
  AuthResponse,
  User,
  InventoryItem,
  Booking,
  CreateBookingRequest,
  AvailabilityRequest,
  AvailabilityResponse,
  MultipleAvailabilityRequest,
  MultipleAvailabilityResponse,
  DashboardMetrics,
  BusinessReport,
  SearchRequest,
  SearchResponse,
  PaginatedResponse,
} from '@/types/api';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/.netlify/functions';
const API_TIMEOUT = 30000; // 30 seconds

// Token Management
class TokenManager {
  private static readonly TOKEN_KEY = 'midas_auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'midas_refresh_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// API Client Configuration
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = TokenManager.getToken();
        if (token && !TokenManager.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { token } = response.data;
              
              TokenManager.setToken(token);
              this.processQueue(null, token);
              
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            TokenManager.clearTokens();
            window.location.href = '/login';
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse> {
    return this.client.post('/auth-refresh', { refreshToken });
  }

  // Generic API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Authentication API
export const authApi = {
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth-register', data),

  login: (data: AuthRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth-login', data),

  googleAuth: (code: string): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth-google', { code }),

  logout: (): Promise<ApiResponse> =>
    apiClient.post('/auth-logout'),

  getCurrentUser: (): Promise<ApiResponse<User>> =>
    apiClient.get<User>('/auth-me'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put<User>('/auth-profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> =>
    apiClient.post('/auth-change-password', data),

  forgotPassword: (email: string): Promise<ApiResponse> =>
    apiClient.post('/auth-forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }): Promise<ApiResponse> =>
    apiClient.post('/auth-reset-password', data),
};

// Availability API
export const availabilityApi = {
  checkAvailability: (params: AvailabilityRequest): Promise<AvailabilityResponse> =>
    apiClient.get<AvailabilityResponse>('/availability-check', { params }),

  checkMultipleAvailability: (params: MultipleAvailabilityRequest): Promise<MultipleAvailabilityResponse> =>
    apiClient.get<MultipleAvailabilityResponse>('/availability-check', { 
      params: { action: 'multiple', ...params } 
    }),

  getAvailabilityCalendar: (itemId: string, startDate: string, endDate: string): Promise<ApiResponse> =>
    apiClient.get('/availability-check', { 
      params: { action: 'calendar', itemId, startDate, endDate } 
    }),

  createTemporaryReservation: (data: AvailabilityRequest & { durationMinutes: number }): Promise<ApiResponse> =>
    apiClient.post('/availability-check', { action: 'temporary-reservation', ...data }),
};

// Booking Management API
export const bookingApi = {
  createBooking: (data: CreateBookingRequest): Promise<ApiResponse<Booking>> =>
    apiClient.post<Booking>('/booking-management', data),

  getBooking: (bookingId: string): Promise<ApiResponse<Booking>> =>
    apiClient.get<Booking>(`/booking-management/${bookingId}`),

  updateBooking: (bookingId: string, data: Partial<Booking>): Promise<ApiResponse<Booking>> =>
    apiClient.put<Booking>(`/booking-management/${bookingId}`, data),

  cancelBooking: (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> =>
    apiClient.delete<Booking>(`/booking-management/${bookingId}`, { data: { reason } }),

  getMyBookings: (params?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Booking>> =>
    apiClient.get<Booking[]>('/booking-management', { params: { action: 'my-bookings', ...params } }),

  searchBookings: (params: SearchRequest): Promise<PaginatedResponse<Booking>> =>
    apiClient.get<Booking[]>('/booking-management', { params: { action: 'search', ...params } }),

  updateBookingStatus: (bookingId: string, status: string, reason?: string): Promise<ApiResponse<Booking>> =>
    apiClient.put<Booking>(`/booking-management/${bookingId}`, { action: 'status', status, reason }),

  getBookingHistory: (bookingId: string): Promise<ApiResponse> =>
    apiClient.get(`/booking-management/${bookingId}/history`),
};

// Inventory API
export const inventoryApi = {
  getInventory: (params?: SearchRequest): Promise<SearchResponse> =>
    apiClient.get<InventoryItem[]>('/inventory', { params }),

  getInventoryItem: (itemId: string): Promise<ApiResponse<InventoryItem>> =>
    apiClient.get<InventoryItem>(`/inventory/${itemId}`),

  searchInventory: (params: SearchRequest): Promise<SearchResponse> =>
    apiClient.get<InventoryItem[]>('/inventory/search', { params }),

  getFeaturedInventory: (limit?: number): Promise<ApiResponse<InventoryItem[]>> =>
    apiClient.get<InventoryItem[]>('/inventory/featured', { params: { limit } }),

  getInventoryByCategory: (category: string, params?: SearchRequest): Promise<SearchResponse> =>
    apiClient.get<InventoryItem[]>(`/inventory/category/${category}`, { params }),
};

// Admin Dashboard API
export const adminApi = {
  getDashboardOverview: (dateRange?: string): Promise<ApiResponse<DashboardMetrics['overview']>> =>
    apiClient.get('/admin-dashboard', { params: { action: 'overview', dateRange } }),

  getRealTimeMetrics: (): Promise<ApiResponse<DashboardMetrics['realtime']>> =>
    apiClient.get('/admin-dashboard', { params: { action: 'realtime' } }),

  getInventoryAnalytics: (dateRange?: string): Promise<ApiResponse<DashboardMetrics['inventoryAnalytics']>> =>
    apiClient.get('/admin-dashboard', { params: { action: 'inventory-analytics', dateRange } }),

  getCustomerAnalytics: (dateRange?: string): Promise<ApiResponse<DashboardMetrics['customerAnalytics']>> =>
    apiClient.get('/admin-dashboard', { params: { action: 'customer-analytics', dateRange } }),
};

// Admin Inventory Management API
export const adminInventoryApi = {
  getAllInventory: (params?: SearchRequest): Promise<PaginatedResponse<InventoryItem>> =>
    apiClient.get<InventoryItem[]>('/admin-inventory', { params }),

  createInventoryItem: (data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> =>
    apiClient.post<InventoryItem>('/admin-inventory', data),

  updateInventoryItem: (itemId: string, data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> =>
    apiClient.put<InventoryItem>(`/admin-inventory/${itemId}`, data),

  deleteInventoryItem: (itemId: string): Promise<ApiResponse> =>
    apiClient.delete(`/admin-inventory/${itemId}`),

  bulkUpdateInventory: (data: { items: Array<{ itemId: string; updates: Partial<InventoryItem> }> }): Promise<ApiResponse> =>
    apiClient.post('/admin-inventory/bulk-update', data),

  getInventoryAnalytics: (itemId?: string, dateRange?: string): Promise<ApiResponse> =>
    apiClient.get('/admin-inventory/analytics', { params: { itemId, dateRange } }),

  scheduleMaintenace: (itemId: string, data: { startDate: string; endDate: string; reason: string }): Promise<ApiResponse> =>
    apiClient.post(`/admin-inventory/${itemId}/maintenance`, data),
};

// Admin Customer Management API
export const adminCustomerApi = {
  getAllCustomers: (params?: SearchRequest): Promise<PaginatedResponse<User>> =>
    apiClient.get<User[]>('/admin-customers', { params }),

  getCustomer: (customerId: string): Promise<ApiResponse<User>> =>
    apiClient.get<User>(`/admin-customers/${customerId}`),

  updateCustomer: (customerId: string, data: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put<User>(`/admin-customers/${customerId}`, data),

  getCustomerBookings: (customerId: string, params?: SearchRequest): Promise<PaginatedResponse<Booking>> =>
    apiClient.get<Booking[]>(`/admin-customers/${customerId}/bookings`, { params }),

  getCustomerAnalytics: (customerId?: string, dateRange?: string): Promise<ApiResponse> =>
    apiClient.get('/admin-customers/analytics', { params: { customerId, dateRange } }),

  getCustomerSegmentation: (dateRange?: string): Promise<ApiResponse> =>
    apiClient.get('/admin-customers/segmentation', { params: { dateRange } }),

  sendCustomerCommunication: (customerId: string, data: { type: string; message: string; subject?: string }): Promise<ApiResponse> =>
    apiClient.post(`/admin-customers/${customerId}/communication`, data),
};

// Admin Reports API
export const adminReportsApi = {
  generateReport: (reportType: string, params?: { dateRange?: string; format?: string }): Promise<ApiResponse<BusinessReport>> =>
    apiClient.get<BusinessReport>('/admin-reports', { params: { reportType, ...params } }),

  getFinancialReport: (dateRange?: string): Promise<ApiResponse<BusinessReport>> =>
    apiClient.get<BusinessReport>('/admin-reports', { params: { reportType: 'financial', dateRange } }),

  getOperationalReport: (dateRange?: string): Promise<ApiResponse<BusinessReport>> =>
    apiClient.get<BusinessReport>('/admin-reports', { params: { reportType: 'operational', dateRange } }),

  getCustomerAnalyticsReport: (dateRange?: string): Promise<ApiResponse<BusinessReport>> =>
    apiClient.get<BusinessReport>('/admin-reports', { params: { reportType: 'customer-analytics', dateRange } }),

  getKPIReport: (dateRange?: string): Promise<ApiResponse<BusinessReport>> =>
    apiClient.get<BusinessReport>('/admin-reports', { params: { reportType: 'kpi', dateRange } }),

  exportReport: (reportType: string, format: 'csv' | 'excel' | 'pdf', params?: any): Promise<Blob> =>
    apiClient.get(`/admin-reports/export`, { 
      params: { reportType, format, ...params },
      responseType: 'blob'
    }).then(response => response.data as Blob),

  scheduleReport: (data: { reportType: string; schedule: string; recipients: string[]; format: string }): Promise<ApiResponse> =>
    apiClient.post('/admin-reports/schedule', data),
};

// Calendar Sync API
export const calendarApi = {
  syncGoogleCalendar: (bookingId: string): Promise<ApiResponse> =>
    apiClient.post('/calendar-sync', { bookingId, action: 'sync' }),

  createCalendarEvent: (bookingId: string): Promise<ApiResponse> =>
    apiClient.post('/calendar-sync', { bookingId, action: 'create' }),

  updateCalendarEvent: (bookingId: string): Promise<ApiResponse> =>
    apiClient.post('/calendar-sync', { bookingId, action: 'update' }),

  deleteCalendarEvent: (bookingId: string): Promise<ApiResponse> =>
    apiClient.post('/calendar-sync', { bookingId, action: 'delete' }),

  getCalendarEvents: (startDate: string, endDate: string): Promise<ApiResponse> =>
    apiClient.get('/calendar-sync', { params: { startDate, endDate } }),
};

// Booking Status Scheduler API
export const bookingStatusApi = {
  triggerStatusUpdate: (bookingId: string): Promise<ApiResponse> =>
    apiClient.post('/booking-status-scheduler', { bookingId, action: 'trigger' }),

  getStatusHistory: (bookingId: string): Promise<ApiResponse> =>
    apiClient.get('/booking-status-scheduler', { params: { bookingId, action: 'history' } }),

  scheduleStatusUpdate: (bookingId: string, status: string, scheduledTime: string): Promise<ApiResponse> =>
    apiClient.post('/booking-status-scheduler', { bookingId, status, scheduledTime, action: 'schedule' }),
};

// Export all APIs
export {
  TokenManager,
  apiClient,
};

// Default export
export default {
  auth: authApi,
  availability: availabilityApi,
  booking: bookingApi,
  inventory: inventoryApi,
  admin: adminApi,
  adminInventory: adminInventoryApi,
  adminCustomer: adminCustomerApi,
  adminReports: adminReportsApi,
  calendar: calendarApi,
  bookingStatus: bookingStatusApi,
};
