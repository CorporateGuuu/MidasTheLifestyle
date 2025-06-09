// Inventory Management Service for Midas The Lifestyle
// Comprehensive inventory operations with bulk management and analytics

const mongoose = require('mongoose');
const Inventory = require('../database/models/Inventory');
const Booking = require('../database/models/Booking');

// Inventory management configuration
const INVENTORY_CONFIG = {
  // Bulk operation limits
  bulkLimits: {
    create: 100,
    update: 200,
    delete: 50
  },
  
  // Image optimization settings
  imageOptimization: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    thumbnailSizes: [150, 300, 600, 1200]
  },
  
  // Pricing validation
  pricing: {
    minPrice: 100,
    maxPrice: 100000,
    maxSeasonalMultiplier: 3.0
  },
  
  // Maintenance scheduling
  maintenance: {
    defaultIntervalDays: 90,
    urgentThresholdDays: 7,
    overduePenaltyMultiplier: 0.8
  }
};

// Log inventory events
const logInventoryEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'inventory-management',
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

// Validate inventory data
const validateInventoryData = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.itemId) errors.push('Item ID is required');
  if (!data.itemName) errors.push('Item name is required');
  if (!data.itemType) errors.push('Item type is required');
  if (!data.brand) errors.push('Brand is required');
  if (!data.model) errors.push('Model is required');
  if (!data.year) errors.push('Year is required');
  
  // Validate item type
  const validTypes = ['cars', 'yachts', 'jets', 'properties'];
  if (data.itemType && !validTypes.includes(data.itemType)) {
    errors.push(`Invalid item type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate year
  const currentYear = new Date().getFullYear();
  if (data.year && (data.year < 1990 || data.year > currentYear + 2)) {
    errors.push(`Year must be between 1990 and ${currentYear + 2}`);
  }
  
  // Validate pricing
  if (data.pricing) {
    if (data.pricing.basePrice < INVENTORY_CONFIG.pricing.minPrice) {
      errors.push(`Base price must be at least $${INVENTORY_CONFIG.pricing.minPrice}`);
    }
    if (data.pricing.basePrice > INVENTORY_CONFIG.pricing.maxPrice) {
      errors.push(`Base price cannot exceed $${INVENTORY_CONFIG.pricing.maxPrice}`);
    }
  }
  
  return errors;
};

// Create single inventory item
const createInventoryItem = async (itemData, userId) => {
  try {
    // Validate data
    const validationErrors = validateInventoryData(itemData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Check for duplicate itemId
    const existingItem = await Inventory.findOne({ itemId: itemData.itemId });
    if (existingItem) {
      throw new Error(`Item with ID ${itemData.itemId} already exists`);
    }
    
    // Create inventory item
    const item = new Inventory({
      ...itemData,
      createdBy: userId,
      lastModifiedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await item.save();
    
    logInventoryEvent('item_created', {
      itemId: item.itemId,
      itemName: item.itemName,
      itemType: item.itemType,
      userId
    }, 'info');
    
    return item;
    
  } catch (error) {
    logInventoryEvent('item_creation_failed', {
      itemId: itemData.itemId,
      error: error.message,
      userId
    }, 'error');
    throw error;
  }
};

// Update inventory item
const updateInventoryItem = async (itemId, updateData, userId) => {
  try {
    const item = await Inventory.findOne({ itemId });
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Validate update data
    const validationErrors = validateInventoryData({ ...item.toObject(), ...updateData });
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Update item
    Object.assign(item, updateData);
    item.lastModifiedBy = userId;
    item.updatedAt = new Date();
    
    await item.save();
    
    logInventoryEvent('item_updated', {
      itemId,
      updatedFields: Object.keys(updateData),
      userId
    }, 'info');
    
    return item;
    
  } catch (error) {
    logInventoryEvent('item_update_failed', {
      itemId,
      error: error.message,
      userId
    }, 'error');
    throw error;
  }
};

// Delete inventory item
const deleteInventoryItem = async (itemId, userId) => {
  try {
    const item = await Inventory.findOne({ itemId });
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      'item.itemId': itemId,
      status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] }
    });
    
    if (activeBookings > 0) {
      throw new Error(`Cannot delete item with ${activeBookings} active booking(s)`);
    }
    
    await Inventory.deleteOne({ itemId });
    
    logInventoryEvent('item_deleted', {
      itemId,
      itemName: item.itemName,
      userId
    }, 'info');
    
    return { success: true, deletedItem: item };
    
  } catch (error) {
    logInventoryEvent('item_deletion_failed', {
      itemId,
      error: error.message,
      userId
    }, 'error');
    throw error;
  }
};

// Bulk create inventory items
const bulkCreateInventory = async (itemsData, userId) => {
  const session = await mongoose.startSession();
  
  try {
    const results = await session.withTransaction(async () => {
      const created = [];
      const errors = [];
      
      // Validate bulk limit
      if (itemsData.length > INVENTORY_CONFIG.bulkLimits.create) {
        throw new Error(`Bulk create limit exceeded. Maximum ${INVENTORY_CONFIG.bulkLimits.create} items allowed`);
      }
      
      for (let i = 0; i < itemsData.length; i++) {
        try {
          const item = await createInventoryItem(itemsData[i], userId);
          created.push(item);
        } catch (error) {
          errors.push({
            index: i,
            itemId: itemsData[i].itemId,
            error: error.message
          });
        }
      }
      
      return { created, errors };
    });
    
    logInventoryEvent('bulk_create_completed', {
      totalItems: itemsData.length,
      created: results.created.length,
      errors: results.errors.length,
      userId
    }, results.errors.length > 0 ? 'warning' : 'info');
    
    return results;
    
  } catch (error) {
    logInventoryEvent('bulk_create_failed', {
      totalItems: itemsData.length,
      error: error.message,
      userId
    }, 'error');
    throw error;
  } finally {
    await session.endSession();
  }
};

// Bulk update inventory items
const bulkUpdateInventory = async (updates, userId) => {
  const session = await mongoose.startSession();
  
  try {
    const results = await session.withTransaction(async () => {
      const updated = [];
      const errors = [];
      
      // Validate bulk limit
      if (updates.length > INVENTORY_CONFIG.bulkLimits.update) {
        throw new Error(`Bulk update limit exceeded. Maximum ${INVENTORY_CONFIG.bulkLimits.update} items allowed`);
      }
      
      for (const update of updates) {
        try {
          const item = await updateInventoryItem(update.itemId, update.data, userId);
          updated.push(item);
        } catch (error) {
          errors.push({
            itemId: update.itemId,
            error: error.message
          });
        }
      }
      
      return { updated, errors };
    });
    
    logInventoryEvent('bulk_update_completed', {
      totalItems: updates.length,
      updated: results.updated.length,
      errors: results.errors.length,
      userId
    }, results.errors.length > 0 ? 'warning' : 'info');
    
    return results;
    
  } catch (error) {
    logInventoryEvent('bulk_update_failed', {
      totalItems: updates.length,
      error: error.message,
      userId
    }, 'error');
    throw error;
  } finally {
    await session.endSession();
  }
};

// Schedule maintenance for item
const scheduleMaintenanceItem = async (itemId, maintenanceData, userId) => {
  try {
    const item = await Inventory.findOne({ itemId });
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Add blackout period for maintenance
    const maintenancePeriod = {
      startDate: new Date(maintenanceData.startDate),
      endDate: new Date(maintenanceData.endDate),
      reason: maintenanceData.reason || 'Scheduled maintenance'
    };
    
    item.availability.blackoutDates.push(maintenancePeriod);
    
    // Update maintenance schedule
    item.condition.nextInspection = new Date(maintenanceData.nextInspection || 
      Date.now() + INVENTORY_CONFIG.maintenance.defaultIntervalDays * 24 * 60 * 60 * 1000);
    item.condition.maintenanceNotes = maintenanceData.notes || '';
    
    item.lastModifiedBy = userId;
    item.updatedAt = new Date();
    
    await item.save();
    
    logInventoryEvent('maintenance_scheduled', {
      itemId,
      startDate: maintenancePeriod.startDate,
      endDate: maintenancePeriod.endDate,
      reason: maintenancePeriod.reason,
      userId
    }, 'info');
    
    return item;
    
  } catch (error) {
    logInventoryEvent('maintenance_scheduling_failed', {
      itemId,
      error: error.message,
      userId
    }, 'error');
    throw error;
  }
};

// Get inventory utilization report
const getInventoryUtilizationReport = async (dateRange = 30, itemType = null) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const matchQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (itemType) {
      matchQuery['item.itemType'] = itemType;
    }
    
    const utilizationData = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$item.itemId',
          itemName: { $first: '$item.itemName' },
          itemType: { $first: '$item.itemType' },
          totalBookings: { $sum: 1 },
          totalDays: { $sum: '$duration.days' },
          totalRevenue: { $sum: '$pricing.total' },
          avgBookingValue: { $avg: '$pricing.total' }
        }
      },
      {
        $addFields: {
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalDays', dateRange] },
              100
            ]
          },
          revenuePerDay: {
            $divide: ['$totalRevenue', '$totalDays']
          }
        }
      },
      { $sort: { utilizationRate: -1 } }
    ]);
    
    // Get inventory items not in bookings (0% utilization)
    const bookedItemIds = utilizationData.map(item => item._id);
    const unbookedItems = await Inventory.find({
      itemId: { $nin: bookedItemIds },
      ...(itemType && { itemType })
    }).select('itemId itemName itemType pricing.basePrice');
    
    const unbookedUtilization = unbookedItems.map(item => ({
      _id: item.itemId,
      itemName: item.itemName,
      itemType: item.itemType,
      totalBookings: 0,
      totalDays: 0,
      totalRevenue: 0,
      avgBookingValue: 0,
      utilizationRate: 0,
      revenuePerDay: 0
    }));
    
    const completeReport = [...utilizationData, ...unbookedUtilization];
    
    // Calculate summary statistics
    const summary = {
      totalItems: completeReport.length,
      averageUtilization: completeReport.reduce((sum, item) => sum + item.utilizationRate, 0) / completeReport.length,
      totalRevenue: completeReport.reduce((sum, item) => sum + item.totalRevenue, 0),
      highPerformers: completeReport.filter(item => item.utilizationRate > 70).length,
      underPerformers: completeReport.filter(item => item.utilizationRate < 20).length
    };
    
    logInventoryEvent('utilization_report_generated', {
      dateRange,
      itemType,
      totalItems: summary.totalItems,
      averageUtilization: summary.averageUtilization
    }, 'info');
    
    return {
      summary,
      items: completeReport,
      dateRange: {
        start: startDate,
        end: endDate,
        days: dateRange
      }
    };
    
  } catch (error) {
    logInventoryEvent('utilization_report_failed', {
      dateRange,
      itemType,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Get maintenance schedule
const getMaintenanceSchedule = async (daysAhead = 90) => {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    
    const maintenanceItems = await Inventory.find({
      'condition.nextInspection': { $lte: endDate }
    })
    .select('itemId itemName itemType condition location status')
    .sort({ 'condition.nextInspection': 1 });
    
    // Categorize by urgency
    const now = new Date();
    const urgentThreshold = new Date();
    urgentThreshold.setDate(urgentThreshold.getDate() + INVENTORY_CONFIG.maintenance.urgentThresholdDays);
    
    const schedule = {
      overdue: [],
      urgent: [],
      upcoming: []
    };
    
    maintenanceItems.forEach(item => {
      const inspectionDate = new Date(item.condition.nextInspection);
      
      if (inspectionDate < now) {
        schedule.overdue.push(item);
      } else if (inspectionDate <= urgentThreshold) {
        schedule.urgent.push(item);
      } else {
        schedule.upcoming.push(item);
      }
    });
    
    logInventoryEvent('maintenance_schedule_generated', {
      daysAhead,
      overdue: schedule.overdue.length,
      urgent: schedule.urgent.length,
      upcoming: schedule.upcoming.length
    }, 'info');
    
    return schedule;
    
  } catch (error) {
    logInventoryEvent('maintenance_schedule_failed', {
      daysAhead,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Export inventory management functions
module.exports = {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  bulkCreateInventory,
  bulkUpdateInventory,
  scheduleMaintenanceItem,
  getInventoryUtilizationReport,
  getMaintenanceSchedule,
  validateInventoryData,
  INVENTORY_CONFIG
};
