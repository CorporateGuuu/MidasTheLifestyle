// Business Intelligence Service for Midas The Lifestyle
// Comprehensive reporting and analytics with automated insights

const mongoose = require('mongoose');
const Booking = require('../database/models/Booking');
const User = require('../database/models/User');
const Inventory = require('../database/models/Inventory');

// Business intelligence configuration
const BI_CONFIG = {
  // Report types and their data retention
  reportTypes: {
    financial: { retention: 2555, frequency: 'daily' }, // 7 years
    operational: { retention: 1095, frequency: 'hourly' }, // 3 years
    customer: { retention: 1825, frequency: 'daily' }, // 5 years
    inventory: { retention: 1095, frequency: 'daily' } // 3 years
  },
  
  // KPI thresholds for alerts
  kpiThresholds: {
    revenueGrowth: { warning: -5, critical: -15 }, // percentage
    bookingConversion: { warning: 15, critical: 10 }, // percentage
    customerSatisfaction: { warning: 4.0, critical: 3.5 }, // rating
    inventoryUtilization: { warning: 60, critical: 40 } // percentage
  },
  
  // Export formats
  exportFormats: ['json', 'csv', 'xlsx', 'pdf'],
  
  // Automated report schedules
  schedules: {
    daily: ['financial-summary', 'operational-metrics'],
    weekly: ['customer-analytics', 'inventory-performance'],
    monthly: ['comprehensive-report', 'executive-summary']
  }
};

// Log BI events
const logBIEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'business-intelligence',
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

