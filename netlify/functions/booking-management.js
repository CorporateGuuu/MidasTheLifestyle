// Comprehensive Booking Management API for Midas The Lifestyle
// Complete booking lifecycle management with luxury service standards

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const Booking = require('../../database/models/Booking');
const Inventory = require('../../database/models/Inventory');
const User = require('../../database/models/User');
const { checkAvailability } = require('../../services/availabilityService');
const { updateBookingStatus } = require('../../services/bookingStatusService');
const { createBookingEvent, updateBookingEvent } = require('../../services/calendarIntegrationService');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Log API events
const logAPIEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'booking-management-api',
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

// Main booking management handler
const bookingManagementHandler = withAuth(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(segment => segment);
    const bookingId = pathSegments[pathSegments.length - 1];
    
    logAPIEvent('booking_request', {
      method,
      path: event.path,
      bookingId,
      userId: event.user?.id,
      userRole: event.user?.role
    }, 'info');
    
    // Route based on method
    switch (method) {
      case 'GET':
        return await handleGetBooking(event, bookingId);
      case 'POST':
        return await handleCreateBooking(event);
      case 'PUT':
        return await handleUpdateBooking(event, bookingId);
      case 'DELETE':
        return await handleCancelBooking(event, bookingId);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
  } catch (error) {
    logAPIEvent('booking_request_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking operation failed',
        message: 'We apologize for the inconvenience. Please try again or contact our concierge team.'
      })
    };
  }
}, { optional: true }); // Allow both authenticated and guest users

// Handle GET requests for booking retrieval
const handleGetBooking = async (event, bookingId) => {
  const queryParams = event.queryStringParameters || {};
  const { action, status, customer, itemType, startDate, endDate, limit, offset } = queryParams;
  
  try {
    // If bookingId is provided, get specific booking
    if (bookingId && bookingId !== 'search' && bookingId !== 'analytics') {
      return await getSpecificBooking(event, bookingId);
    }
    
    // Handle different GET actions
    switch (action || bookingId) {
      case 'search':
        return await searchBookings(event, queryParams);
      case 'analytics':
        return await getBookingAnalytics(event, queryParams);
      case 'my-bookings':
        return await getCustomerBookings(event, queryParams);
      default:
        return await getAllBookings(event, queryParams);
    }
    
  } catch (error) {
    logAPIEvent('booking_get_error', {
      bookingId,
      action,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking retrieval failed',
        message: error.message
      })
    };
  }
};

// Get specific booking by ID
const getSpecificBooking = async (event, bookingId) => {
  const booking = await Booking.findOne({ bookingId })
    .populate('customer', 'firstName lastName email phone serviceProfile')
    .populate('serviceDetails.conciergeAssigned', 'firstName lastName email phone');
  
  if (!booking) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking not found'
      })
    };
  }
  
  // Check access permissions
  const canAccess = event.user?.role === 'admin' || 
                   event.user?.role === 'super-admin' ||
                   event.user?.role === 'concierge' ||
                   booking.customer?._id?.toString() === event.user?.id ||
                   booking.serviceDetails?.conciergeAssigned?._id?.toString() === event.user?.id;
  
  if (!canAccess) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Access denied',
        message: 'You do not have permission to view this booking'
      })
    };
  }
  
  logAPIEvent('booking_retrieved', {
    bookingId,
    userId: event.user?.id,
    status: booking.status
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      booking,
      timestamp: new Date().toISOString()
    })
  };
};

