// Real-Time Availability Service for Midas The Lifestyle
// Comprehensive inventory availability checking with conflict prevention

const mongoose = require('mongoose');
const Inventory = require('../database/models/Inventory');
const Booking = require('../database/models/Booking');

// Availability checking configuration
const AVAILABILITY_CONFIG = {
  // Buffer times between bookings (in hours)
  bufferTimes: {
    cars: 2,        // 2 hours between car rentals
    yachts: 4,      // 4 hours between yacht charters
    jets: 6,        // 6 hours between jet flights
    properties: 12  // 12 hours between property rentals
  },
  
  // Maximum advance booking periods (in days)
  maxAdvanceBooking: {
    cars: 365,      // 1 year
    yachts: 730,    // 2 years
    jets: 365,      // 1 year
    properties: 1095 // 3 years
  },
  
  // Minimum notice periods (in hours)
  minimumNotice: {
    cars: 2,        // 2 hours
    yachts: 24,     // 24 hours
    jets: 48,       // 48 hours
    properties: 72  // 72 hours
  }
};

// Log availability events
const logAvailabilityEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'availability-service',
    eventType,
    severity,
    data
  };
  
  console.log(JSON.stringify(logEntry));
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Check if dates are valid for booking
const validateBookingDates = (startDate, endDate, itemType) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const errors = [];
  
  // Basic date validation
  if (start >= end) {
    errors.push('End date must be after start date');
  }
  
  // Check minimum notice
  const hoursUntilStart = (start - now) / (1000 * 60 * 60);
  const minimumNotice = AVAILABILITY_CONFIG.minimumNotice[itemType] || 2;
  
  if (hoursUntilStart < minimumNotice) {
    errors.push(`Minimum ${minimumNotice} hours notice required for ${itemType}`);
  }
  
  // Check maximum advance booking
  const daysInAdvance = (start - now) / (1000 * 60 * 60 * 24);
  const maxAdvance = AVAILABILITY_CONFIG.maxAdvanceBooking[itemType] || 365;
  
  if (daysInAdvance > maxAdvance) {
    errors.push(`Cannot book more than ${maxAdvance} days in advance for ${itemType}`);
  }
  
  return errors;
};

