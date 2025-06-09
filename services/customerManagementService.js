// Customer Management Service for Midas The Lifestyle
// Comprehensive customer operations with analytics and communication tools

const mongoose = require('mongoose');
const User = require('../database/models/User');
const Booking = require('../database/models/Booking');

// Customer management configuration
const CUSTOMER_CONFIG = {
  // Segmentation thresholds
  segmentation: {
    vip: {
      minSpending: 25000,
      minBookings: 5
    },
    premium: {
      minSpending: 10000,
      minBookings: 3
    },
    loyal: {
      minSpending: 5000,
      minBookings: 2
    }
  },
  
  // Communication limits
  communication: {
    bulkMessageLimit: 1000,
    dailyEmailLimit: 5000,
    personalizedOfferLimit: 100
  },
  
  // Analytics periods
  analytics: {
    defaultPeriod: 90,
    maxPeriod: 365,
    cohortPeriods: [30, 60, 90, 180, 365]
  },
  
  // Support ticket priorities
  supportPriorities: {
    'vvip': 1,
    'premium': 2,
    'standard': 3
  }
};

// Log customer events
const logCustomerEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'customer-management',
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

// Get customer profile with analytics
const getCustomerProfile = async (customerId) => {
  try {
    const customer = await User.findById(customerId)
      .select('-password')
      .lean();
    
    if (!customer || customer.role !== 'customer') {
      throw new Error('Customer not found');
    }
    
    // Get booking history
    const bookings = await Booking.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('bookingId item.itemName item.itemType status pricing.total startDate endDate createdAt');
    
    // Calculate customer metrics
    const totalBookings = await Booking.countDocuments({ customer: customerId });
    const completedBookings = await Booking.countDocuments({ 
      customer: customerId, 
      status: 'completed' 
    });
    
    const revenueData = await Booking.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), 'payment.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          avgBookingValue: { $avg: '$pricing.total' },
          lastBookingDate: { $max: '$createdAt' }
        }
      }
    ]);
    
    // Get preferred item types
    const preferences = await Booking.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
      {
        $group: {
          _id: '$item.itemType',
          count: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const profile = {
      ...customer,
      metrics: {
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        avgBookingValue: revenueData[0]?.avgBookingValue || 0,
        lastBookingDate: revenueData[0]?.lastBookingDate
      },
      preferences: preferences.map(pref => ({
        itemType: pref._id,
        bookings: pref.count,
        totalSpent: pref.totalSpent
      })),
      recentBookings: bookings
    };
    
    logCustomerEvent('customer_profile_retrieved', {
      customerId,
      totalBookings: profile.metrics.totalBookings,
      totalRevenue: profile.metrics.totalRevenue
    }, 'info');
    
    return profile;
    
  } catch (error) {
    logCustomerEvent('customer_profile_retrieval_failed', {
      customerId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Update customer service tier
const updateCustomerServiceTier = async (customerId, newTier, updatedBy, reason) => {
  try {
    const customer = await User.findById(customerId);
    
    if (!customer || customer.role !== 'customer') {
      throw new Error('Customer not found');
    }
    
    const oldTier = customer.serviceProfile.tier;
    
    // Validate tier
    const validTiers = ['standard', 'premium', 'vvip'];
    if (!validTiers.includes(newTier)) {
      throw new Error(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
    }
    
    // Update tier
    customer.serviceProfile.tier = newTier;
    customer.serviceProfile.tierUpgradeDate = new Date();
    customer.serviceProfile.tierUpgradeReason = reason;
    
    await customer.save();
    
    // Send tier upgrade notification
    if (newTier !== oldTier) {
      await sendTierUpgradeNotification(customer, oldTier, newTier);
    }
    
    logCustomerEvent('customer_tier_updated', {
      customerId,
      oldTier,
      newTier,
      updatedBy,
      reason
    }, 'info');
    
    return customer;
    
  } catch (error) {
    logCustomerEvent('customer_tier_update_failed', {
      customerId,
      newTier,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Send tier upgrade notification
const sendTierUpgradeNotification = async (customer, oldTier, newTier) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
    
    await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tier_upgrade_notification',
        customerEmail: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        oldTier,
        newTier,
        upgradeDate: new Date().toISOString(),
        source: 'customer-management'
      })
    });
    
    logCustomerEvent('tier_upgrade_notification_sent', {
      customerId: customer._id,
      oldTier,
      newTier
    }, 'info');
    
  } catch (error) {
    logCustomerEvent('tier_upgrade_notification_failed', {
      customerId: customer._id,
      error: error.message
    }, 'error');
  }
};

// Get customer segmentation analysis
const getCustomerSegmentation = async (dateRange = 90) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    // Segment customers by spending and booking behavior
    const segmentation = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSpent', CUSTOMER_CONFIG.segmentation.vip.minSpending] },
                      { $gte: ['$totalBookings', CUSTOMER_CONFIG.segmentation.vip.minBookings] }
                    ]
                  },
                  then: 'VIP'
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSpent', CUSTOMER_CONFIG.segmentation.premium.minSpending] },
                      { $gte: ['$totalBookings', CUSTOMER_CONFIG.segmentation.premium.minBookings] }
                    ]
                  },
                  then: 'Premium'
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSpent', CUSTOMER_CONFIG.segmentation.loyal.minSpending] },
                      { $gte: ['$totalBookings', CUSTOMER_CONFIG.segmentation.loyal.minBookings] }
                    ]
                  },
                  then: 'Loyal'
                }
              ],
              default: 'Standard'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          avgRevenue: { $avg: '$totalSpent' },
          avgBookings: { $avg: '$totalBookings' },
          avgLoyaltyPoints: { $avg: '$loyaltyPoints' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    // Get recent activity by segment
    const recentActivity = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      { $unwind: '$customerData' },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ['$customerData.totalSpent', CUSTOMER_CONFIG.segmentation.vip.minSpending] },
                      { $gte: ['$customerData.totalBookings', CUSTOMER_CONFIG.segmentation.vip.minBookings] }
                    ]
                  },
                  then: 'VIP'
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$customerData.totalSpent', CUSTOMER_CONFIG.segmentation.premium.minSpending] },
                      { $gte: ['$customerData.totalBookings', CUSTOMER_CONFIG.segmentation.premium.minBookings] }
                    ]
                  },
                  then: 'Premium'
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$customerData.totalSpent', CUSTOMER_CONFIG.segmentation.loyal.minSpending] },
                      { $gte: ['$customerData.totalBookings', CUSTOMER_CONFIG.segmentation.loyal.minBookings] }
                    ]
                  },
                  then: 'Loyal'
                }
              ],
              default: 'Standard'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          recentBookings: { $sum: 1 },
          recentRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);
    
    // Combine segmentation with recent activity
    const combinedSegmentation = segmentation.map(segment => {
      const activity = recentActivity.find(act => act._id === segment._id) || {
        recentBookings: 0,
        recentRevenue: 0
      };
      
      return {
        ...segment,
        ...activity
      };
    });
    
    logCustomerEvent('customer_segmentation_generated', {
      dateRange,
      segments: combinedSegmentation.length,
      totalCustomers: combinedSegmentation.reduce((sum, seg) => sum + seg.count, 0)
    }, 'info');
    
    return {
      segments: combinedSegmentation,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      },
      thresholds: CUSTOMER_CONFIG.segmentation
    };
    
  } catch (error) {
    logCustomerEvent('customer_segmentation_failed', {
      dateRange,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get customer booking behavior analysis
const getCustomerBookingBehavior = async (customerId, dateRange = 365) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const bookingBehavior = await Booking.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          avgBookingValue: { $avg: '$pricing.total' },
          itemTypes: { $addToSet: '$item.itemType' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get booking patterns
    const patterns = await Booking.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$startDate' },
            hour: { $hour: '$startDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate booking frequency
    const totalBookings = await Booking.countDocuments({
      customer: customerId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const avgDaysBetweenBookings = totalBookings > 1 ? dateRange / totalBookings : null;
    
    const analysis = {
      monthlyTrends: bookingBehavior,
      bookingPatterns: patterns,
      frequency: {
        totalBookings,
        avgDaysBetweenBookings,
        bookingFrequency: avgDaysBetweenBookings ? 
          (avgDaysBetweenBookings <= 30 ? 'High' : 
           avgDaysBetweenBookings <= 90 ? 'Medium' : 'Low') : 'Unknown'
      },
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      }
    };
    
    logCustomerEvent('customer_behavior_analyzed', {
      customerId,
      dateRange,
      totalBookings,
      avgDaysBetweenBookings
    }, 'info');
    
    return analysis;
    
  } catch (error) {
    logCustomerEvent('customer_behavior_analysis_failed', {
      customerId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Send bulk customer communication
const sendBulkCustomerCommunication = async (criteria, messageData, senderId) => {
  try {
    // Validate bulk limit
    const estimatedRecipients = await User.countDocuments({
      role: 'customer',
      ...criteria
    });
    
    if (estimatedRecipients > CUSTOMER_CONFIG.communication.bulkMessageLimit) {
      throw new Error(`Bulk message limit exceeded. Maximum ${CUSTOMER_CONFIG.communication.bulkMessageLimit} recipients allowed`);
    }
    
    // Get target customers
    const customers = await User.find({
      role: 'customer',
      ...criteria
    }).select('_id firstName lastName email serviceProfile.tier notifications');
    
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    // Send messages
    for (const customer of customers) {
      try {
        // Check if customer accepts promotional emails
        if (!customer.notifications?.email?.promotionalOffers) {
          continue;
        }
        
        const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
        
        const response = await fetch(emailEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bulk_customer_communication',
            customerEmail: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            serviceTier: customer.serviceProfile.tier,
            messageData,
            senderId,
            source: 'customer-management'
          })
        });
        
        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            customerId: customer._id,
            error: `Email service error: ${response.status}`
          });
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId: customer._id,
          error: error.message
        });
      }
    }
    
    logCustomerEvent('bulk_communication_completed', {
      criteria,
      totalCustomers: customers.length,
      sent: results.sent,
      failed: results.failed,
      senderId
    }, results.failed > 0 ? 'warning' : 'info');
    
    return results;
    
  } catch (error) {
    logCustomerEvent('bulk_communication_failed', {
      criteria,
      error: error.message,
      senderId
    }, 'error');
    throw error;
  }
};

// Export customer management functions
module.exports = {
  getCustomerProfile,
  updateCustomerServiceTier,
  getCustomerSegmentation,
  getCustomerBookingBehavior,
  sendBulkCustomerCommunication,
  CUSTOMER_CONFIG
};
