// Admin Service Core for Midas The Lifestyle
// Comprehensive admin operations with luxury service management

const mongoose = require('mongoose');
const Inventory = require('../database/models/Inventory');
const Booking = require('../database/models/Booking');
const User = require('../database/models/User');

// Admin service configuration
const ADMIN_CONFIG = {
  // Pagination defaults
  pagination: {
    defaultLimit: 50,
    maxLimit: 500
  },
  
  // Bulk operation limits
  bulkLimits: {
    inventory: 100,
    customers: 200,
    bookings: 150
  },
  
  // Report generation limits
  reportLimits: {
    maxDateRange: 365, // days
    maxRecords: 10000
  },
  
  // Cache settings
  cache: {
    dashboardTTL: 300, // 5 minutes
    reportTTL: 1800,   // 30 minutes
    analyticsTTL: 900  // 15 minutes
  }
};

// Log admin events
const logAdminEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'admin-service',
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

// Validate admin permissions
const validateAdminPermissions = (user, requiredLevel = 'admin') => {
  const permissionLevels = {
    'concierge': 1,
    'admin': 2,
    'super-admin': 3
  };
  
  const userLevel = permissionLevels[user.role] || 0;
  const requiredLevelValue = permissionLevels[requiredLevel] || 0;
  
  if (userLevel < requiredLevelValue) {
    throw new Error(`Insufficient permissions. Required: ${requiredLevel}, Current: ${user.role}`);
  }
  
  return true;
};

