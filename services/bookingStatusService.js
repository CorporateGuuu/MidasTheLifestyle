// Booking Status Management Service for Midas The Lifestyle
// Comprehensive booking workflow with automated status transitions and notifications

const mongoose = require('mongoose');
const Booking = require('../database/models/Booking');
const User = require('../database/models/User');
const Inventory = require('../database/models/Inventory');

// Booking status workflow configuration
const STATUS_WORKFLOW = {
  // Valid status transitions
  transitions: {
    'pending-payment': ['payment-processing', 'cancelled'],
    'payment-processing': ['confirmed', 'payment-failed', 'cancelled'],
    'payment-failed': ['pending-payment', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready-for-pickup', 'cancelled'],
    'ready-for-pickup': ['in-progress', 'no-show', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
    'no-show': [], // Terminal state
    'refunded': [] // Terminal state
  },
  
  // Automated status triggers (in hours before start date)
  autoTriggers: {
    'preparing': 48,        // Start preparing 48 hours before
    'ready-for-pickup': 4,  // Ready 4 hours before
    'in-progress': 0,       // In progress at start time
    'completed': -24        // Mark completed 24 hours after end time
  },
  
  // Status-specific actions
  statusActions: {
    'confirmed': ['send_confirmation_email', 'update_inventory', 'assign_concierge'],
    'preparing': ['send_preparation_notification', 'notify_concierge'],
    'ready-for-pickup': ['send_pickup_notification', 'notify_customer'],
    'in-progress': ['send_progress_notification', 'start_tracking'],
    'completed': ['send_completion_email', 'request_review', 'update_metrics'],
    'cancelled': ['process_refund', 'release_inventory', 'send_cancellation_email'],
    'no-show': ['send_noshow_notification', 'apply_noshow_policy']
  }
};

// Log status events
const logStatusEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'booking-status-service',
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

// Validate status transition
const validateStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = STATUS_WORKFLOW.transitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`
    };
  }
  
  return { valid: true };
};

// Update booking status with validation and actions
const updateBookingStatus = async (bookingId, newStatus, updatedBy, reason = null, metadata = {}) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get current booking
      const booking = await Booking.findOne({ bookingId }).session(session);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      const currentStatus = booking.status;
      
      // Validate transition
      const validation = validateStatusTransition(currentStatus, newStatus);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Update booking status
      booking.status = newStatus;
      booking.updatedAt = new Date();
      
      // Add status change to modifications log
      booking.modifications.push({
        modifiedAt: new Date(),
        modifiedBy: updatedBy,
        changes: {
          field: 'status',
          oldValue: currentStatus,
          newValue: newStatus
        },
        reason: reason || `Status updated to ${newStatus}`
      });
      
      // Add metadata if provided
      if (Object.keys(metadata).length > 0) {
        Object.assign(booking, metadata);
      }
      
      await booking.save({ session });
      
      logStatusEvent('status_updated', {
        bookingId,
        oldStatus: currentStatus,
        newStatus,
        updatedBy,
        reason
      }, 'info');
      
      // Execute status-specific actions
      await executeStatusActions(booking, newStatus, session);
      
      return booking;
    });
    
    // Get updated booking with populated fields
    const updatedBooking = await Booking.findOne({ bookingId })
      .populate('customer', 'firstName lastName email phone serviceProfile')
      .populate('serviceDetails.conciergeAssigned', 'firstName lastName email phone');
    
    return updatedBooking;
    
  } catch (error) {
    logStatusEvent('status_update_failed', {
      bookingId,
      newStatus,
      error: error.message
    }, 'error');
    throw error;
  } finally {
    await session.endSession();
  }
};

// Execute status-specific actions
const executeStatusActions = async (booking, status, session) => {
  const actions = STATUS_WORKFLOW.statusActions[status] || [];
  
  for (const action of actions) {
    try {
      await executeAction(booking, action, session);
    } catch (error) {
      logStatusEvent('status_action_failed', {
        bookingId: booking.bookingId,
        status,
        action,
        error: error.message
      }, 'error');
      // Continue with other actions even if one fails
    }
  }
};

// Execute individual status action
const executeAction = async (booking, action, session) => {
  switch (action) {
    case 'send_confirmation_email':
      await sendStatusNotification(booking, 'booking_confirmed');
      break;
      
    case 'update_inventory':
      await updateInventoryMetrics(booking, session);
      break;
      
    case 'assign_concierge':
      await assignConcierge(booking, session);
      break;
      
    case 'send_preparation_notification':
      await sendStatusNotification(booking, 'preparation_started');
      break;
      
    case 'notify_concierge':
      await notifyConcierge(booking, 'preparation_required');
      break;
      
    case 'send_pickup_notification':
      await sendStatusNotification(booking, 'ready_for_pickup');
      break;
      
    case 'notify_customer':
      await sendStatusNotification(booking, 'pickup_reminder');
      break;
      
    case 'send_progress_notification':
      await sendStatusNotification(booking, 'booking_started');
      break;
      
    case 'start_tracking':
      await startBookingTracking(booking);
      break;
      
    case 'send_completion_email':
      await sendStatusNotification(booking, 'booking_completed');
      break;
      
    case 'request_review':
      await requestCustomerReview(booking);
      break;
      
    case 'update_metrics':
      await updateCustomerMetrics(booking, session);
      break;
      
    case 'process_refund':
      await processBookingRefund(booking);
      break;
      
    case 'release_inventory':
      await releaseInventory(booking);
      break;
      
    case 'send_cancellation_email':
      await sendStatusNotification(booking, 'booking_cancelled');
      break;
      
    case 'send_noshow_notification':
      await sendStatusNotification(booking, 'no_show_recorded');
      break;
      
    case 'apply_noshow_policy':
      await applyNoShowPolicy(booking, session);
      break;
      
    default:
      logStatusEvent('unknown_action', {
        bookingId: booking.bookingId,
        action
      }, 'warning');
  }
};

// Send status notification email
const sendStatusNotification = async (booking, notificationType) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: notificationType,
        bookingId: booking.bookingId,
        customerEmail: booking.customer?.email || booking.guestDetails?.email,
        firstName: booking.customer?.firstName || booking.guestDetails?.firstName,
        lastName: booking.customer?.lastName || booking.guestDetails?.lastName,
        itemName: booking.item.itemName,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        source: 'booking-status-service'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Email notification failed: ${response.status}`);
    }
    
    logStatusEvent('notification_sent', {
      bookingId: booking.bookingId,
      notificationType,
      recipient: booking.customer?.email || booking.guestDetails?.email
    }, 'info');
    
  } catch (error) {
    logStatusEvent('notification_failed', {
      bookingId: booking.bookingId,
      notificationType,
      error: error.message
    }, 'error');
  }
};