// Search bookings with filters
const searchBookings = async (event, queryParams) => {
  // Require staff access for search
  if (!event.user || !['admin', 'super-admin', 'concierge'].includes(event.user.role)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Access denied',
        message: 'Staff access required for booking search'
      })
    };
  }
  
  const { 
    status, 
    customer, 
    itemType, 
    startDate, 
    endDate, 
    limit = 50, 
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;
  
  // Build search query
  const query = {};
  
  if (status) {
    query.status = { $in: status.split(',') };
  }
  
  if (customer) {
    query.$or = [
      { 'customer': customer },
      { 'guestDetails.email': { $regex: customer, $options: 'i' } },
      { 'guestDetails.firstName': { $regex: customer, $options: 'i' } },
      { 'guestDetails.lastName': { $regex: customer, $options: 'i' } }
    ];
  }
  
  if (itemType) {
    query['item.itemType'] = itemType;
  }
  
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  
  // Execute search
  const bookings = await Booking.find(query)
    .populate('customer', 'firstName lastName email phone serviceProfile')
    .populate('serviceDetails.conciergeAssigned', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await Booking.countDocuments(query);
  
  logAPIEvent('bookings_searched', {
    query,
    resultsCount: bookings.length,
    totalCount: total,
    userId: event.user.id
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + bookings.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get customer's own bookings
const getCustomerBookings = async (event, queryParams) => {
  if (!event.user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Authentication required'
      })
    };
  }
  
  const { limit = 20, offset = 0, status } = queryParams;
  
  const query = { customer: event.user.id };
  
  if (status) {
    query.status = { $in: status.split(',') };
  }
  
  const bookings = await Booking.find(query)
    .populate('serviceDetails.conciergeAssigned', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await Booking.countDocuments(query);
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + bookings.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get all bookings (admin only)
const getAllBookings = async (event, queryParams) => {
  // Require admin access
  if (!event.user || !['admin', 'super-admin'].includes(event.user.role)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Access denied',
        message: 'Administrator access required'
      })
    };
  }
  
  const { limit = 50, offset = 0 } = queryParams;
  
  const bookings = await Booking.find({})
    .populate('customer', 'firstName lastName email serviceProfile')
    .populate('serviceDetails.conciergeAssigned', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await Booking.countDocuments({});
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + bookings.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get booking analytics
const getBookingAnalytics = async (event, queryParams) => {
  // Require staff access
  if (!event.user || !['admin', 'super-admin', 'concierge'].includes(event.user.role)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Access denied',
        message: 'Staff access required for analytics'
      })
    };
  }
  
  const { startDate, endDate, itemType } = queryParams;
  
  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  // Build item type filter
  const itemTypeFilter = itemType ? { 'item.itemType': itemType } : {};
  
  // Aggregate analytics data
  const analytics = await Booking.aggregate([
    { $match: { ...dateFilter, ...itemTypeFilter } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageBookingValue: { $avg: '$pricing.total' },
        statusBreakdown: {
          $push: '$status'
        },
        itemTypeBreakdown: {
          $push: '$item.itemType'
        }
      }
    }
  ]);
  
  // Process status breakdown
  const statusCounts = {};
  const itemTypeCounts = {};
  
  if (analytics.length > 0) {
    analytics[0].statusBreakdown.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    analytics[0].itemTypeBreakdown.forEach(type => {
      itemTypeCounts[type] = (itemTypeCounts[type] || 0) + 1;
    });
  }
  
  const result = {
    summary: analytics[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0
    },
    statusBreakdown: statusCounts,
    itemTypeBreakdown: itemTypeCounts,
    dateRange: { startDate, endDate },
    itemType
  };
  
  // Remove internal fields
  delete result.summary.statusBreakdown;
  delete result.summary.itemTypeBreakdown;
  delete result.summary._id;
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      analytics: result,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle POST requests for booking creation
const handleCreateBooking = async (event) => {
  try {
    const bookingData = JSON.parse(event.body);

    // Validate required fields
    const validationErrors = validateBookingData(bookingData);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation failed',
          errors: validationErrors
        })
      };
    }

    // Check availability
    const availability = await checkAvailability(
      bookingData.itemId,
      bookingData.startDate,
      bookingData.endDate
    );

    if (!availability.available) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Item not available',
          reason: availability.reason,
          code: availability.code
        })
      };
    }

    // Get item details
    const item = await Inventory.findOne({ itemId: bookingData.itemId });
    if (!item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Item not found'
        })
      };
    }

    // Calculate pricing
    const pricing = item.calculatePrice(
      new Date(bookingData.startDate),
      new Date(bookingData.endDate),
      bookingData.serviceTier || 'premium'
    );

    // Create booking
    const booking = new Booking({
      customer: event.user?.id || null,
      guestDetails: event.user ? null : {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        isGuest: true
      },
      item: {
        itemId: item.itemId,
        itemName: item.itemName,
        itemType: item.itemType,
        category: item.category,
        brand: item.brand,
        model: item.model,
        year: item.year,
        specifications: item.specifications,
        images: [item.media.primaryImage],
        description: item.description || `${item.year} ${item.brand} ${item.model}`
      },
      startDate: new Date(bookingData.startDate),
      endDate: new Date(bookingData.endDate),
      location: {
        pickup: bookingData.pickupLocation || {},
        dropoff: bookingData.dropoffLocation || {}
      },
      pricing: {
        basePrice: pricing.basePrice,
        serviceTier: bookingData.serviceTier || 'premium',
        serviceTierMultiplier: pricing.tierMultiplier,
        seasonalMultiplier: pricing.seasonalMultiplier,
        subtotal: pricing.subtotal,
        addOns: bookingData.addOns || [],
        addOnsTotal: (bookingData.addOns || []).reduce((sum, addon) => sum + (addon.price * addon.quantity), 0),
        serviceFee: pricing.subtotal * 0.05, // 5% service fee
        insurance: pricing.insurance,
        taxes: pricing.subtotal * 0.08, // 8% taxes (varies by location)
        securityDeposit: pricing.securityDeposit,
        total: pricing.subtotal + (pricing.subtotal * 0.05) + pricing.insurance + (pricing.subtotal * 0.08),
        currency: item.pricing.currency
      },
      payment: {
        method: 'pending',
        status: 'pending'
      },
      serviceDetails: {
        specialRequests: bookingData.specialRequests || [],
        vipServices: bookingData.vipServices || {}
      },
      source: 'website',
      ipAddress: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
      userAgent: event.headers['user-agent']
    });

    await booking.save();

    // Create calendar event
    try {
      await createBookingEvent(booking);
    } catch (calendarError) {
      logAPIEvent('calendar_event_creation_failed', {
        bookingId: booking.bookingId,
        error: calendarError.message
      }, 'warning');
    }

    // Send confirmation email
    try {
      const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;

      await fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_created',
          bookingId: booking.bookingId,
          customerEmail: booking.customer?.email || booking.guestDetails?.email,
          firstName: booking.customer?.firstName || booking.guestDetails?.firstName,
          lastName: booking.customer?.lastName || booking.guestDetails?.lastName,
          itemName: booking.item.itemName,
          startDate: booking.startDate,
          endDate: booking.endDate,
          total: booking.pricing.total,
          currency: booking.pricing.currency,
          source: 'booking-creation'
        })
      });
    } catch (emailError) {
      logAPIEvent('booking_confirmation_email_failed', {
        bookingId: booking.bookingId,
        error: emailError.message
      }, 'warning');
    }

    logAPIEvent('booking_created', {
      bookingId: booking.bookingId,
      itemId: booking.item.itemId,
      userId: event.user?.id,
      total: booking.pricing.total,
      isGuest: !event.user
    }, 'info');

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Booking created successfully',
        booking: {
          bookingId: booking.bookingId,
          status: booking.status,
          item: booking.item,
          startDate: booking.startDate,
          endDate: booking.endDate,
          pricing: booking.pricing,
          location: booking.location
        },
        nextSteps: [
          'Complete payment to confirm your booking',
          'You will receive a confirmation email once payment is processed',
          'Our concierge team will contact you 48 hours before your booking',
          'Prepare required documents (ID, driving license if applicable)'
        ],
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    logAPIEvent('booking_creation_error', {
      error: error.message,
      stack: error.stack
    }, 'error');

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking creation failed',
        message: error.message
      })
    };
  }
};

