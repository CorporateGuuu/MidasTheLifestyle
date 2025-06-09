// Calendar Integration Service for Midas The Lifestyle
// Two-way synchronization with Google Calendar and Outlook for inventory management

const { google } = require('googleapis');
const Booking = require('../database/models/Booking');
const Inventory = require('../database/models/Inventory');
const User = require('../database/models/User');

// Calendar configuration
const CALENDAR_CONFIG = {
  google: {
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    timeZone: 'UTC'
  },
  
  // Calendar naming conventions
  calendarNames: {
    cars: 'Midas Luxury Cars',
    yachts: 'Midas Yachts',
    jets: 'Midas Private Jets',
    properties: 'Midas Properties'
  },
  
  // Event colors for different booking statuses
  eventColors: {
    'confirmed': '2',      // Green
    'preparing': '5',      // Yellow
    'ready-for-pickup': '6', // Orange
    'in-progress': '11',   // Red
    'completed': '8',      // Gray
    'cancelled': '4',      // Light Red
    'blocked': '9'         // Blue (for maintenance/blackout)
  }
};

// Log calendar events
const logCalendarEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'calendar-integration',
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

// Initialize Google Calendar client
const initializeGoogleCalendar = () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID
      },
      scopes: CALENDAR_CONFIG.google.scopes
    });
    
    return google.calendar({ version: 'v3', auth });
    
  } catch (error) {
    logCalendarEvent('google_calendar_init_failed', {
      error: error.message
    }, 'error');
    throw new Error('Failed to initialize Google Calendar client');
  }
};

