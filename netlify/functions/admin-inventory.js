// Admin Inventory Management API for Midas The Lifestyle
// Comprehensive inventory CRUD operations with bulk management

const { withDatabase } = require('../../database/connection');
const { withAuth } = require('./auth-middleware');
const {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  bulkCreateInventory,
  bulkUpdateInventory,
  scheduleMaintenanceItem,
  getInventoryUtilizationReport,
  getMaintenanceSchedule,
  validateAdminPermissions
} = require('../../services/inventoryManagementService');
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
    service: 'admin-inventory-api',
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

// Main inventory management handler
const inventoryManagementHandler = withAuth(async (event, context) => {
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
    const requiredRole = event.httpMethod === 'GET' ? 'concierge' : 'admin';
    validateAdminPermissions(event.user, requiredRole);
    
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(segment => segment);
    const itemId = pathSegments[pathSegments.length - 1];
    
    logAPIEvent('inventory_request', {
      method,
      path: event.path,
      itemId,
      userId: event.user.id,
      userRole: event.user.role
    }, 'info');
    
    // Route based on method
    switch (method) {
      case 'GET':
        return await handleGetInventory(event, itemId);
      case 'POST':
        return await handleCreateInventory(event);
      case 'PUT':
        return await handleUpdateInventory(event, itemId);
      case 'DELETE':
        return await handleDeleteInventory(event, itemId);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
  } catch (error) {
    logAPIEvent('inventory_request_error', {
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
        error: 'Inventory operation failed',
        message: 'We apologize for the inconvenience. Please try again or contact support.'
      })
    };
  }
}, { roles: ['concierge', 'admin', 'super-admin'] });

// Handle GET requests for inventory retrieval
const handleGetInventory = async (event, itemId) => {
  const queryParams = event.queryStringParameters || {};
  
  try {
    // If itemId is provided, get specific item
    if (itemId && !['search', 'analytics', 'maintenance', 'utilization'].includes(itemId)) {
      return await getSpecificInventoryItem(itemId);
    }
    
    // Handle different GET actions
    switch (itemId) {
      case 'search':
        return await searchInventory(queryParams);
      case 'analytics':
        return await getInventoryAnalytics(queryParams);
      case 'maintenance':
        return await getMaintenanceScheduleAPI(queryParams);
      case 'utilization':
        return await getUtilizationReport(queryParams);
      default:
        return await getAllInventory(queryParams);
    }
    
  } catch (error) {
    logAPIEvent('inventory_get_error', {
      itemId,
      error: error.message
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Inventory retrieval failed',
        message: error.message
      })
    };
  }
};

// Get specific inventory item
const getSpecificInventoryItem = async (itemId) => {
  const item = await Inventory.findOne({ itemId })
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email');
  
  if (!item) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Inventory item not found'
      })
    };
  }
  
  logAPIEvent('inventory_item_retrieved', {
    itemId,
    itemName: item.itemName,
    itemType: item.itemType
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      item,
      timestamp: new Date().toISOString()
    })
  };
};

// Search inventory with filters
const searchInventory = async (queryParams) => {
  const {
    itemType,
    status,
    location,
    minPrice,
    maxPrice,
    brand,
    model,
    year,
    featured,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;
  
  // Build search query
  const query = {};
  
  if (itemType) query.itemType = itemType;
  if (status) query.status = { $in: status.split(',') };
  if (location) query['location.primaryLocation'] = location;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (model) query.model = { $regex: model, $options: 'i' };
  if (year) query.year = parseInt(year);
  if (featured !== undefined) query['seo.featured'] = featured === 'true';
  
  if (minPrice || maxPrice) {
    query['pricing.basePrice'] = {};
    if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
    if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
  }
  
  // Execute search
  const items = await Inventory.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await Inventory.countDocuments(query);
  
  logAPIEvent('inventory_searched', {
    query,
    resultsCount: items.length,
    totalCount: total
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      items,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + items.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get all inventory
const getAllInventory = async (queryParams) => {
  const { limit = 50, offset = 0 } = queryParams;
  
  const items = await Inventory.find({})
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));
  
  const total = await Inventory.countDocuments({});
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      items,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + items.length) < total
      },
      timestamp: new Date().toISOString()
    })
  };
};

