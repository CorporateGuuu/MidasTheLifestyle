// Admin Customer Management API for Midas The Lifestyle
// Comprehensive customer operations with analytics and communication tools

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const {
  getCustomerProfile,
  updateCustomerServiceTier,
  getCustomerSegmentation,
  getCustomerBookingBehavior,
  sendBulkCustomerCommunication,
  validateAdminPermissions
} = require('../../services/customerManagementService');
const User = require('../../database/models/User');

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
    service: 'admin-customers-api',
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

// Main customer management handler
const customerManagementHandler = withAuth(async (event, context) => {
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
    const pathSegments = event.path.split('/').filter(segment => segment);
    const customerId = pathSegments[pathSegments.length - 1];
    
    logAPIEvent('customer_request', {
      method,
      path: event.path,
      customerId,
      userId: event.user.id,
      userRole: event.user.role
    }, 'info');
    
    // Route based on method
    switch (method) {
      case 'GET':
        return await handleGetCustomers(event, customerId);
      case 'POST':
        return await handleCustomerActions(event);
      case 'PUT':
        return await handleUpdateCustomer(event, customerId);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
  } catch (error) {
    logAPIEvent('customer_request_error', {
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
        error: 'Customer operation failed',
        message: 'We apologize for the inconvenience. Please try again or contact support.'
      })
    };
  }
}, { roles: ['concierge', 'admin', 'super-admin'] });

// Handle GET requests for customer data
const handleGetCustomers = async (event, customerId) => {
  const queryParams = event.queryStringParameters || {};
  
  try {
    // If customerId is provided, get specific customer or handle special actions
    if (customerId && !['search', 'analytics', 'segmentation', 'behavior'].includes(customerId)) {
      return await getSpecificCustomer(customerId);
    }
    
    // Handle different GET actions
    switch (customerId) {
      case 'search':
        return await searchCustomers(queryParams);
      case 'analytics':
        return await getCustomerAnalytics(queryParams);
      case 'segmentation':
        return await getSegmentationAnalysis(queryParams);
      case 'behavior':
        return await getBehaviorAnalysis(queryParams);
      default:
        return await getAllCustomers(queryParams);
    }
    
  } catch (error) {
    logAPIEvent('customer_get_error', {
      customerId,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Customer retrieval failed',
        message: error.message
      })
    };
  }
};

// Get specific customer profile
const getSpecificCustomer = async (customerId) => {
  const profile = await getCustomerProfile(customerId);
  
  logAPIEvent('customer_profile_retrieved', {
    customerId,
    totalBookings: profile.metrics.totalBookings,
    totalRevenue: profile.metrics.totalRevenue
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      customer: profile,
      timestamp: new Date().toISOString()
    })
  };
};

