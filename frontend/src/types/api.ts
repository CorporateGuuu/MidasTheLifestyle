// API Type Definitions for Midas The Lifestyle Frontend
// Comprehensive TypeScript interfaces for all backend API endpoints

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User and Authentication Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'concierge' | 'admin' | 'super-admin';
  status: 'active' | 'inactive' | 'suspended';
  serviceProfile: {
    tier: 'standard' | 'premium' | 'vvip';
    preferredLocations: string[];
    preferredVehicleTypes: string[];
    specialRequests: string[];
  };
  loyaltyPoints: number;
  totalBookings: number;
  totalSpent: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'customer';
}

export interface AuthResponse extends ApiResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Inventory Types
export interface InventoryItem {
  _id: string;
  itemId: string;
  itemName: string;
  itemType: 'cars' | 'yachts' | 'jets' | 'properties';
  category: 'luxury' | 'exotic' | 'premium' | 'standard';
  brand: string;
  model: string;
  year: number;
  description: string;
  specifications: {
    engine?: string;
    horsepower?: number;
    topSpeed?: string;
    acceleration?: string;
    length?: string;
    capacity?: number;
    range?: string;
    bedrooms?: number;
    bathrooms?: number;
    [key: string]: any;
  };
  pricing: {
    basePrice: number;
    currency: string;
    minimumRental: {
      days: number;
      hours: number;
    };
    seasonalMultipliers?: {
      [season: string]: number;
    };
  };
  location: {
    primaryLocation: string;
    availableLocations: string[];
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability: {
    isAvailable: boolean;
    blackoutDates: Array<{
      startDate: string;
      endDate: string;
      reason: string;
    }>;
  };
  condition: {
    overall: 'excellent' | 'good' | 'fair';
    lastInspection: string;
    nextInspection: string;
    maintenanceNotes?: string;
  };
  media: {
    primaryImage: string;
    images: string[];
    videos: string[];
    virtualTour?: string;
  };
  seo: {
    featured: boolean;
    tags: string[];
    metaDescription?: string;
  };
  status: 'available' | 'maintenance' | 'reserved' | 'retired';
  createdAt: string;
  updatedAt: string;
}

// Booking Types
export interface BookingLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface BookingPricing {
  basePrice: number;
  serviceTier: 'standard' | 'premium' | 'vvip';
  serviceTierMultiplier: number;
  seasonalMultiplier: number;
  subtotal: number;
  addOns: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  addOnsTotal: number;
  serviceFee: number;
  insurance: number;
  taxes: number;
  securityDeposit: number;
  total: number;
  currency: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  customer: string | User;
  item: {
    itemId: string;
    itemName: string;
    itemType: string;
    category: string;
    brand: string;
    model: string;
    year: number;
  };
  startDate: string;
  endDate: string;
  location: {
    pickup: BookingLocation;
    dropoff: BookingLocation;
  };
  pricing: BookingPricing;
  payment: {
    method: 'pending' | 'stripe' | 'paypal' | 'bank_transfer';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentIntentId?: string;
  };
  status: 'pending-payment' | 'payment-processing' | 'confirmed' | 'preparing' | 
          'ready-for-pickup' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'refunded';
  serviceDetails: {
    specialRequests: string[];
    conciergeAssigned?: string;
    deliveryInstructions?: string;
    pickupInstructions?: string;
  };
  guestDetails?: {
    isGuest: boolean;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  communications: {
    confirmationSent: boolean;
    remindersSent: number;
    lastContact?: string;
  };
  modifications: Array<{
    modifiedBy: string;
    modifiedAt: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    };
    reason: string;
  }>;
  cancellation?: {
    cancelledAt: string;
    cancelledBy: string;
    reason: string;
    refundAmount: number;
    refundStatus: 'pending' | 'processing' | 'completed' | 'failed';
  };
  isTemporary: boolean;
  expiresAt?: string;
  source: 'website' | 'mobile' | 'phone' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  itemId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: BookingLocation;
  dropoffLocation?: BookingLocation;
  serviceTier?: 'standard' | 'premium' | 'vvip';
  specialRequests?: string[];
  addOns?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  // Guest booking fields
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Availability Types
export interface AvailabilityRequest {
  itemId: string;
  startDate: string;
  endDate: string;
}

export interface AvailabilityResponse extends ApiResponse {
  available: boolean;
  item?: InventoryItem;
  pricing?: BookingPricing;
  conflicts?: Array<{
    bookingId: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  blackoutReason?: string;
  minimumDays?: number;
  code?: 'ITEM_NOT_FOUND' | 'ITEM_INACTIVE' | 'BLACKOUT_PERIOD' | 
         'MINIMUM_RENTAL_NOT_MET' | 'BOOKING_CONFLICT' | 'AVAILABLE';
}

export interface MultipleAvailabilityRequest {
  itemIds: string[];
  startDate: string;
  endDate: string;
}

export interface MultipleAvailabilityResponse extends ApiResponse {
  available: AvailabilityResponse[];
  unavailable: AvailabilityResponse[];
  summary: {
    total: number;
    available: number;
    unavailable: number;
  };
}

// Admin Dashboard Types
export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    activeCustomers: number;
    inventoryUtilization: number;
    revenueGrowth: number;
    bookingGrowth: number;
    customerGrowth: number;
    utilizationGrowth: number;
  };
  realtime: {
    activeUsers: number;
    pendingBookings: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastUpdated: string;
  };
  inventoryAnalytics: {
    totalItems: number;
    availableItems: number;
    maintenanceItems: number;
    utilizationRate: number;
    topPerformingItems: Array<{
      itemId: string;
      itemName: string;
      revenue: number;
      bookings: number;
      utilization: number;
    }>;
  };
  customerAnalytics: {
    totalCustomers: number;
    newCustomers: number;
    vipCustomers: number;
    customerSegmentation: {
      standard: number;
      premium: number;
      vvip: number;
    };
    lifetimeValue: {
      average: number;
      median: number;
      top10Percent: number;
    };
  };
}

// Business Intelligence Types
export interface BusinessReport {
  reportType: 'financial' | 'operational' | 'customer-analytics' | 'kpi';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: {
    financial?: {
      totalRevenue: number;
      revenueByCategory: { [category: string]: number };
      revenueByMonth: Array<{ month: string; revenue: number }>;
      profitMargin: number;
      averageBookingValue: number;
    };
    operational?: {
      totalBookings: number;
      bookingsByStatus: { [status: string]: number };
      conversionRate: number;
      cancellationRate: number;
      utilizationRate: number;
    };
    customerAnalytics?: {
      acquisitionRate: number;
      retentionRate: number;
      churnRate: number;
      segmentDistribution: { [tier: string]: number };
      behaviorPatterns: any;
    };
    kpi?: {
      [metric: string]: {
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
  };
  generatedAt: string;
}

// Search and Filter Types
export interface SearchFilters {
  itemType?: 'cars' | 'yachts' | 'jets' | 'properties';
  category?: 'luxury' | 'exotic' | 'premium' | 'standard';
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  features?: string[];
  brand?: string;
  year?: {
    min: number;
    max: number;
  };
  capacity?: {
    min: number;
    max: number;
  };
}

export interface SearchRequest extends SearchFilters, PaginationParams {
  query?: string;
}

export interface SearchResponse extends PaginatedResponse<InventoryItem> {
  filters: {
    availableFilters: {
      itemTypes: string[];
      categories: string[];
      locations: string[];
      brands: string[];
      priceRange: { min: number; max: number };
      yearRange: { min: number; max: number };
    };
    appliedFilters: SearchFilters;
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'availability_update' | 'booking_status_change' | 'system_notification';
  data: any;
  timestamp: string;
}

export interface AvailabilityUpdate {
  itemId: string;
  available: boolean;
  reason?: string;
}

export interface BookingStatusUpdate {
  bookingId: string;
  status: string;
  message?: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraint: string;
}