// Handle PUT requests for booking updates
const handleUpdateBooking = async (event, bookingId) => {
  if (!bookingId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing booking ID'
      })
    };
  }

  try {
    const updateData = JSON.parse(event.body);
    const { action, ...updates } = updateData;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Booking not found'
        })
      };
    }

    // Check permissions
    const canUpdate = event.user?.role === 'admin' ||
                     event.user?.role === 'super-admin' ||
                     event.user?.role === 'concierge' ||
                     booking.customer?._id?.toString() === event.user?.id;

    if (!canUpdate) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Access denied',
          message: 'You do not have permission to update this booking'
        })
      };
    }

    // Handle different update actions
    switch (action) {
      case 'status':
        return await updateBookingStatusAction(booking, updates.status, event.user?.id, updates.reason);

      case 'modify':
        return await modifyBookingDetails(booking, updates, event.user?.id);

      default:
        return await updateBookingFields(booking, updates, event.user?.id);
    }

  } catch (error) {
    logAPIEvent('booking_update_error', {
      bookingId,
      error: error.message
    }, 'error');

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking update failed',
        message: error.message
      })
    };
  }
};

// Handle DELETE requests for booking cancellation
const handleCancelBooking = async (event, bookingId) => {
  if (!bookingId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing booking ID'
      })
    };
  }

  try {
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Booking not found'
        })
      };
    }

    // Check permissions
    const canCancel = event.user?.role === 'admin' ||
                     event.user?.role === 'super-admin' ||
                     event.user?.role === 'concierge' ||
                     booking.customer?._id?.toString() === event.user?.id;

    if (!canCancel) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Access denied',
          message: 'You do not have permission to cancel this booking'
        })
      };
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Booking cannot be cancelled',
          message: 'This booking is too close to the start date or has already started'
        })
      };
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();

    // Update booking status to cancelled
    const updatedBooking = await updateBookingStatus(
      bookingId,
      'cancelled',
      event.user?.id,
      'Cancelled by customer request',
      {
        cancellation: {
          cancelledAt: new Date(),
          cancelledBy: event.user?.id,
          reason: 'Customer cancellation',
          refundAmount
        }
      }
    );

    logAPIEvent('booking_cancelled', {
      bookingId,
      userId: event.user?.id,
      refundAmount
    }, 'info');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Booking cancelled successfully',
        booking: updatedBooking,
        refund: {
          amount: refundAmount,
          currency: booking.pricing.currency,
          processingTime: '3-5 business days'
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    logAPIEvent('booking_cancellation_error', {
      bookingId,
      error: error.message
    }, 'error');

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking cancellation failed',
        message: error.message
      })
    };
  }
};

