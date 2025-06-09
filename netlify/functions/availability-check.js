// Real-Time Availability Check API for Midas The Lifestyle
// Provides real-time inventory availability checking with conflict prevention

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const { 
  checkAvailability, 
  checkMultipleAvailability, 
  getAvailabilityCalendar,
  createTemporaryReservation 
} = require('../../services/availabilityService');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Log API events
const logAPIEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'availability-check-api',
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

// Validate date parameters
const validateDateParams = (startDate, endDate) => {
  const errors = [];
  
  if (!startDate) {
    errors.push('Start date is required');
  } else {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('Invalid start date format');
    }
  }
  
  if (!endDate) {
    errors.push('End date is required');
  } else {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('Invalid end date format');
    }
  }
  
  if (startDate && endDate && !errors.length) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
    
    // Check if dates are too far in the future (max 3 years)
    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 3);
    
    if (start > maxFuture) {
      errors.push('Start date cannot be more than 3 years in the future');
    }
  }
  
  return errors;
};

// Main availability check handler
const availabilityCheckHandler = withAuth(async (event, context) => {
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
    const path = event.path;
    const queryParams = event.queryStringParameters || {};
    
    logAPIEvent('availability_request', {
      method,
      path,
      queryParams,
      userId: event.user?.id,
      userAgent: event.headers['user-agent']
    }, 'info');
    
    // Route based on method and action
    if (method === 'GET') {
      return await handleGetAvailability(event, queryParams);
    } else if (method === 'POST') {
      return await handlePostAvailability(event);
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
  } catch (error) {
    logAPIEvent('availability_request_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Availability check failed',
        message: 'We apologize for the inconvenience. Please try again or contact our concierge team.'
      })
    };
  }
}, { optional: true }); // Allow unauthenticated users to check availability

// Handle GET requests for availability checking
const handleGetAvailability = async (event, queryParams) => {
  const { action, itemId, itemIds, startDate, endDate } = queryParams;
  
  // Validate required parameters
  const dateErrors = validateDateParams(startDate, endDate);
  if (dateErrors.length > 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Invalid parameters',
        errors: dateErrors
      })
    };
  }
  
  try {
    switch (action) {
      case 'single':
        return await handleSingleItemAvailability(itemId, startDate, endDate);
        
      case 'multiple':
        return await handleMultipleItemsAvailability(itemIds, startDate, endDate);
        
      case 'calendar':
        return await handleCalendarAvailability(itemId, startDate, endDate);
        
      default:
        // Default to single item check if itemId provided
        if (itemId) {
          return await handleSingleItemAvailability(itemId, startDate, endDate);
        }
        
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported actions: single, multiple, calendar'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('availability_get_error', {
      action,
      itemId,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Availability check failed',
        message: error.message
      })
    };
  }
};

// Handle POST requests for availability actions
const handlePostAvailability = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { action, itemId, startDate, endDate, durationMinutes } = requestData;
    
    // Validate required parameters
    const dateErrors = validateDateParams(startDate, endDate);
    if (dateErrors.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid parameters',
          errors: dateErrors
        })
      };
    }
    
    switch (action) {
      case 'reserve':
        return await handleTemporaryReservation(event, itemId, startDate, endDate, durationMinutes);
        
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported POST actions: reserve'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('availability_post_error', {
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Availability action failed',
        message: error.message
      })
    };
  }
};

// Handle single item availability check
const handleSingleItemAvailability = async (itemId, startDate, endDate) => {
  if (!itemId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing itemId parameter'
      })
    };
  }
  
  const availability = await checkAvailability(itemId, startDate, endDate);
  
  logAPIEvent('single_availability_checked', {
    itemId,
    startDate,
    endDate,
    available: availability.available
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      availability,
      requestedDates: {
        startDate,
        endDate
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Handle multiple items availability check
const handleMultipleItemsAvailability = async (itemIds, startDate, endDate) => {
  if (!itemIds) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing itemIds parameter'
      })
    };
  }
  
  // Parse itemIds (comma-separated string)
  const itemIdArray = itemIds.split(',').map(id => id.trim()).filter(id => id);
  
  if (itemIdArray.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'No valid item IDs provided'
      })
    };
  }
  
  // Limit to 50 items per request
  if (itemIdArray.length > 50) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Too many items requested (maximum 50)'
      })
    };
  }
  
  const results = await checkMultipleAvailability(itemIdArray, startDate, endDate);
  
  logAPIEvent('multiple_availability_checked', {
    itemCount: itemIdArray.length,
    startDate,
    endDate,
    availableCount: results.summary.available,
    unavailableCount: results.summary.unavailable
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      results,
      requestedDates: {
        startDate,
        endDate
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Handle calendar availability check
const handleCalendarAvailability = async (itemId, startDate, endDate) => {
  if (!itemId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing itemId parameter for calendar view'
      })
    };
  }
  
  const calendar = await getAvailabilityCalendar(itemId, startDate, endDate);
  
  logAPIEvent('calendar_availability_checked', {
    itemId,
    startDate,
    endDate,
    bookingsCount: calendar.bookings.length,
    blackoutDatesCount: calendar.blackoutDates.length
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      calendar,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle temporary reservation creation
const handleTemporaryReservation = async (event, itemId, startDate, endDate, durationMinutes = 15) => {
  // Require authentication for reservations
  if (!event.user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Authentication required',
        message: 'Please sign in to reserve items'
      })
    };
  }
  
  if (!itemId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing itemId parameter'
      })
    };
  }
  
  // Validate duration (5-30 minutes)
  const duration = Math.max(5, Math.min(30, durationMinutes || 15));
  
  const reservation = await createTemporaryReservation(
    itemId, 
    startDate, 
    endDate, 
    event.user.id, 
    duration
  );
  
  logAPIEvent('temporary_reservation_created', {
    reservationId: reservation.reservationId,
    itemId,
    userId: event.user.id,
    startDate,
    endDate,
    durationMinutes: duration
  }, 'info');
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      reservation,
      message: `Item reserved for ${duration} minutes. Please complete your booking before the reservation expires.`,
      timestamp: new Date().toISOString()
    })
  };
};

module.exports = { handler: availabilityCheckHandler };