// Get dashboard overview data
const getDashboardOverview = async (userId, dateRange = 30) => {
  try {
    logAdminEvent('dashboard_overview_requested', {
      userId,
      dateRange
    }, 'info');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    // Parallel data fetching for performance
    const [
      totalBookings,
      totalRevenue,
      activeBookings,
      totalCustomers,
      totalInventory,
      recentBookings,
      topItems,
      customerMetrics
    ] = await Promise.all([
      // Total bookings in period
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Total revenue in period
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.total' }
          }
        }
      ]),
      
      // Active bookings
      Booking.countDocuments({
        status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] }
      }),
      
      // Total customers
      User.countDocuments({ role: 'customer' }),
      
      // Total inventory
      Inventory.countDocuments({ status: 'available' }),
      
      // Recent bookings
      Booking.find({
        createdAt: { $gte: startDate }
      })
      .populate('customer', 'firstName lastName email serviceProfile')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookingId item.itemName status pricing.total createdAt'),
      
      // Top performing items
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: '$item.itemId',
            itemName: { $first: '$item.itemName' },
            itemType: { $first: '$item.itemType' },
            bookings: { $sum: 1 },
            revenue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      
      // Customer metrics
      User.aggregate([
        {
          $match: { role: 'customer' }
        },
        {
          $group: {
            _id: '$serviceProfile.tier',
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' },
            avgBookings: { $avg: '$totalBookings' }
          }
        }
      ])
    ]);
    
    // Calculate growth rates
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - dateRange);
    
    const [previousBookings, previousRevenue] = await Promise.all([
      Booking.countDocuments({
        createdAt: { $gte: previousPeriodStart, $lt: startDate }
      }),
      
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: previousPeriodStart, $lt: startDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.total' }
          }
        }
      ])
    ]);
    
    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;
    
    const bookingGrowth = previousBookings > 0 ? 
      ((totalBookings - previousBookings) / previousBookings * 100) : 0;
    const revenueGrowth = prevRevenue > 0 ? 
      ((currentRevenue - prevRevenue) / prevRevenue * 100) : 0;
    
    const overview = {
      summary: {
        totalBookings,
        totalRevenue: currentRevenue,
        activeBookings,
        totalCustomers,
        totalInventory,
        averageBookingValue: totalBookings > 0 ? currentRevenue / totalBookings : 0
      },
      growth: {
        bookings: bookingGrowth,
        revenue: revenueGrowth
      },
      recentActivity: {
        recentBookings,
        topPerformingItems: topItems
      },
      customerBreakdown: customerMetrics,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      }
    };
    
    logAdminEvent('dashboard_overview_generated', {
      userId,
      summary: overview.summary,
      growth: overview.growth
    }, 'info');
    
    return overview;
    
  } catch (error) {
    logAdminEvent('dashboard_overview_failed', {
      userId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get real-time metrics
const getRealTimeMetrics = async (userId) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    
    const [
      todayBookings,
      weekBookings,
      monthBookings,
      activeUsers,
      systemHealth,
      pendingActions
    ] = await Promise.all([
      // Today's bookings
      Booking.countDocuments({
        createdAt: { $gte: today }
      }),
      
      // This week's bookings
      Booking.countDocuments({
        createdAt: { $gte: thisWeek }
      }),
      
      // This month's bookings
      Booking.countDocuments({
        createdAt: { $gte: thisMonth }
      }),
      
      // Active users (logged in within 24 hours)
      User.countDocuments({
        lastLogin: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      
      // System health metrics
      Promise.resolve({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: now
      }),
      
      // Pending actions
      Booking.countDocuments({
        status: { $in: ['pending-payment', 'payment-processing'] }
      })
    ]);
    
    const metrics = {
      bookings: {
        today: todayBookings,
        week: weekBookings,
        month: monthBookings
      },
      users: {
        active: activeUsers
      },
      system: systemHealth,
      pendingActions,
      timestamp: now
    };
    
    logAdminEvent('realtime_metrics_generated', {
      userId,
      metrics: {
        todayBookings,
        weekBookings,
        activeUsers,
        pendingActions
      }
    }, 'info');
    
    return metrics;
    
  } catch (error) {
    logAdminEvent('realtime_metrics_failed', {
      userId,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (userId, itemType = null, dateRange = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const matchQuery = itemType ? { itemType } : {};
    
    const [
      inventoryStats,
      utilizationData,
      revenueByItem,
      maintenanceSchedule
    ] = await Promise.all([
      // Inventory statistics
      Inventory.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$itemType',
            total: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
            },
            maintenance: {
              $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
            },
            avgPrice: { $avg: '$pricing.basePrice' },
            totalValue: { $sum: '$pricing.basePrice' }
          }
        }
      ]),
      
      // Utilization rates
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            ...(itemType && { 'item.itemType': itemType })
          }
        },
        {
          $group: {
            _id: '$item.itemId',
            itemName: { $first: '$item.itemName' },
            itemType: { $first: '$item.itemType' },
            bookings: { $sum: 1 },
            totalDays: { $sum: '$duration.days' },
            revenue: { $sum: '$pricing.total' }
          }
        },
        {
          $addFields: {
            utilizationRate: {
              $multiply: [
                { $divide: ['$totalDays', dateRange] },
                100
              ]
            }
          }
        },
        { $sort: { utilizationRate: -1 } }
      ]),
      
      // Revenue by item
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed',
            ...(itemType && { 'item.itemType': itemType })
          }
        },
        {
          $group: {
            _id: '$item.itemId',
            itemName: { $first: '$item.itemName' },
            itemType: { $first: '$item.itemType' },
            totalRevenue: { $sum: '$pricing.total' },
            bookingCount: { $sum: 1 },
            avgBookingValue: { $avg: '$pricing.total' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 }
      ]),
      
      // Upcoming maintenance
      Inventory.find({
        ...(itemType && { itemType }),
        'condition.nextInspection': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      })
      .select('itemId itemName itemType condition.nextInspection condition.overall')
      .sort({ 'condition.nextInspection': 1 })
      .limit(10)
    ]);
    
    const analytics = {
      summary: inventoryStats,
      utilization: utilizationData,
      revenue: revenueByItem,
      maintenance: maintenanceSchedule,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      },
      itemType
    };
    
    logAdminEvent('inventory_analytics_generated', {
      userId,
      itemType,
      dateRange,
      inventoryCount: inventoryStats.length,
      utilizationCount: utilizationData.length
    }, 'info');
    
    return analytics;
    
  } catch (error) {
    logAdminEvent('inventory_analytics_failed', {
      userId,
      itemType,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get customer analytics
const getCustomerAnalytics = async (userId, segmentBy = 'tier', dateRange = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const [
      customerSegmentation,
      bookingBehavior,
      revenueAnalysis,
      loyaltyMetrics
    ] = await Promise.all([
      // Customer segmentation
      User.aggregate([
        { $match: { role: 'customer' } },
        {
          $group: {
            _id: `$serviceProfile.${segmentBy}`,
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' },
            avgBookings: { $avg: '$totalBookings' },
            avgLifetimeValue: { $avg: '$lifetimeValue' },
            totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]),
      
      // Booking behavior analysis
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            customer: { $exists: true }
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
          $group: {
            _id: '$customerData.serviceProfile.tier',
            bookings: { $sum: 1 },
            avgBookingValue: { $avg: '$pricing.total' },
            totalRevenue: { $sum: '$pricing.total' },
            preferredItems: { $push: '$item.itemType' }
          }
        }
      ]),
      
      // Revenue analysis by customer tier
      User.aggregate([
        {
          $match: {
            role: 'customer',
            totalSpent: { $gt: 0 }
          }
        },
        {
          $bucket: {
            groupBy: '$totalSpent',
            boundaries: [0, 5000, 25000, 100000, 500000, Infinity],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              avgSpent: { $avg: '$totalSpent' },
              totalRevenue: { $sum: '$totalSpent' }
            }
          }
        }
      ]),
      
      // Loyalty program metrics
      User.aggregate([
        {
          $match: {
            role: 'customer',
            loyaltyPoints: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$serviceProfile.tier',
            totalPoints: { $sum: '$loyaltyPoints' },
            avgPoints: { $avg: '$loyaltyPoints' },
            customerCount: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const analytics = {
      segmentation: customerSegmentation,
      behavior: bookingBehavior,
      revenue: revenueAnalysis,
      loyalty: loyaltyMetrics,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      },
      segmentBy
    };
    
    logAdminEvent('customer_analytics_generated', {
      userId,
      segmentBy,
      dateRange,
      segmentCount: customerSegmentation.length
    }, 'info');
    
    return analytics;
    
  } catch (error) {
    logAdminEvent('customer_analytics_failed', {
      userId,
      segmentBy,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export admin service functions
module.exports = {
  getDashboardOverview,
  getRealTimeMetrics,
  getInventoryAnalytics,
  getCustomerAnalytics,
  validateAdminPermissions,
  ADMIN_CONFIG
};
