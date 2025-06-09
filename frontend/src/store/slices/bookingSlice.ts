// Booking Redux Slice for Midas The Lifestyle
// Manages booking state, current booking flow, and booking history

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, CreateBookingRequest, InventoryItem, BookingLocation } from '@/types/api';
import { bookingApi, availabilityApi } from '@/services/api';

// Booking Flow Steps
export type BookingStep = 
  | 'vehicle-selection'
  | 'date-selection'
  | 'location-details'
  | 'service-tier'
  | 'add-ons'
  | 'guest-details'
  | 'review'
  | 'payment'
  | 'confirmation';

// Current Booking State Interface
interface CurrentBooking {
  step: BookingStep;
  selectedItem: InventoryItem | null;
  startDate: string | null;
  endDate: string | null;
  pickupLocation: BookingLocation | null;
  dropoffLocation: BookingLocation | null;
  serviceTier: 'standard' | 'premium' | 'vvip';
  specialRequests: string[];
  addOns: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  pricing: {
    basePrice: number;
    serviceTierMultiplier: number;
    seasonalMultiplier: number;
    subtotal: number;
    addOnsTotal: number;
    serviceFee: number;
    insurance: number;
    taxes: number;
    securityDeposit: number;
    total: number;
    currency: string;
  } | null;
  isAvailable: boolean;
  availabilityChecked: boolean;
  temporaryReservationId: string | null;
  temporaryReservationExpiry: string | null;
}