// Get inventory analytics
const getInventoryAnalytics = async (queryParams) => {
  const { dateRange = 30, itemType } = queryParams;
  
  const analytics = await getInventoryUtilizationReport(
    parseInt(dateRange),
    itemType
  );
  
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

// Get maintenance schedule
const getMaintenanceScheduleAPI = async (queryParams) => {
  const { daysAhead = 90 } = queryParams;
  
  const schedule = await getMaintenanceSchedule(parseInt(daysAhead));
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      schedule,
      timestamp: new Date().toISOString()
    })
  };
};

// Get utilization report
const getUtilizationReport = async (queryParams) => {
  const { dateRange = 30, itemType } = queryParams;
  
  const report = await getInventoryUtilizationReport(
    parseInt(dateRange),
    itemType
  );
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      report,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle POST requests for inventory creation
const handleCreateInventory = async (event) => {
  try {
    const requestData = JSON.parse(event.body);
    const { action, items, item } = requestData;
    
    switch (action) {
      case 'bulk':
        return await handleBulkCreate(items, event.user.id);
      case 'maintenance':
        return await handleMaintenanceScheduling(requestData, event.user.id);
      default:
        return await handleSingleCreate(item || requestData, event.user.id);
    }
    
  } catch (error) {
    logAPIEvent('inventory_create_error', {
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Inventory creation failed',
        message: error.message
      })
    };
  }
};

// Handle single item creation
const handleSingleCreate = async (itemData, userId) => {
  const item = await createInventoryItem(itemData, userId);
  
  logAPIEvent('inventory_item_created', {
    itemId: item.itemId,
    itemName: item.itemName,
    userId
  }, 'info');
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Inventory item created successfully',
      item,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle bulk creation
const handleBulkCreate = async (items, userId) => {
  const results = await bulkCreateInventory(items, userId);
  
  logAPIEvent('inventory_bulk_created', {
    totalItems: items.length,
    created: results.created.length,
    errors: results.errors.length,
    userId
  }, 'info');
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: `Bulk creation completed. ${results.created.length} items created, ${results.errors.length} errors.`,
      results,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle maintenance scheduling
const handleMaintenanceScheduling = async (requestData, userId) => {
  const { itemId, maintenanceData } = requestData;
  
  const item = await scheduleMaintenanceItem(itemId, maintenanceData, userId);
  
  logAPIEvent('maintenance_scheduled', {
    itemId,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Maintenance scheduled successfully',
      item,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle PUT requests for inventory updates
const handleUpdateInventory = async (event, itemId) => {
  if (!itemId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing item ID'
      })
    };
  }
  
  try {
    const updateData = JSON.parse(event.body);
    const { action, updates } = updateData;
    
    if (action === 'bulk') {
      return await handleBulkUpdate(updates, event.user.id);
    } else {
      return await handleSingleUpdate(itemId, updateData, event.user.id);
    }
    
  } catch (error) {
    logAPIEvent('inventory_update_error', {
      itemId,
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Inventory update failed',
        message: error.message
      })
    };
  }
};

// Handle single item update
const handleSingleUpdate = async (itemId, updateData, userId) => {
  const item = await updateInventoryItem(itemId, updateData, userId);
  
  logAPIEvent('inventory_item_updated', {
    itemId,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Inventory item updated successfully',
      item,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle bulk update
const handleBulkUpdate = async (updates, userId) => {
  const results = await bulkUpdateInventory(updates, userId);
  
  logAPIEvent('inventory_bulk_updated', {
    totalItems: updates.length,
    updated: results.updated.length,
    errors: results.errors.length,
    userId
  }, 'info');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: `Bulk update completed. ${results.updated.length} items updated, ${results.errors.length} errors.`,
      results,
      timestamp: new Date().toISOString()
    })
  };
};

// Handle DELETE requests for inventory deletion
const handleDeleteInventory = async (event, itemId) => {
  if (!itemId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing item ID'
      })
    };
  }
  
  try {
    const result = await deleteInventoryItem(itemId, event.user.id);
    
    logAPIEvent('inventory_item_deleted', {
      itemId,
      userId: event.user.id
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Inventory item deleted successfully',
        deletedItem: result.deletedItem,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    logAPIEvent('inventory_delete_error', {
      itemId,
      error: error.message,
      userId: event.user.id
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Inventory deletion failed',
        message: error.message
      })
    };
  }
};

module.exports = { handler: inventoryManagementHandler };