// Search customers with filters
const searchCustomers = async (queryParams) => {
  const {
    tier,
    status,
    minSpent,
    maxSpent,
    minBookings,
    maxBookings,
    location,
    email,
    name,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;
  
  // Build search query
  const query = { role: 'customer' };
  
  if (tier) query['serviceProfile.tier'] = { $in: tier.split(',') };
  if (status) query.status = { $in: status.split(',') };
  if (location) query['address.city'] = { $regex: location, $options: 'i' };
  if (email) query.email = { $regex: email, $options: 'i' };
  
  if (name) {
    query.$or = [
      { firstName: { $regex: name, $options: 'i' } },
      { lastName: { $regex: name, $options: 'i' } }
    ];
  }
  
  if (minSpent || maxSpent) {
    query.totalSpent = {};
    if (minSpent) query.totalSpent.$gte = parseFloat(minSpent);
    if (maxSpent) query.totalSpent.$lte = parseFloat(maxSpent);
  }
  
  if (minBookings || maxBookings) {
    query.totalBookings = {};
    if (minBookings) query.totalBookings.$gte = parseInt(minBookings);
    if (maxBookings) query.totalBookings.$lte = parseInt(maxBookings);
  }
  
  // Execute search
  const customers = await User.find(query)
    .select('-password')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await User.countDocuments(query);
  
  logAPIEvent('customers_searched', {
    query,
    resultsCount: customers.length,
    totalCount: total
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      customers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + customers.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get all customers
const getAllCustomers = async (queryParams) => {
  const { limit = 50, offset = 0 } = queryParams;
  
  const customers = await User.find({ role: 'customer' })
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await User.countDocuments({ role: 'customer' });
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      customers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + customers.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get customer analytics
const getCustomerAnalytics = async (queryParams) => {
  const { dateRange = 90 } = queryParams;
  
  // Get basic customer metrics
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const activeCustomers = await User.countDocuments({
    role: 'customer',
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  // Get tier distribution
  const tierDistribution = await User.aggregate([
    { $match: { role: 'customer' } },
    {
      $group: {
        _id: '$serviceProfile.tier',
        count: { $sum: 1 },
        avgSpent: { $avg: '$totalSpent' },
        avgBookings: { $avg: '$totalBookings' }
      }
    }
  ]);
  
  // Get registration trends
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));
  
  const registrationTrends = await User.aggregate([
    {
      $match: {
        role: 'customer',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        registrations: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const analytics = {
    summary: {
      totalCustomers,
      activeCustomers,
      activeRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
    },
    tierDistribution,
    registrationTrends,
    dateRange: {
      start: startDate,
      end: endDate,
      days: parseInt(dateRange)
    }
  };
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    })
  };
};

// Get segmentation analysis
const getSegmentationAnalysis = async (queryParams) => {
  const { dateRange = 90 } = queryParams;
  
  const segmentation = await getCustomerSegmentation(parseInt(dateRange));
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      segmentation,
      timestamp: new Date().toISOString()
    })
  };
};

// Get behavior analysis
const getBehaviorAnalysis = async (queryParams) => {
  const { customerId, dateRange = 365 } = queryParams;
  
  if (!customerId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Customer ID required for behavior analysis'
      })
    };
  }
  
  const behavior = await getCustomerBookingBehavior(customerId, parseInt(dateRange));
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      behavior,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle POST requests for customer actions
const handleCustomerActions = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { action } = requestData;
    
    switch (action) {
      case 'bulk-communication':
        return await handleBulkCommunication(requestData, event.user.id);
      case 'tier-upgrade':
        return await handleTierUpgrade(requestData, event.user.id);
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid action',
            message: 'Supported actions: bulk-communication, tier-upgrade'
          })
        };
    }
    
  } catch (error) {
    logAPIEvent('customer_action_error', {
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Customer action failed',
        message: error.message
      })
    };
  }
};

// Handle bulk communication
const handleBulkCommunication = async (requestData, userId) => {
  const { criteria, messageData } = requestData;
  
  // Require admin permissions for bulk communication
  validateAdminPermissions({ role: 'admin' }, 'admin');
  
  const results = await sendBulkCustomerCommunication(criteria, messageData, userId);
  
  logAPIEvent('bulk_communication_sent', {
    criteria,
    sent: results.sent,
    failed: results.failed,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: `Bulk communication completed. ${results.sent} sent, ${results.failed} failed.`,
      results,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle tier upgrade
const handleTierUpgrade = async (requestData, userId) => {
  const { customerId, newTier, reason } = requestData;
  
  if (!customerId || !newTier) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Customer ID and new tier are required'
      })
    };
  }
  
  const customer = await updateCustomerServiceTier(customerId, newTier, userId, reason);
  
  logAPIEvent('customer_tier_upgraded', {
    customerId,
    newTier,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Customer tier updated successfully',
      customer,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle PUT requests for customer updates
const handleUpdateCustomer = async (event, customerId) => {
  if (!customerId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing customer ID'
      })
    };
  }
  
  try {
    const updateData = JSON.parse(event.body);
    
    const customer = await User.findById(customerId);
    
    if (!customer || customer.role !== 'customer') {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Customer not found'
        })
      };
    }
    
    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'address',
      'serviceProfile.preferredLocations',
      'serviceProfile.preferredVehicleTypes',
      'serviceProfile.specialRequests',
      'notifications'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!customer[parent]) customer[parent] = {};
          customer[parent][child] = updateData[field];
        } else {
          customer[field] = updateData[field];
        }
      }
    }
    
    customer.updatedAt = new Date();
    await customer.save();
    
    logAPIEvent('customer_updated', {
      customerId,
      updatedFields: Object.keys(updateData),
      userId: event.user.id
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Customer updated successfully',
        customer,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    logAPIEvent('customer_update_error', {
      customerId,
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Customer update failed',
        message: error.message
      })
    };
  }
};

module.exports = { handler: customerManagementHandler };