// Update inventory metrics
const updateInventoryMetrics = async (booking, session) => {
  try {
    const inventory = await Inventory.findOne({ itemId: booking.item.itemId }).session(session);
    
    if (inventory) {
      inventory.updateMetrics(booking.pricing.total);
      await inventory.save({ session });
      
      logStatusEvent('inventory_metrics_updated', {
        itemId: booking.item.itemId,
        bookingAmount: booking.pricing.total
      }, 'info');
    }
    
  } catch (error) {
    logStatusEvent('inventory_metrics_update_failed', {
      itemId: booking.item.itemId,
      error: error.message
    }, 'error');
  }
};

// Assign concierge to booking
const assignConcierge = async (booking, session) => {
  try {
    // Find available concierge based on location and workload
    const concierges = await User.find({
      role: 'concierge',
      status: 'active',
      'serviceProfile.preferredLocations': booking.location.pickup.city || booking.location.pickup.state
    }).session(session);
    
    if (concierges.length > 0) {
      // Simple assignment - could be enhanced with workload balancing
      const assignedConcierge = concierges[0];
      
      booking.serviceDetails.conciergeAssigned = assignedConcierge._id;
      await booking.save({ session });
      
      // Notify concierge
      await notifyConcierge(booking, 'new_assignment');
      
      logStatusEvent('concierge_assigned', {
        bookingId: booking.bookingId,
        conciergeId: assignedConcierge._id,
        conciergeName: `${assignedConcierge.firstName} ${assignedConcierge.lastName}`
      }, 'info');
    }
    
  } catch (error) {
    logStatusEvent('concierge_assignment_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
  }
};

// Notify concierge
const notifyConcierge = async (booking, notificationType) => {
  if (!booking.serviceDetails.conciergeAssigned) return;
  
  try {
    const concierge = await User.findById(booking.serviceDetails.conciergeAssigned);
    
    if (concierge) {
      const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
      
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: `concierge_${notificationType}`,
          bookingId: booking.bookingId,
          customerEmail: concierge.email,
          firstName: concierge.firstName,
          lastName: concierge.lastName,
          itemName: booking.item.itemName,
          customerName: booking.customer?.firstName ? 
            `${booking.customer.firstName} ${booking.customer.lastName}` : 
            `${booking.guestDetails?.firstName} ${booking.guestDetails?.lastName}`,
          startDate: booking.startDate,
          endDate: booking.endDate,
          source: 'concierge-notification'
        })
      });
      
      logStatusEvent('concierge_notified', {
        bookingId: booking.bookingId,
        conciergeId: concierge._id,
        notificationType
      }, 'info');
    }
    
  } catch (error) {
    logStatusEvent('concierge_notification_failed', {
      bookingId: booking.bookingId,
      notificationType,
      error: error.message
    }, 'error');
  }
};