// Check for booking conflicts with buffer times
const checkBookingConflicts = async (itemId, startDate, endDate, excludeBookingId = null) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get item to determine buffer time
    const item = await Inventory.findOne({ itemId });
    if (!item) {
      throw new Error('Item not found');
    }
    
    const bufferHours = AVAILABILITY_CONFIG.bufferTimes[item.itemType] || 2;
    const bufferMs = bufferHours * 60 * 60 * 1000;
    
    // Extend search range with buffer times
    const searchStart = new Date(start.getTime() - bufferMs);
    const searchEnd = new Date(end.getTime() + bufferMs);
    
    // Build conflict query
    const conflictQuery = {
      'item.itemId': itemId,
      status: { 
        $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] 
      },
      $or: [
        // Booking starts during our period
        { 
          startDate: { $gte: searchStart, $lt: searchEnd }
        },
        // Booking ends during our period
        { 
          endDate: { $gt: searchStart, $lte: searchEnd }
        },
        // Booking encompasses our period
        { 
          startDate: { $lte: searchStart },
          endDate: { $gte: searchEnd }
        }
      ]
    };
    
    // Exclude current booking if modifying
    if (excludeBookingId) {
      conflictQuery._id = { $ne: excludeBookingId };
    }
    
    const conflicts = await Booking.find(conflictQuery)
      .select('bookingId startDate endDate status item.itemName customer')
      .populate('customer', 'firstName lastName email');
    
    logAvailabilityEvent('conflict_check_completed', {
      itemId,
      requestedStart: startDate,
      requestedEnd: endDate,
      conflictsFound: conflicts.length,
      bufferHours
    }, conflicts.length > 0 ? 'warning' : 'info');
    
    return conflicts;
    
  } catch (error) {
    logAvailabilityEvent('conflict_check_failed', {
      itemId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Check item-specific availability rules
const checkItemAvailability = async (itemId, startDate, endDate) => {
  try {
    const item = await Inventory.findOne({ itemId });
    
    if (!item) {
      return {
        available: false,
        reason: 'Item not found',
        code: 'ITEM_NOT_FOUND'
      };
    }
    
    // Check if item is active
    if (!item.isAvailable) {
      return {
        available: false,
        reason: `${item.itemName} is currently unavailable`,
        code: 'ITEM_INACTIVE'
      };
    }
    
    // Check item status
    if (item.status !== 'available') {
      return {
        available: false,
        reason: `${item.itemName} is currently ${item.status}`,
        code: 'ITEM_STATUS_UNAVAILABLE'
      };
    }
    
    // Check blackout dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const hasBlackout = item.availability.blackoutDates.some(blackout => {
      const blackoutStart = new Date(blackout.startDate);
      const blackoutEnd = new Date(blackout.endDate);
      
      return (start <= blackoutEnd && end >= blackoutStart);
    });
    
    if (hasBlackout) {
      const conflictingBlackout = item.availability.blackoutDates.find(blackout => {
        const blackoutStart = new Date(blackout.startDate);
        const blackoutEnd = new Date(blackout.endDate);
        return (start <= blackoutEnd && end >= blackoutStart);
      });
      
      return {
        available: false,
        reason: `${item.itemName} is not available during this period: ${conflictingBlackout.reason}`,
        code: 'BLACKOUT_PERIOD',
        blackoutReason: conflictingBlackout.reason
      };
    }
    
    // Check minimum rental period
    const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (rentalDays < item.pricing.minimumRental.days) {
      return {
        available: false,
        reason: `Minimum rental period is ${item.pricing.minimumRental.days} days for ${item.itemName}`,
        code: 'MINIMUM_RENTAL_NOT_MET',
        minimumDays: item.pricing.minimumRental.days
      };
    }
    
    return {
      available: true,
      item: {
        itemId: item.itemId,
        itemName: item.itemName,
        itemType: item.itemType,
        category: item.category,
        brand: item.brand,
        model: item.model,
        year: item.year,
        primaryImage: item.media.primaryImage,
        basePrice: item.pricing.basePrice,
        currency: item.pricing.currency,
        location: item.location.primaryLocation
      }
    };
    
  } catch (error) {
    logAvailabilityEvent('item_availability_check_failed', {
      itemId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Comprehensive availability check
const checkAvailability = async (itemId, startDate, endDate, excludeBookingId = null) => {
  try {
    logAvailabilityEvent('availability_check_started', {
      itemId,
      startDate,
      endDate,
      excludeBookingId
    }, 'info');
    
    // Get item details first
    const item = await Inventory.findOne({ itemId });
    if (!item) {
      return {
        available: false,
        reason: 'Item not found',
        code: 'ITEM_NOT_FOUND'
      };
    }
    
    // Validate booking dates
    const dateErrors = validateBookingDates(startDate, endDate, item.itemType);
    if (dateErrors.length > 0) {
      return {
        available: false,
        reason: dateErrors.join('; '),
        code: 'INVALID_DATES',
        errors: dateErrors
      };
    }
    
    // Check item-specific availability
    const itemAvailability = await checkItemAvailability(itemId, startDate, endDate);
    if (!itemAvailability.available) {
      return itemAvailability;
    }
    
    // Check for booking conflicts
    const conflicts = await checkBookingConflicts(itemId, startDate, endDate, excludeBookingId);
    if (conflicts.length > 0) {
      return {
        available: false,
        reason: `${item.itemName} is already booked during this period`,
        code: 'BOOKING_CONFLICT',
        conflicts: conflicts.map(conflict => ({
          bookingId: conflict.bookingId,
          startDate: conflict.startDate,
          endDate: conflict.endDate,
          status: conflict.status,
          customerName: conflict.customer ? 
            `${conflict.customer.firstName} ${conflict.customer.lastName}` : 'Unknown'
        }))
      };
    }
    
    logAvailabilityEvent('availability_check_completed', {
      itemId,
      available: true,
      itemName: item.itemName
    }, 'info');
    
    return {
      available: true,
      item: itemAvailability.item,
      pricing: item.calculatePrice(new Date(startDate), new Date(endDate)),
      bufferTime: AVAILABILITY_CONFIG.bufferTimes[item.itemType] || 2
    };
    
  } catch (error) {
    logAvailabilityEvent('availability_check_error', {
      itemId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      available: false,
      reason: 'Unable to check availability at this time',
      code: 'SYSTEM_ERROR',
      error: error.message
    };
  }
};

// Check availability for multiple items
const checkMultipleAvailability = async (items, startDate, endDate) => {
  try {
    const results = await Promise.all(
      items.map(async (itemId) => {
        const availability = await checkAvailability(itemId, startDate, endDate);
        return {
          itemId,
          ...availability
        };
      })
    );
    
    const available = results.filter(result => result.available);
    const unavailable = results.filter(result => !result.available);
    
    logAvailabilityEvent('multiple_availability_check_completed', {
      totalItems: items.length,
      availableCount: available.length,
      unavailableCount: unavailable.length,
      startDate,
      endDate
    }, 'info');
    
    return {
      available,
      unavailable,
      summary: {
        total: items.length,
        available: available.length,
        unavailable: unavailable.length
      }
    };
    
  } catch (error) {
    logAvailabilityEvent('multiple_availability_check_error', {
      items,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get availability calendar for an item
const getAvailabilityCalendar = async (itemId, startDate, endDate) => {
  try {
    const item = await Inventory.findOne({ itemId });
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Get all bookings in the date range
    const bookings = await Booking.find({
      'item.itemId': itemId,
      status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] },
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    }).select('bookingId startDate endDate status');
    
    // Get blackout dates in the range
    const blackoutDates = item.availability.blackoutDates.filter(blackout => {
      const blackoutStart = new Date(blackout.startDate);
      const blackoutEnd = new Date(blackout.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      return (blackoutStart <= rangeEnd && blackoutEnd >= rangeStart);
    });
    
    logAvailabilityEvent('calendar_generated', {
      itemId,
      itemName: item.itemName,
      dateRange: { startDate, endDate },
      bookingsCount: bookings.length,
      blackoutDatesCount: blackoutDates.length
    }, 'info');
    
    return {
      itemId,
      itemName: item.itemName,
      dateRange: { startDate, endDate },
      bookings: bookings.map(booking => ({
        bookingId: booking.bookingId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        type: 'booking'
      })),
      blackoutDates: blackoutDates.map(blackout => ({
        startDate: blackout.startDate,
        endDate: blackout.endDate,
        reason: blackout.reason,
        type: 'blackout'
      })),
      bufferTime: AVAILABILITY_CONFIG.bufferTimes[item.itemType] || 2
    };
    
  } catch (error) {
    logAvailabilityEvent('calendar_generation_failed', {
      itemId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Reserve item temporarily (for checkout process)
const createTemporaryReservation = async (itemId, startDate, endDate, userId, durationMinutes = 15) => {
  try {
    // Check availability first
    const availability = await checkAvailability(itemId, startDate, endDate);
    if (!availability.available) {
      throw new Error(`Item not available: ${availability.reason}`);
    }
    
    const reservationId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + (durationMinutes * 60 * 1000));
    
    // Create temporary booking record
    const tempBooking = new Booking({
      bookingId: reservationId,
      customer: userId,
      item: {
        itemId: availability.item.itemId,
        itemName: availability.item.itemName,
        itemType: availability.item.itemType
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'temporary-hold',
      pricing: {
        basePrice: availability.pricing.basePrice,
        total: availability.pricing.subtotal,
        currency: availability.item.currency
      },
      payment: {
        method: 'pending',
        status: 'pending'
      },
      // Mark as temporary with expiration
      isTemporary: true,
      expiresAt
    });
    
    await tempBooking.save();
    
    // Schedule cleanup
    setTimeout(async () => {
      try {
        await Booking.deleteOne({ 
          bookingId: reservationId,
          isTemporary: true,
          expiresAt: { $lte: new Date() }
        });
        
        logAvailabilityEvent('temporary_reservation_expired', {
          reservationId,
          itemId,
          userId
        }, 'info');
      } catch (error) {
        logAvailabilityEvent('temporary_reservation_cleanup_failed', {
          reservationId,
          error: error.message
        }, 'error');
      }
    }, durationMinutes * 60 * 1000);
    
    logAvailabilityEvent('temporary_reservation_created', {
      reservationId,
      itemId,
      userId,
      expiresAt,
      durationMinutes
    }, 'info');
    
    return {
      reservationId,
      expiresAt,
      item: availability.item,
      pricing: availability.pricing
    };
    
  } catch (error) {
    logAvailabilityEvent('temporary_reservation_failed', {
      itemId,
      userId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export availability service functions
module.exports = {
  checkAvailability,
  checkMultipleAvailability,
  getAvailabilityCalendar,
  createTemporaryReservation,
  checkBookingConflicts,
  validateBookingDates,
  AVAILABILITY_CONFIG
};
