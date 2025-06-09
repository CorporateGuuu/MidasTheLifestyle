// Admin Dashboard API for Midas The Lifestyle
// Comprehensive admin dashboard with real-time metrics and analytics

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const {
  getDashboardOverview,
  getRealTimeMetrics,
  getInventoryAnalytics,
  getCustomerAnalytics,
  validateAdminPermissions
} = require('../../services/adminService');

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
    service: 'admin-dashboard-api',
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

// Main admin dashboard handler
const adminDashboardHandler = withAuth(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Validate admin permissions
    validateAdminPermissions(event.user, 'concierge');
    
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    
    logAPIEvent('admin_dashboard_request', {
      method,
      queryParams,
      userId: event.user.id,
      userRole: event.user.role
    }, 'info');
    
    // Route based on method and action
    if (method === 'GET') {
      return await handleGetDashboard(event, queryParams);
    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
  } catch (error) {
    logAPIEvent('admin_dashboard_error', {
      error: error.message,
      stack: error.stack,
      userId: event.user?.id
    }, 'error');
    
    // Handle permission errors
    if (error.message.includes('Insufficient permissions')) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Access denied',
          message: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Dashboard operation failed',
        message: 'We apologize for the inconvenience. Please try again or contact support.'
      })
    };
  }
}, { roles: ['concierge', 'admin', 'super-admin'] });

// Handle GET requests for dashboard data
const handleGetDashboard = async (event, queryParams) => {
  const { 
    action = 'overview', 
    dateRange = 30, 
    itemType, 
    segmentBy = 'tier',
    refresh = false 
  } = queryParams;
  
  try {
    const userId = event.user.id;
    const parsedDateRange = Math.min(Math.max(parseInt(dateRange), 1), 365);
    
    switch (action) {
      case 'overview':
        return await handleDashboardOverview(userId, parsedDateRange);
        
      case 'realtime':
        return await handleRealTimeMetrics(userId);
        
      case 'inventory-analytics':
        return await handleInventoryAnalytics(userId, itemType, parsedDateRange);
        
      case 'customer-analytics':
        return await handleCustomerAnalytics(userId, segmentBy, parsedDateRange);
        
      case 'system-health':
        return await handleSystemHealth(userId);
        
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported actions: overview, realtime, inventory-analytics, customer-analytics, system-health'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('dashboard_get_error', {
      action,
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Dashboard data retrieval failed',
        message: error.message
      })
    };
  }
};

// Handle dashboard overview
const handleDashboardOverview = async (userId, dateRange) => {
  const overview = await getDashboardOverview(userId, dateRange);
  
  logAPIEvent('dashboard_overview_served', {
    userId,
    dateRange,
    totalBookings: overview.summary.totalBookings,
    totalRevenue: overview.summary.totalRevenue
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
      cacheInfo: {
        generated: new Date().toISOString(),
        ttl: 300 // 5 minutes
      }
    })
  };
};

// Handle real-time metrics
const handleRealTimeMetrics = async (userId) => {
  const metrics = await getRealTimeMetrics(userId);
  
  logAPIEvent('realtime_metrics_served', {
    userId,
    todayBookings: metrics.bookings.today,
    activeUsers: metrics.users.active,
    pendingActions: metrics.pendingActions
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      realTime: true
    })
  };
};

// Handle inventory analytics
const handleInventoryAnalytics = async (userId, itemType, dateRange) => {
  const analytics = await getInventoryAnalytics(userId, itemType, dateRange);
  
  logAPIEvent('inventory_analytics_served', {
    userId,
    itemType,
    dateRange,
    inventoryCount: analytics.summary.length,
    utilizationCount: analytics.utilization.length
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      cacheInfo: {
        generated: new Date().toISOString(),
        ttl: 900 // 15 minutes
      }
    })
  };
};

// Handle customer analytics
const handleCustomerAnalytics = async (userId, segmentBy, dateRange) => {
  const analytics = await getCustomerAnalytics(userId, segmentBy, dateRange);
  
  logAPIEvent('customer_analytics_served', {
    userId,
    segmentBy,
    dateRange,
    segmentCount: analytics.segmentation.length
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      cacheInfo: {
        generated: new Date().toISOString(),
        ttl: 900 // 15 minutes
      }
    })
  };
};

// Handle system health
const handleSystemHealth = async (userId) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        email: 'operational',
        payment: 'operational',
        calendar: 'operational'
      }
    };
    
    // Check database connection
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        health.services.database = 'disconnected';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database = 'error';
      health.status = 'unhealthy';
    }
    
    logAPIEvent('system_health_checked', {
      userId,
      status: health.status,
      uptime: health.uptime
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    logAPIEvent('system_health_check_failed', {
      userId,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'System health check failed',
        timestamp: new Date().toISOString()
      })
    };
  }
};

module.exports = { handler: adminDashboardHandler };
