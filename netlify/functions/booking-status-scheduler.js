// Automated Booking Status Scheduler for Midas The Lifestyle
// Handles automated status transitions based on time triggers

const { withDatabase } = require('../../database/connection');
const Booking = require('../../database/models/Booking');
const { updateBookingStatus, STATUS_WORKFLOW } = require('../../services/bookingStatusService');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Log scheduler events
const logSchedulerEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'booking-status-scheduler',
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

// Calculate hours until booking start
const getHoursUntilStart = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  return (start - now) / (1000 * 60 * 60);
};

// Calculate hours since booking end
const getHoursSinceEnd = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  return (now - end) / (1000 * 60 * 60);
};

// Find bookings eligible for status updates
const findEligibleBookings = async () => {
  try {
    const now = new Date();
    const eligibleBookings = [];
    
    // Get all active bookings
    const activeBookings = await Booking.find({
      status: { 
        $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] 
      },
      startDate: { $exists: true },
      endDate: { $exists: true }
    }).select('bookingId status startDate endDate item.itemName customer');
    
    logSchedulerEvent('active_bookings_found', {
      count: activeBookings.length
    }, 'info');
    
    for (const booking of activeBookings) {
      const hoursUntilStart = getHoursUntilStart(booking.startDate);
      const hoursSinceEnd = getHoursSinceEnd(booking.endDate);
      
      let newStatus = null;
      let reason = null;
      
      // Check for status transitions based on time
      switch (booking.status) {
        case 'confirmed':
          if (hoursUntilStart <= STATUS_WORKFLOW.autoTriggers.preparing) {
            newStatus = 'preparing';
            reason = 'Automated transition: preparation phase started';
          }
          break;
          
        case 'preparing':
          if (hoursUntilStart <= STATUS_WORKFLOW.autoTriggers['ready-for-pickup']) {
            newStatus = 'ready-for-pickup';
            reason = 'Automated transition: item ready for pickup';
          }
          break;
          
        case 'ready-for-pickup':
          if (hoursUntilStart <= STATUS_WORKFLOW.autoTriggers['in-progress']) {
            newStatus = 'in-progress';
            reason = 'Automated transition: booking period started';
          } else if (hoursUntilStart < -2) { // 2 hours past start time
            newStatus = 'no-show';
            reason = 'Automated transition: customer no-show detected';
          }
          break;
          
        case 'in-progress':
          if (hoursSinceEnd >= Math.abs(STATUS_WORKFLOW.autoTriggers.completed)) {
            newStatus = 'completed';
            reason = 'Automated transition: booking period completed';
          }
          break;
      }
      
      if (newStatus) {
        eligibleBookings.push({
          booking,
          newStatus,
          reason,
          hoursUntilStart,
          hoursSinceEnd
        });
      }
    }
    
    logSchedulerEvent('eligible_bookings_identified', {
      eligibleCount: eligibleBookings.length,
      totalActive: activeBookings.length
    }, 'info');
    
    return eligibleBookings;
    
  } catch (error) {
    logSchedulerEvent('eligible_bookings_search_failed', {
      error: error.message
    }, 'error');
    throw error;
  }
};

// Process automated status updates
const processAutomatedUpdates = async () => {
  try {
    const eligibleBookings = await findEligibleBookings();
    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };
    
    for (const { booking, newStatus, reason } of eligibleBookings) {
      try {
        await updateBookingStatus(
          booking.bookingId,
          newStatus,
          null, // System update
          reason
        );
        
        results.processed++;
        
        logSchedulerEvent('automated_status_updated', {
          bookingId: booking.bookingId,
          oldStatus: booking.status,
          newStatus,
          reason
        }, 'info');
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.bookingId,
          error: error.message
        });
        
        logSchedulerEvent('automated_status_update_failed', {
          bookingId: booking.bookingId,
          newStatus,
          error: error.message
        }, 'error');
      }
    }
    
    logSchedulerEvent('automated_updates_completed', {
      totalEligible: eligibleBookings.length,
      processed: results.processed,
      failed: results.failed
    }, results.failed > 0 ? 'warning' : 'info');
    
    return results;
    
  } catch (error) {
    logSchedulerEvent('automated_updates_failed', {
      error: error.message
    }, 'error');
    throw error;
  }
};