// Validate booking data
const validateBookingData = (data) => {
  const errors = [];

  if (!data.itemId) {
    errors.push('Item ID is required');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  } else if (isNaN(new Date(data.startDate).getTime())) {
    errors.push('Invalid start date format');
  }

  if (!data.endDate) {
    errors.push('End date is required');
  } else if (isNaN(new Date(data.endDate).getTime())) {
    errors.push('Invalid end date format');
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }

  // Guest booking validation
  if (!data.userId) {
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.email) errors.push('Email is required');
    if (!data.phone) errors.push('Phone number is required');
  }

  return errors;
};

// Update booking status action
const updateBookingStatusAction = async (booking, newStatus, userId, reason) => {
  const updatedBooking = await updateBookingStatus(
    booking.bookingId,
    newStatus,
    userId,
    reason
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: `Booking status updated to ${newStatus}`,
      booking: updatedBooking,
      timestamp: new Date().toISOString()
    })
  };
};

// Modify booking details
const modifyBookingDetails = async (booking, updates, userId) => {
  // This would handle date changes, location changes, etc.
  // For now, return not implemented
  return {
    statusCode: 501,
    headers: corsHeaders,
    body: JSON.stringify({
      error: 'Booking modification not yet implemented',
      message: 'Please contact our concierge team for booking modifications'
    })
  };
};

// Update booking fields
const updateBookingFields = async (booking, updates, userId) => {
  // Update allowed fields
  const allowedFields = ['serviceDetails', 'location', 'communications'];

  for (const field of allowedFields) {
    if (updates[field]) {
      booking[field] = { ...booking[field], ...updates[field] };
    }
  }

  booking.updatedAt = new Date();
  await booking.save();

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Booking updated successfully',
      booking,
      timestamp: new Date().toISOString()
    })
  };
};

module.exports = { handler: bookingManagementHandler };
