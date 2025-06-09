// Calendar Synchronization API for Midas The Lifestyle
// Manages calendar integration and synchronization with external calendar services

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const {
  createBookingEvent,
  updateBookingEvent,
  deleteBookingEvent,
  createBlackoutEvent,
  syncAllBookingsToCalendar,
  checkExternalCalendarConflicts
} = require('../../services/calendarIntegrationService');
const Booking = require('../../database/models/Booking');
const Inventory = require('../../database/models/Inventory');

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
    service: 'calendar-sync-api',
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

// Main calendar sync handler
const calendarSyncHandler = withAuth(async (event, context) => {
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
    const queryParams = event.queryStringParameters || {};
    
    logAPIEvent('calendar_sync_request', {
      method,
      queryParams,
      userId: event.user?.id,
      userRole: event.user?.role
    }, 'info');
    
    // Route based on method and action
    switch (method) {
      case 'GET':
        return await handleGetCalendarSync(event, queryParams);
      case 'POST':
        return await handlePostCalendarSync(event);
      case 'PUT':
        return await handlePutCalendarSync(event);
      case 'DELETE':
        return await handleDeleteCalendarSync(event);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
  } catch (error) {
    logAPIEvent('calendar_sync_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Calendar synchronization failed',
        message: 'We apologize for the inconvenience. Please try again or contact our support team.'
      })
    };
  }
}, { roles: ['admin', 'concierge', 'super-admin'] }); // Require staff access

// Handle GET requests for calendar sync status and conflicts
const handleGetCalendarSync = async (event, queryParams) => {
  const { action, bookingId, itemId, startDate, endDate, itemType } = queryParams;
  
  try {
    switch (action) {
      case 'status':
        return await handleSyncStatus(bookingId);
        
      case 'conflicts':
        return await handleConflictCheck(itemId, startDate, endDate);
        
      case 'calendar-events':
        return await handleCalendarEvents(itemType, startDate, endDate);
        
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported GET actions: status, conflicts, calendar-events'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('calendar_get_error', {
      action,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Calendar operation failed',
        message: error.message
      })
    };
  }
};

// Handle POST requests for creating calendar events
const handlePostCalendarSync = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { action, bookingId, itemId, blackoutPeriod } = requestData;
    
    switch (action) {
      case 'sync-booking':
        return await handleBookingSync(bookingId);
        
      case 'create-blackout':
        return await handleBlackoutCreation(itemId, blackoutPeriod);
        
      case 'bulk-sync':
        return await handleBulkSync(requestData.itemType);
        
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported POST actions: sync-booking, create-blackout, bulk-sync'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('calendar_post_error', {
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Calendar creation failed',
        message: error.message
      })
    };
  }
};

// Handle PUT requests for updating calendar events
const handlePutCalendarSync = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { bookingId } = requestData;
    
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing bookingId parameter'
        })
      };
    }
    
    const booking = await Booking.findOne({ bookingId })
      .populate('customer', 'firstName lastName email phone')
      .populate('serviceDetails.conciergeAssigned', 'firstName lastName email');
    
    if (!booking) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Booking not found'
        })
      };
    }
    
    const updatedEvent = await updateBookingEvent(booking);
    
    logAPIEvent('calendar_event_updated', {
      bookingId,
      eventId: updatedEvent?.id,
      userId: event.user.id
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Calendar event updated successfully',
        event: updatedEvent,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    logAPIEvent('calendar_update_error', {
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Calendar update failed',
        message: error.message
      })
    };
  }
};

// Handle DELETE requests for removing calendar events
const handleDeleteCalendarSync = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { bookingId } = queryParams;
    
    if (!bookingId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing bookingId parameter'
        })
      };
    }
    
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
    
    await deleteBookingEvent(booking);
    
    logAPIEvent('calendar_event_deleted', {
      bookingId,
      userId: event.user.id
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Calendar event deleted successfully',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    logAPIEvent('calendar_delete_error', {
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Calendar deletion failed',
        message: error.message
      })
    };
  }
};

// Handle sync status check
const handleSyncStatus = async (bookingId) => {
  if (!bookingId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing bookingId parameter'
      })
    };
  }
  
  const booking = await Booking.findOne({ bookingId })
    .select('bookingId calendarIntegration status');
  
  if (!booking) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking not found'
      })
    };
  }
  
  const syncStatus = {
    bookingId,
    status: booking.status,
    calendarSync: {
      isLinked: !!booking.calendarIntegration?.googleEventId,
      googleEventId: booking.calendarIntegration?.googleEventId,
      googleCalendarId: booking.calendarIntegration?.googleCalendarId,
      lastSynced: booking.calendarIntegration?.lastSynced
    }
  };
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      syncStatus,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle conflict check
const handleConflictCheck = async (itemId, startDate, endDate) => {
  if (!itemId || !startDate || !endDate) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing required parameters: itemId, startDate, endDate'
      })
    };
  }
  
  const conflicts = await checkExternalCalendarConflicts(
    itemId,
    new Date(startDate),
    new Date(endDate)
  );
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      conflicts,
      itemId,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    })
  };
};

// Handle calendar events retrieval
const handleCalendarEvents = async (itemType, startDate, endDate) => {
  // This would fetch events from the calendar for display
  // Implementation depends on specific calendar service
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Calendar events retrieval not yet implemented',
      itemType,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    })
  };
};

// Handle booking sync
const handleBookingSync = async (bookingId) => {
  if (!bookingId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing bookingId parameter'
      })
    };
  }
  
  const booking = await Booking.findOne({ bookingId })
    .populate('customer', 'firstName lastName email phone')
    .populate('serviceDetails.conciergeAssigned', 'firstName lastName email');
  
  if (!booking) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Booking not found'
      })
    };
  }
  
  let event;
  if (booking.calendarIntegration?.googleEventId) {
    event = await updateBookingEvent(booking);
  } else {
    event = await createBookingEvent(booking);
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Booking synchronized to calendar successfully',
      event,
      bookingId,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle blackout creation
const handleBlackoutCreation = async (itemId, blackoutPeriod) => {
  if (!itemId || !blackoutPeriod) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing itemId or blackoutPeriod parameters'
      })
    };
  }
  
  const event = await createBlackoutEvent(itemId, {
    startDate: new Date(blackoutPeriod.startDate),
    endDate: new Date(blackoutPeriod.endDate),
    reason: blackoutPeriod.reason || 'Maintenance/Unavailable'
  });
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Blackout period created in calendar successfully',
      event,
      itemId,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle bulk sync
const handleBulkSync = async (itemType) => {
  const results = await syncAllBookingsToCalendar(itemType);
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Bulk synchronization completed',
      results,
      itemType,
      timestamp: new Date().toISOString()
    })
  };
};

module.exports = { handler: calendarSyncHandler };