// Send booking reminders
const sendBookingReminders = async () => {
  try {
    const now = new Date();
    const reminderTimes = [24, 4, 1]; // Hours before booking
    const results = {
      sent: 0,
      failed: 0
    };
    
    for (const hours of reminderTimes) {
      const targetTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
      const windowStart = new Date(targetTime.getTime() - (30 * 60 * 1000)); // 30 min window
      const windowEnd = new Date(targetTime.getTime() + (30 * 60 * 1000));
      
      const bookingsForReminder = await Booking.find({
        status: { $in: ['confirmed', 'preparing', 'ready-for-pickup'] },
        startDate: { $gte: windowStart, $lte: windowEnd },
        // Check if reminder hasn't been sent yet
        [`reminders.${hours}h`]: { $ne: true }
      }).populate('customer', 'firstName lastName email notifications');
      
      for (const booking of bookingsForReminder) {
        try {
          // Check if customer wants reminders
          if (booking.customer?.notifications?.sms?.bookingReminders || 
              booking.customer?.notifications?.email?.bookingConfirmations) {
            
            const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
            
            const response = await fetch(emailEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'booking_reminder',
                bookingId: booking.bookingId,
                customerEmail: booking.customer.email,
                firstName: booking.customer.firstName,
                lastName: booking.customer.lastName,
                itemName: booking.item.itemName,
                startDate: booking.startDate,
                hoursUntil: hours,
                source: 'automated-reminder'
              })
            });
            
            if (response.ok) {
              // Mark reminder as sent
              await Booking.updateOne(
                { bookingId: booking.bookingId },
                { $set: { [`reminders.${hours}h`]: true } }
              );
              
              results.sent++;
              
              logSchedulerEvent('reminder_sent', {
                bookingId: booking.bookingId,
                hoursUntil: hours,
                customerEmail: booking.customer.email
              }, 'info');
            } else {
              results.failed++;
            }
          }
          
        } catch (error) {
          results.failed++;
          
          logSchedulerEvent('reminder_send_failed', {
            bookingId: booking.bookingId,
            hoursUntil: hours,
            error: error.message
          }, 'error');
        }
      }
    }
    
    logSchedulerEvent('reminders_completed', {
      sent: results.sent,
      failed: results.failed
    }, 'info');
    
    return results;
    
  } catch (error) {
    logSchedulerEvent('reminders_failed', {
      error: error.message
    }, 'error');
    throw error;
  }
};

// Clean up expired temporary reservations
const cleanupExpiredReservations = async () => {
  try {
    const now = new Date();
    
    const result = await Booking.deleteMany({
      isTemporary: true,
      expiresAt: { $lte: now }
    });
    
    logSchedulerEvent('expired_reservations_cleaned', {
      deletedCount: result.deletedCount
    }, 'info');
    
    return result.deletedCount;
    
  } catch (error) {
    logSchedulerEvent('reservation_cleanup_failed', {
      error: error.message
    }, 'error');
    throw error;
  }
};

// Main scheduler handler
const schedulerHandler = withDatabase(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    logSchedulerEvent('scheduler_run_started', {
      timestamp: new Date().toISOString(),
      source: event.headers['user-agent'] || 'unknown'
    }, 'info');
    
    // Run all scheduled tasks
    const [statusUpdates, reminders, cleanupCount] = await Promise.all([
      processAutomatedUpdates(),
      sendBookingReminders(),
      cleanupExpiredReservations()
    ]);
    
    const summary = {
      statusUpdates: {
        processed: statusUpdates.processed,
        failed: statusUpdates.failed
      },
      reminders: {
        sent: reminders.sent,
        failed: reminders.failed
      },
      cleanup: {
        expiredReservations: cleanupCount
      },
      timestamp: new Date().toISOString()
    };
    
    logSchedulerEvent('scheduler_run_completed', summary, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Scheduled tasks completed successfully',
        summary
      })
    };
    
  } catch (error) {
    logSchedulerEvent('scheduler_run_failed', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Scheduler execution failed',
        message: error.message
      })
    };
  }
});

module.exports = { handler: schedulerHandler };