// Get or create calendar for item type
const getOrCreateCalendar = async (calendar, itemType) => {
  try {
    const calendarName = CALENDAR_CONFIG.calendarNames[itemType];
    
    // List existing calendars
    const calendarList = await calendar.calendarList.list();
    const existingCalendar = calendarList.data.items?.find(
      cal => cal.summary === calendarName
    );
    
    if (existingCalendar) {
      logCalendarEvent('calendar_found', {
        itemType,
        calendarId: existingCalendar.id,
        calendarName
      }, 'info');
      
      return existingCalendar.id;
    }
    
    // Create new calendar
    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        description: `Midas The Lifestyle ${itemType} booking calendar`,
        timeZone: CALENDAR_CONFIG.google.timeZone
      }
    });
    
    logCalendarEvent('calendar_created', {
      itemType,
      calendarId: newCalendar.data.id,
      calendarName
    }, 'info');
    
    return newCalendar.data.id;
    
  } catch (error) {
    logCalendarEvent('calendar_creation_failed', {
      itemType,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Create calendar event for booking
const createBookingEvent = async (booking) => {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      logCalendarEvent('calendar_not_configured', {
        bookingId: booking.bookingId
      }, 'warning');
      return null;
    }
    
    const calendar = initializeGoogleCalendar();
    const calendarId = await getOrCreateCalendar(calendar, booking.item.itemType);
    
    const eventTitle = `${booking.item.itemName} - ${booking.customer?.firstName || booking.guestDetails?.firstName} ${booking.customer?.lastName || booking.guestDetails?.lastName}`;
    const eventDescription = `
Booking ID: ${booking.bookingId}
Item: ${booking.item.itemName}
Customer: ${booking.customer?.firstName || booking.guestDetails?.firstName} ${booking.customer?.lastName || booking.guestDetails?.lastName}
Email: ${booking.customer?.email || booking.guestDetails?.email}
Phone: ${booking.customer?.phone || booking.guestDetails?.phone || 'Not provided'}
Status: ${booking.status}
Total: ${booking.pricing.currency} ${booking.pricing.total}

Pickup Location: ${booking.location.pickup.address || 'TBD'}
Dropoff Location: ${booking.location.dropoff.address || 'Same as pickup'}

Special Requests: ${booking.serviceDetails.specialRequests?.join(', ') || 'None'}
    `.trim();
    
    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: booking.startDate.toISOString(),
        timeZone: CALENDAR_CONFIG.google.timeZone
      },
      end: {
        dateTime: booking.endDate.toISOString(),
        timeZone: CALENDAR_CONFIG.google.timeZone
      },
      colorId: CALENDAR_CONFIG.eventColors[booking.status] || CALENDAR_CONFIG.eventColors.confirmed,
      extendedProperties: {
        private: {
          bookingId: booking.bookingId,
          itemId: booking.item.itemId,
          customerId: booking.customer?._id?.toString() || 'guest',
          source: 'midas-booking-system'
        }
      },
      attendees: [
        {
          email: booking.customer?.email || booking.guestDetails?.email,
          displayName: `${booking.customer?.firstName || booking.guestDetails?.firstName} ${booking.customer?.lastName || booking.guestDetails?.lastName}`,
          responseStatus: 'accepted'
        }
      ]
    };
    
    // Add concierge if assigned
    if (booking.serviceDetails.conciergeAssigned) {
      const concierge = await User.findById(booking.serviceDetails.conciergeAssigned);
      if (concierge) {
        event.attendees.push({
          email: concierge.email,
          displayName: `${concierge.firstName} ${concierge.lastName} (Concierge)`,
          responseStatus: 'accepted'
        });
      }
    }
    
    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event
    });
    
    // Store calendar event ID in booking
    await Booking.updateOne(
      { bookingId: booking.bookingId },
      { 
        $set: { 
          'calendarIntegration.googleEventId': createdEvent.data.id,
          'calendarIntegration.googleCalendarId': calendarId,
          'calendarIntegration.lastSynced': new Date()
        }
      }
    );
    
    logCalendarEvent('booking_event_created', {
      bookingId: booking.bookingId,
      eventId: createdEvent.data.id,
      calendarId,
      itemType: booking.item.itemType
    }, 'info');
    
    return createdEvent.data;
    
  } catch (error) {
    logCalendarEvent('booking_event_creation_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Update calendar event for booking
const updateBookingEvent = async (booking) => {
  try {
    if (!booking.calendarIntegration?.googleEventId) {
      // Create event if it doesn't exist
      return await createBookingEvent(booking);
    }
    
    const calendar = initializeGoogleCalendar();
    const calendarId = booking.calendarIntegration.googleCalendarId;
    const eventId = booking.calendarIntegration.googleEventId;
    
    const eventTitle = `${booking.item.itemName} - ${booking.customer?.firstName || booking.guestDetails?.firstName} ${booking.customer?.lastName || booking.guestDetails?.lastName}`;
    const eventDescription = `
Booking ID: ${booking.bookingId}
Item: ${booking.item.itemName}
Customer: ${booking.customer?.firstName || booking.guestDetails?.firstName} ${booking.customer?.lastName || booking.guestDetails?.lastName}
Email: ${booking.customer?.email || booking.guestDetails?.email}
Phone: ${booking.customer?.phone || booking.guestDetails?.phone || 'Not provided'}
Status: ${booking.status}
Total: ${booking.pricing.currency} ${booking.pricing.total}

Pickup Location: ${booking.location.pickup.address || 'TBD'}
Dropoff Location: ${booking.location.dropoff.address || 'Same as pickup'}

Special Requests: ${booking.serviceDetails.specialRequests?.join(', ') || 'None'}

Last Updated: ${new Date().toISOString()}
    `.trim();
    
    const updatedEvent = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: eventTitle,
        description: eventDescription,
        start: {
          dateTime: booking.startDate.toISOString(),
          timeZone: CALENDAR_CONFIG.google.timeZone
        },
        end: {
          dateTime: booking.endDate.toISOString(),
          timeZone: CALENDAR_CONFIG.google.timeZone
        },
        colorId: CALENDAR_CONFIG.eventColors[booking.status] || CALENDAR_CONFIG.eventColors.confirmed
      }
    });
    
    // Update last synced timestamp
    await Booking.updateOne(
      { bookingId: booking.bookingId },
      { $set: { 'calendarIntegration.lastSynced': new Date() } }
    );
    
    logCalendarEvent('booking_event_updated', {
      bookingId: booking.bookingId,
      eventId,
      calendarId,
      newStatus: booking.status
    }, 'info');
    
    return updatedEvent.data;
    
  } catch (error) {
    logCalendarEvent('booking_event_update_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Delete calendar event for booking
const deleteBookingEvent = async (booking) => {
  try {
    if (!booking.calendarIntegration?.googleEventId) {
      return; // No event to delete
    }
    
    const calendar = initializeGoogleCalendar();
    const calendarId = booking.calendarIntegration.googleCalendarId;
    const eventId = booking.calendarIntegration.googleEventId;
    
    await calendar.events.delete({
      calendarId,
      eventId
    });
    
    // Clear calendar integration data
    await Booking.updateOne(
      { bookingId: booking.bookingId },
      { 
        $unset: { 
          'calendarIntegration.googleEventId': '',
          'calendarIntegration.googleCalendarId': ''
        },
        $set: { 'calendarIntegration.lastSynced': new Date() }
      }
    );
    
    logCalendarEvent('booking_event_deleted', {
      bookingId: booking.bookingId,
      eventId,
      calendarId
    }, 'info');
    
  } catch (error) {
    logCalendarEvent('booking_event_deletion_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Create blackout period event
const createBlackoutEvent = async (itemId, blackoutPeriod) => {
  try {
    const item = await Inventory.findOne({ itemId });
    if (!item) {
      throw new Error('Item not found');
    }
    
    const calendar = initializeGoogleCalendar();
    const calendarId = await getOrCreateCalendar(calendar, item.itemType);
    
    const eventTitle = `BLOCKED - ${item.itemName}`;
    const eventDescription = `
Item: ${item.itemName}
Reason: ${blackoutPeriod.reason}
Type: Maintenance/Blackout Period

This item is not available for booking during this period.
    `.trim();
    
    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: blackoutPeriod.startDate.toISOString(),
        timeZone: CALENDAR_CONFIG.google.timeZone
      },
      end: {
        dateTime: blackoutPeriod.endDate.toISOString(),
        timeZone: CALENDAR_CONFIG.google.timeZone
      },
      colorId: CALENDAR_CONFIG.eventColors.blocked,
      extendedProperties: {
        private: {
          itemId: itemId,
          type: 'blackout',
          source: 'midas-inventory-system'
        }
      }
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event
    });
    
    logCalendarEvent('blackout_event_created', {
      itemId,
      eventId: createdEvent.data.id,
      calendarId,
      reason: blackoutPeriod.reason
    }, 'info');
    
    return createdEvent.data;
    
  } catch (error) {
    logCalendarEvent('blackout_event_creation_failed', {
      itemId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Sync all bookings to calendar
const syncAllBookingsToCalendar = async (itemType = null) => {
  try {
    const query = {
      status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] }
    };
    
    if (itemType) {
      query['item.itemType'] = itemType;
    }
    
    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('serviceDetails.conciergeAssigned', 'firstName lastName email');
    
    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };
    
    for (const booking of bookings) {
      try {
        if (booking.calendarIntegration?.googleEventId) {
          await updateBookingEvent(booking);
        } else {
          await createBookingEvent(booking);
        }
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.bookingId,
          error: error.message
        });
      }
    }
    
    logCalendarEvent('bulk_sync_completed', {
      itemType,
      totalBookings: bookings.length,
      synced: results.synced,
      failed: results.failed
    }, results.failed > 0 ? 'warning' : 'info');
    
    return results;
    
  } catch (error) {
    logCalendarEvent('bulk_sync_failed', {
      itemType,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Check for external calendar conflicts
const checkExternalCalendarConflicts = async (itemId, startDate, endDate) => {
  try {
    const item = await Inventory.findOne({ itemId });
    if (!item) {
      throw new Error('Item not found');
    }
    
    const calendar = initializeGoogleCalendar();
    const calendarId = await getOrCreateCalendar(calendar, item.itemType);
    
    const events = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const conflicts = events.data.items?.filter(event => {
      // Exclude our own booking events
      const isOurEvent = event.extendedProperties?.private?.source === 'midas-booking-system';
      return !isOurEvent;
    }) || [];
    
    logCalendarEvent('external_conflicts_checked', {
      itemId,
      startDate,
      endDate,
      conflictsFound: conflicts.length
    }, conflicts.length > 0 ? 'warning' : 'info');
    
    return conflicts.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      description: event.description
    }));
    
  } catch (error) {
    logCalendarEvent('external_conflict_check_failed', {
      itemId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export calendar integration functions
module.exports = {
  createBookingEvent,
  updateBookingEvent,
  deleteBookingEvent,
  createBlackoutEvent,
  syncAllBookingsToCalendar,
  checkExternalCalendarConflicts,
  CALENDAR_CONFIG
};