// Start booking tracking
const startBookingTracking = async (booking) => {
  // This would integrate with GPS tracking, IoT devices, etc.
  // For now, just log the start
  logStatusEvent('booking_tracking_started', {
    bookingId: booking.bookingId,
    itemId: booking.item.itemId,
    startTime: new Date()
  }, 'info');
};

// Request customer review
const requestCustomerReview = async (booking) => {
  try {
    // Send review request email
    await sendStatusNotification(booking, 'review_request');
    
    logStatusEvent('review_requested', {
      bookingId: booking.bookingId,
      customerEmail: booking.customer?.email || booking.guestDetails?.email
    }, 'info');
    
  } catch (error) {
    logStatusEvent('review_request_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
  }
};

// Update customer metrics
const updateCustomerMetrics = async (booking, session) => {
  if (!booking.customer) return;
  
  try {
    const customer = await User.findById(booking.customer).session(session);
    
    if (customer) {
      customer.totalBookings += 1;
      customer.totalSpent += booking.pricing.total;
      customer.averageBookingValue = customer.totalSpent / customer.totalBookings;
      customer.lifetimeValue = customer.totalSpent;
      
      // Add loyalty points
      const pointsEarned = customer.addLoyaltyPoints(booking.pricing.total);
      
      // Update service tier if needed
      customer.updateServiceTier();
      
      await customer.save({ session });
      
      logStatusEvent('customer_metrics_updated', {
        customerId: customer._id,
        totalBookings: customer.totalBookings,
        totalSpent: customer.totalSpent,
        pointsEarned,
        newTier: customer.serviceProfile.tier
      }, 'info');
    }
    
  } catch (error) {
    logStatusEvent('customer_metrics_update_failed', {
      customerId: booking.customer,
      error: error.message
    }, 'error');
  }
};

// Process booking refund
const processBookingRefund = async (booking) => {
  if (booking.payment.status === 'completed' && booking.payment.paidAmount > 0) {
    try {
      const refundEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/process-refund`;
      
      const response = await fetch(refundEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: booking.payment.paymentIntentId,
          bookingId: booking.bookingId,
          cancellationReason: 'booking_cancelled',
          customerEmail: booking.customer?.email || booking.guestDetails?.email
        })
      });
      
      if (response.ok) {
        logStatusEvent('refund_processed', {
          bookingId: booking.bookingId,
          amount: booking.payment.paidAmount
        }, 'info');
      }
      
    } catch (error) {
      logStatusEvent('refund_processing_failed', {
        bookingId: booking.bookingId,
        error: error.message
      }, 'error');
    }
  }
};

// Release inventory
const releaseInventory = async (booking) => {
  logStatusEvent('inventory_released', {
    bookingId: booking.bookingId,
    itemId: booking.item.itemId,
    releasedAt: new Date()
  }, 'info');
};

// Apply no-show policy
const applyNoShowPolicy = async (booking, session) => {
  try {
    // Apply no-show charges (typically forfeit deposit)
    const noShowCharge = booking.pricing.securityDeposit * 0.5; // 50% of deposit
    
    booking.payment.noShowCharge = noShowCharge;
    await booking.save({ session });
    
    logStatusEvent('noshow_policy_applied', {
      bookingId: booking.bookingId,
      noShowCharge
    }, 'info');
    
  } catch (error) {
    logStatusEvent('noshow_policy_failed', {
      bookingId: booking.bookingId,
      error: error.message
    }, 'error');
  }
};

// Get booking status history
const getBookingStatusHistory = async (bookingId) => {
  try {
    const booking = await Booking.findOne({ bookingId })
      .select('bookingId status modifications createdAt updatedAt')
      .populate('modifications.modifiedBy', 'firstName lastName email role');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    const history = [
      {
        status: 'pending-payment',
        timestamp: booking.createdAt,
        modifiedBy: 'System',
        reason: 'Booking created'
      },
      ...booking.modifications.map(mod => ({
        status: mod.changes.newValue,
        timestamp: mod.modifiedAt,
        modifiedBy: mod.modifiedBy ? 
          `${mod.modifiedBy.firstName} ${mod.modifiedBy.lastName}` : 'System',
        reason: mod.reason
      }))
    ];
    
    return {
      bookingId,
      currentStatus: booking.status,
      history: history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };
    
  } catch (error) {
    logStatusEvent('status_history_retrieval_failed', {
      bookingId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export booking status service functions
module.exports = {
  updateBookingStatus,
  getBookingStatusHistory,
  validateStatusTransition,
  STATUS_WORKFLOW
};