// Booking State Interface
interface BookingState {
  currentBooking: CurrentBooking;
  myBookings: Booking[];
  selectedBooking: Booking | null;
  bookingHistory: any[];
  isLoading: boolean;
  isCreatingBooking: boolean;
  isCheckingAvailability: boolean;
  error: string | null;
  availabilityError: string | null;
  lastAvailabilityCheck: number | null;
  bookingFilters: {
    status: string[];
    dateRange: {
      startDate: string | null;
      endDate: string | null;
    };
    itemType: string[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Initial State
const initialCurrentBooking: CurrentBooking = {
  step: 'vehicle-selection',
  selectedItem: null,
  startDate: null,
  endDate: null,
  pickupLocation: null,
  dropoffLocation: null,
  serviceTier: 'standard',
  specialRequests: [],
  addOns: [],
  guestDetails: null,
  pricing: null,
  isAvailable: false,
  availabilityChecked: false,
  temporaryReservationId: null,
  temporaryReservationExpiry: null,
};

const initialState: BookingState = {
  currentBooking: initialCurrentBooking,
  myBookings: [],
  selectedBooking: null,
  bookingHistory: [],
  isLoading: false,
  isCreatingBooking: false,
  isCheckingAvailability: false,
  error: null,
  availabilityError: null,
  lastAvailabilityCheck: null,
  bookingFilters: {
    status: [],
    dateRange: {
      startDate: null,
      endDate: null,
    },
    itemType: [],
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },
};

// Async Thunks
export const checkAvailability = createAsyncThunk(
  'booking/checkAvailability',
  async (
    params: { itemId: string; startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await availabilityApi.checkAvailability(params);
      if (response.success) {
        return response;
      } else {
        return rejectWithValue(response.error || 'Availability check failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const createTemporaryReservation = createAsyncThunk(
  'booking/createTemporaryReservation',
  async (
    params: { itemId: string; startDate: string; endDate: string; durationMinutes: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await availabilityApi.createTemporaryReservation(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Temporary reservation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData: CreateBookingRequest, { rejectWithValue }) => {
    try {
      const response = await bookingApi.createBooking(bookingData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Booking creation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (
    params: { status?: string; limit?: number; offset?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await bookingApi.getMyBookings(params);
      if (response.success && response.data) {
        return {
          bookings: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue(response.error || 'Failed to fetch bookings');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'booking/fetchBookingDetails',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await bookingApi.getBooking(bookingId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch booking details');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const updateBooking = createAsyncThunk(
  'booking/updateBooking',
  async (
    { bookingId, updates }: { bookingId: string; updates: Partial<Booking> },
    { rejectWithValue }
  ) => {
    try {
      const response = await bookingApi.updateBooking(bookingId, updates);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Booking update failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (
    { bookingId, reason }: { bookingId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await bookingApi.cancelBooking(bookingId, reason);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Booking cancellation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

// Booking Slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Booking Flow Management
    setBookingStep: (state, action: PayloadAction<BookingStep>) => {
      state.currentBooking.step = action.payload;
    },
    nextBookingStep: (state) => {
      const steps: BookingStep[] = [
        'vehicle-selection',
        'date-selection',
        'location-details',
        'service-tier',
        'add-ons',
        'guest-details',
        'review',
        'payment',
        'confirmation',
      ];
      const currentIndex = steps.indexOf(state.currentBooking.step);
      if (currentIndex < steps.length - 1) {
        state.currentBooking.step = steps[currentIndex + 1];
      }
    },
    previousBookingStep: (state) => {
      const steps: BookingStep[] = [
        'vehicle-selection',
        'date-selection',
        'location-details',
        'service-tier',
        'add-ons',
        'guest-details',
        'review',
        'payment',
        'confirmation',
      ];
      const currentIndex = steps.indexOf(state.currentBooking.step);
      if (currentIndex > 0) {
        state.currentBooking.step = steps[currentIndex - 1];
      }
    },

    // Current Booking Data Management
    setSelectedItem: (state, action: PayloadAction<InventoryItem>) => {
      state.currentBooking.selectedItem = action.payload;
      state.currentBooking.availabilityChecked = false;
      state.currentBooking.isAvailable = false;
    },
    setBookingDates: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.currentBooking.startDate = action.payload.startDate;
      state.currentBooking.endDate = action.payload.endDate;
      state.currentBooking.availabilityChecked = false;
      state.currentBooking.isAvailable = false;
    },
    setPickupLocation: (state, action: PayloadAction<BookingLocation>) => {
      state.currentBooking.pickupLocation = action.payload;
    },
    setDropoffLocation: (state, action: PayloadAction<BookingLocation>) => {
      state.currentBooking.dropoffLocation = action.payload;
    },
    setServiceTier: (state, action: PayloadAction<'standard' | 'premium' | 'vvip'>) => {
      state.currentBooking.serviceTier = action.payload;
    },
    setSpecialRequests: (state, action: PayloadAction<string[]>) => {
      state.currentBooking.specialRequests = action.payload;
    },
    addSpecialRequest: (state, action: PayloadAction<string>) => {
      if (!state.currentBooking.specialRequests.includes(action.payload)) {
        state.currentBooking.specialRequests.push(action.payload);
      }
    },
    removeSpecialRequest: (state, action: PayloadAction<string>) => {
      state.currentBooking.specialRequests = state.currentBooking.specialRequests.filter(
        (request) => request !== action.payload
      );
    },
    setAddOns: (state, action: PayloadAction<CurrentBooking['addOns']>) => {
      state.currentBooking.addOns = action.payload;
    },
    addAddOn: (state, action: PayloadAction<{ name: string; price: number; quantity: number }>) => {
      const existingIndex = state.currentBooking.addOns.findIndex(
        (addon) => addon.name === action.payload.name
      );
      if (existingIndex >= 0) {
        state.currentBooking.addOns[existingIndex].quantity += action.payload.quantity;
      } else {
        state.currentBooking.addOns.push(action.payload);
      }
    },
    removeAddOn: (state, action: PayloadAction<string>) => {
      state.currentBooking.addOns = state.currentBooking.addOns.filter(
        (addon) => addon.name !== action.payload
      );
    },
    setGuestDetails: (state, action: PayloadAction<CurrentBooking['guestDetails']>) => {
      state.currentBooking.guestDetails = action.payload;
    },
    setPricing: (state, action: PayloadAction<CurrentBooking['pricing']>) => {
      state.currentBooking.pricing = action.payload;
    },

    // Booking Management
    clearCurrentBooking: (state) => {
      state.currentBooking = initialCurrentBooking;
    },
    resetBookingFlow: (state) => {
      state.currentBooking = initialCurrentBooking;
      state.error = null;
      state.availabilityError = null;
    },
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload;
    },

    // Filters and Pagination
    setBookingFilters: (state, action: PayloadAction<Partial<BookingState['bookingFilters']>>) => {
      state.bookingFilters = { ...state.bookingFilters, ...action.payload };
    },
    clearBookingFilters: (state) => {
      state.bookingFilters = {
        status: [],
        dateRange: { startDate: null, endDate: null },
        itemType: [],
      };
    },
    setPagination: (state, action: PayloadAction<Partial<BookingState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Error Management
    clearError: (state) => {
      state.error = null;
    },
    clearAvailabilityError: (state) => {
      state.availabilityError = null;
    },
  },
  extraReducers: (builder) => {
    // Check Availability
    builder
      .addCase(checkAvailability.pending, (state) => {
        state.isCheckingAvailability = true;
        state.availabilityError = null;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.isCheckingAvailability = false;
        state.currentBooking.isAvailable = action.payload.available;
        state.currentBooking.availabilityChecked = true;
        state.lastAvailabilityCheck = Date.now();
        if (action.payload.pricing) {
          state.currentBooking.pricing = action.payload.pricing;
        }
      })
      .addCase(checkAvailability.rejected, (state, action) => {
        state.isCheckingAvailability = false;
        state.availabilityError = action.payload as string;
        state.currentBooking.isAvailable = false;
        state.currentBooking.availabilityChecked = true;
      });

    // Create Temporary Reservation
    builder
      .addCase(createTemporaryReservation.fulfilled, (state, action) => {
        state.currentBooking.temporaryReservationId = action.payload.reservationId;
        state.currentBooking.temporaryReservationExpiry = action.payload.expiresAt;
      });

    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isCreatingBooking = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isCreatingBooking = false;
        state.selectedBooking = action.payload;
        state.myBookings.unshift(action.payload);
        state.currentBooking = initialCurrentBooking;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isCreatingBooking = false;
        state.error = action.payload as string;
      });

    // Fetch My Bookings
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBookings = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Booking Details
    builder
      .addCase(fetchBookingDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Booking
    builder
      .addCase(updateBooking.fulfilled, (state, action) => {
        const index = state.myBookings.findIndex(
          (booking) => booking._id === action.payload._id
        );
        if (index >= 0) {
          state.myBookings[index] = action.payload;
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.myBookings.findIndex(
          (booking) => booking._id === action.payload._id
        );
        if (index >= 0) {
          state.myBookings[index] = action.payload;
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      });
  },
});

// Export actions
export const {
  setBookingStep,
  nextBookingStep,
  previousBookingStep,
  setSelectedItem,
  setBookingDates,
  setPickupLocation,
  setDropoffLocation,
  setServiceTier,
  setSpecialRequests,
  addSpecialRequest,
  removeSpecialRequest,
  setAddOns,
  addAddOn,
  removeAddOn,
  setGuestDetails,
  setPricing,
  clearCurrentBooking,
  resetBookingFlow,
  setSelectedBooking,
  setBookingFilters,
  clearBookingFilters,
  setPagination,
  clearError,
  clearAvailabilityError,
} = bookingSlice.actions;

// Selectors
export const selectBooking = (state: { booking: BookingState }) => state.booking;
export const selectCurrentBooking = (state: { booking: BookingState }) => state.booking.currentBooking;
export const selectMyBookings = (state: { booking: BookingState }) => state.booking.myBookings;
export const selectSelectedBooking = (state: { booking: BookingState }) => state.booking.selectedBooking;
export const selectBookingStep = (state: { booking: BookingState }) => state.booking.currentBooking.step;
export const selectIsBookingAvailable = (state: { booking: BookingState }) => state.booking.currentBooking.isAvailable;
export const selectBookingPricing = (state: { booking: BookingState }) => state.booking.currentBooking.pricing;

// Export reducer
export default bookingSlice.reducer;