// Generate financial report
const generateFinancialReport = async (startDate, endDate, granularity = 'daily') => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Revenue analysis
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: granularity === 'daily' ? '%Y-%m-%d' : 
                     granularity === 'weekly' ? '%Y-%U' : '%Y-%m',
              date: '$createdAt'
            }
          },
          totalRevenue: { $sum: '$pricing.total' },
          bookingCount: { $sum: 1 },
          avgBookingValue: { $avg: '$pricing.total' },
          itemTypes: { $push: '$item.itemType' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Revenue by item type
    const revenueByType = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: '$item.itemType',
          revenue: { $sum: '$pricing.total' },
          bookings: { $sum: 1 },
          avgValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    // Revenue by customer tier
    const revenueByTier = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'completed',
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
          revenue: { $sum: '$pricing.total' },
          bookings: { $sum: 1 },
          customers: { $addToSet: '$customer' }
        }
      },
      {
        $addFields: {
          uniqueCustomers: { $size: '$customers' },
          revenuePerCustomer: { $divide: ['$revenue', { $size: '$customers' }] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    // Calculate totals and growth
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalBookings = revenueData.reduce((sum, item) => sum + item.bookingCount, 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // Previous period comparison
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(start);
    
    const previousPeriodRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: prevStart, $lt: prevEnd },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$pricing.total' },
          bookings: { $sum: 1 }
        }
      }
    ]);
    
    const prevRevenue = previousPeriodRevenue[0]?.revenue || 0;
    const prevBookings = previousPeriodRevenue[0]?.bookings || 0;
    
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const bookingGrowth = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : 0;
    
    const report = {
      summary: {
        totalRevenue,
        totalBookings,
        avgBookingValue,
        revenueGrowth,
        bookingGrowth
      },
      trends: revenueData,
      breakdown: {
        byItemType: revenueByType,
        byCustomerTier: revenueByTier
      },
      period: {
        start,
        end,
        granularity,
        days: periodDays
      }
    };
    
    logBIEvent('financial_report_generated', {
      startDate,
      endDate,
      granularity,
      totalRevenue,
      totalBookings,
      revenueGrowth
    }, 'info');
    
    return report;
    
  } catch (error) {
    logBIEvent('financial_report_failed', {
      startDate,
      endDate,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Generate operational metrics report
const generateOperationalReport = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Booking status distribution
    const statusDistribution = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Conversion funnel
    const conversionFunnel = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalCreated: { $sum: 1 },
          paymentCompleted: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const funnel = conversionFunnel[0] || {};
    const conversionRates = {
      paymentConversion: funnel.totalCreated > 0 ? (funnel.paymentCompleted / funnel.totalCreated) * 100 : 0,
      confirmationRate: funnel.paymentCompleted > 0 ? (funnel.confirmed / funnel.paymentCompleted) * 100 : 0,
      completionRate: funnel.confirmed > 0 ? (funnel.completed / funnel.confirmed) * 100 : 0,
      cancellationRate: funnel.totalCreated > 0 ? (funnel.cancelled / funnel.totalCreated) * 100 : 0
    };
    
    // Inventory utilization
    const inventoryUtilization = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$item.itemId',
          itemName: { $first: '$item.itemName' },
          itemType: { $first: '$item.itemType' },
          bookings: { $sum: 1 },
          totalDays: { $sum: '$duration.days' }
        }
      },
      {
        $addFields: {
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalDays', Math.ceil((end - start) / (1000 * 60 * 60 * 24))] },
              100
            ]
          }
        }
      },
      { $sort: { utilizationRate: -1 } }
    ]);
    
    // Customer service metrics
    const customerMetrics = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'review.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$review.rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: '$review.rating' }
        }
      }
    ]);
    
    const report = {
      bookingMetrics: {
        statusDistribution,
        conversionRates,
        funnel
      },
      inventoryMetrics: {
        utilization: inventoryUtilization,
        avgUtilization: inventoryUtilization.length > 0 ? 
          inventoryUtilization.reduce((sum, item) => sum + item.utilizationRate, 0) / inventoryUtilization.length : 0
      },
      customerService: customerMetrics[0] || {
        avgRating: 0,
        totalReviews: 0,
        ratingDistribution: []
      },
      period: {
        start,
        end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      }
    };
    
    logBIEvent('operational_report_generated', {
      startDate,
      endDate,
      totalBookings: funnel.totalCreated,
      avgRating: report.customerService.avgRating,
      avgUtilization: report.inventoryMetrics.avgUtilization
    }, 'info');
    
    return report;
    
  } catch (error) {
    logBIEvent('operational_report_failed', {
      startDate,
      endDate,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Generate customer analytics report
const generateCustomerAnalyticsReport = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Customer acquisition
    const customerAcquisition = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          newCustomers: { $sum: 1 },
          tiers: { $push: '$serviceProfile.tier' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Customer lifetime value analysis
    const clvAnalysis = await User.aggregate([
      {
        $match: {
          role: 'customer',
          totalSpent: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$serviceProfile.tier',
          customers: { $sum: 1 },
          avgLifetimeValue: { $avg: '$lifetimeValue' },
          avgTotalSpent: { $avg: '$totalSpent' },
          avgBookings: { $avg: '$totalBookings' },
          totalRevenue: { $sum: '$totalSpent' }
        }
      },
      { $sort: { avgLifetimeValue: -1 } }
    ]);
    
    // Customer retention analysis
    const retentionAnalysis = await Booking.aggregate([
      {
        $match: {
          customer: { $exists: true },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$customer',
          firstBooking: { $min: '$createdAt' },
          lastBooking: { $max: '$createdAt' },
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' }
        }
      },
      {
        $addFields: {
          daysBetweenFirstLast: {
            $divide: [
              { $subtract: ['$lastBooking', '$firstBooking'] },
              1000 * 60 * 60 * 24
            ]
          },
          isRepeatCustomer: { $gt: ['$totalBookings', 1] }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: ['$isRepeatCustomer', 1, 0] }
          },
          avgDaysBetweenBookings: { $avg: '$daysBetweenFirstLast' }
        }
      }
    ]);
    
    const retention = retentionAnalysis[0] || {};
    const retentionRate = retention.totalCustomers > 0 ? 
      (retention.repeatCustomers / retention.totalCustomers) * 100 : 0;
    
    const report = {
      acquisition: customerAcquisition,
      lifetimeValue: clvAnalysis,
      retention: {
        ...retention,
        retentionRate,
        avgDaysBetweenBookings: retention.avgDaysBetweenBookings || 0
      },
      period: {
        start,
        end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      }
    };
    
    logBIEvent('customer_analytics_report_generated', {
      startDate,
      endDate,
      newCustomers: customerAcquisition.length,
      retentionRate,
      avgClv: clvAnalysis.reduce((sum, tier) => sum + tier.avgLifetimeValue, 0) / (clvAnalysis.length || 1)
    }, 'info');
    
    return report;
    
  } catch (error) {
    logBIEvent('customer_analytics_report_failed', {
      startDate,
      endDate,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Generate KPI dashboard data
const generateKPIDashboard = async (dateRange = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    // Key performance indicators
    const [
      revenueKPI,
      bookingKPI,
      customerKPI,
      inventoryKPI
    ] = await Promise.all([
      // Revenue KPIs
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
            totalRevenue: { $sum: '$pricing.total' },
            avgBookingValue: { $avg: '$pricing.total' },
            bookingCount: { $sum: 1 }
          }
        }
      ]),
      
      // Booking KPIs
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            completedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Customer KPIs
      User.aggregate([
        {
          $match: {
            role: 'customer',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            newCustomers: { $sum: 1 },
            avgLoyaltyPoints: { $avg: '$loyaltyPoints' }
          }
        }
      ]),
      
      // Inventory KPIs
      Inventory.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const revenue = revenueKPI[0] || {};
    const booking = bookingKPI[0] || {};
    const customer = customerKPI[0] || {};
    
    const kpis = {
      revenue: {
        total: revenue.totalRevenue || 0,
        avgBookingValue: revenue.avgBookingValue || 0,
        growth: 0 // Would need previous period comparison
      },
      bookings: {
        total: booking.totalBookings || 0,
        completionRate: booking.totalBookings > 0 ? 
          (booking.completedBookings / booking.totalBookings) * 100 : 0,
        cancellationRate: booking.totalBookings > 0 ? 
          (booking.cancelledBookings / booking.totalBookings) * 100 : 0
      },
      customers: {
        new: customer.newCustomers || 0,
        avgLoyaltyPoints: customer.avgLoyaltyPoints || 0
      },
      inventory: {
        available: inventoryKPI.find(item => item._id === 'available')?.count || 0,
        maintenance: inventoryKPI.find(item => item._id === 'maintenance')?.count || 0,
        total: inventoryKPI.reduce((sum, item) => sum + item.count, 0)
      },
      period: {
        start: startDate,
        end: endDate,
        days: dateRange
      }
    };
    
    logBIEvent('kpi_dashboard_generated', {
      dateRange,
      totalRevenue: kpis.revenue.total,
      totalBookings: kpis.bookings.total,
      newCustomers: kpis.customers.new
    }, 'info');
    
    return kpis;
    
  } catch (error) {
    logBIEvent('kpi_dashboard_failed', {
      dateRange,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export business intelligence functions
module.exports = {
  generateFinancialReport,
  generateOperationalReport,
  generateCustomerAnalyticsReport,
  generateKPIDashboard,
  BI_CONFIG
};
