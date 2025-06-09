// Initial Database Setup Migration for Midas The Lifestyle
// Creates initial collections, indexes, and seed data

const { connectToDatabase } = require('../connection');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Booking = require('../models/Booking');

// Migration configuration
const MIGRATION_CONFIG = {
  version: '001',
  name: 'initial-setup',
  description: 'Initial database setup with collections, indexes, and seed data',
  createdAt: new Date().toISOString()
};

// Log migration events
const logMigrationEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'database-migration',
    migration: MIGRATION_CONFIG.version,
    eventType,
    severity,
    data
  };
  
  console.log(JSON.stringify(logEntry));
};

// Create admin user
const createAdminUser = async () => {
  try {
    logMigrationEvent('admin_user_creation_started', {}, 'info');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'super-admin' });
    if (existingAdmin) {
      logMigrationEvent('admin_user_exists', { email: existingAdmin.email }, 'info');
      return existingAdmin;
    }
    
    // Create super admin user
    const adminUser = new User({
      email: 'admin@midasthelifestyle.com',
      password: 'MidasAdmin2024!', // Should be changed after first login
      firstName: 'Midas',
      lastName: 'Administrator',
      phone: '+971585531029',
      role: 'super-admin',
      status: 'active',
      emailVerified: true,
      serviceProfile: {
        tier: 'vvip',
        preferredLocations: ['dubai', 'washington-dc', 'houston', 'atlanta'],
        vipPreferences: {
          chauffeurService: true,
          airportPickup: true,
          customDelivery: true,
          personalConcierge: true
        }
      },
      notifications: {
        email: {
          bookingConfirmations: true,
          paymentReceipts: true,
          promotionalOffers: false,
          serviceUpdates: true
        }
      },
      gdprConsent: {
        given: true,
        date: new Date(),
        ipAddress: '127.0.0.1'
      }
    });
    
    await adminUser.save();
    
    logMigrationEvent('admin_user_created', { 
      email: adminUser.email,
      id: adminUser._id 
    }, 'info');
    
    return adminUser;
    
  } catch (error) {
    logMigrationEvent('admin_user_creation_failed', { 
      error: error.message 
    }, 'error');
    throw error;
  }
};

// Create concierge users
const createConciergeUsers = async () => {
  try {
    logMigrationEvent('concierge_users_creation_started', {}, 'info');
    
    const conciergeUsers = [
      {
        email: 'concierge.dubai@midasthelifestyle.com',
        firstName: 'Amira',
        lastName: 'Al-Zahra',
        phone: '+971585531029',
        role: 'concierge',
        serviceProfile: {
          preferredLocations: ['dubai'],
          tier: 'premium'
        }
      },
      {
        email: 'concierge.usa@midasthelifestyle.com',
        firstName: 'James',
        lastName: 'Wellington',
        phone: '+12403510511',
        role: 'concierge',
        serviceProfile: {
          preferredLocations: ['washington-dc', 'houston', 'atlanta', 'maryland', 'northern-virginia'],
          tier: 'premium'
        }
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of conciergeUsers) {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        logMigrationEvent('concierge_user_exists', { email: userData.email }, 'info');
        createdUsers.push(existingUser);
        continue;
      }
      
      const user = new User({
        ...userData,
        password: 'ConciergeTemp2024!', // Should be changed after first login
        status: 'active',
        emailVerified: true,
        gdprConsent: {
          given: true,
          date: new Date(),
          ipAddress: '127.0.0.1'
        }
      });
      
      await user.save();
      createdUsers.push(user);
      
      logMigrationEvent('concierge_user_created', { 
        email: user.email,
        id: user._id 
      }, 'info');
    }
    
    return createdUsers;
    
  } catch (error) {
    logMigrationEvent('concierge_users_creation_failed', { 
      error: error.message 
    }, 'error');
    throw error;
  }
};

// Create sample inventory
const createSampleInventory = async () => {
  try {
    logMigrationEvent('sample_inventory_creation_started', {}, 'info');
    
    // Check if inventory already exists
    const existingInventory = await Inventory.countDocuments();
    if (existingInventory > 0) {
      logMigrationEvent('inventory_exists', { count: existingInventory }, 'info');
      return;
    }
    
    const sampleItems = [
      // Luxury Cars
      {
        itemId: 'CAR-BUGATTI-CHIRON-001',
        itemName: 'Bugatti Chiron',
        itemType: 'cars',
        category: 'hypercar',
        brand: 'Bugatti',
        model: 'Chiron',
        year: 2023,
        specifications: {
          engine: '8.0L Quad-Turbo W16',
          horsepower: 1479,
          acceleration: '2.4 seconds (0-60 mph)',
          topSpeed: 261,
          passengers: 2,
          doors: 2,
          features: ['Carbon Fiber Body', 'Active Aerodynamics', 'Luxury Interior', 'Premium Sound System']
        },
        media: {
          primaryImage: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
              caption: 'Bugatti Chiron - Front View',
              category: 'exterior'
            }
          ]
        },
        pricing: {
          basePrice: 15000,
          currency: 'USD',
          securityDeposit: 50000,
          minimumRental: { days: 1 }
        },
        location: {
          primaryLocation: 'dubai',
          availableLocations: ['dubai', 'washington-dc']
        },
        seo: {
          featured: true,
          featuredOrder: 1,
          keywords: ['bugatti', 'chiron', 'hypercar', 'luxury', 'supercar']
        }
      },
      
      // Luxury Yacht
      {
        itemId: 'YACHT-AZIMUT-GRANDE-001',
        itemName: 'Azimut Grande 35M',
        itemType: 'yachts',
        category: 'superyacht',
        brand: 'Azimut',
        model: 'Grande 35M',
        year: 2022,
        specifications: {
          length: 115,
          passengers: 12,
          crew: 6,
          cruisingSpeed: 22,
          maxSpeed: 28,
          features: ['Luxury Cabins', 'Jacuzzi', 'Water Sports Equipment', 'Gourmet Kitchen']
        },
        media: {
          primaryImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
              caption: 'Azimut Grande 35M - Marina View',
              category: 'exterior'
            }
          ]
        },
        pricing: {
          basePrice: 25000,
          currency: 'USD',
          securityDeposit: 100000,
          minimumRental: { days: 1 }
        },
        location: {
          primaryLocation: 'dubai',
          availableLocations: ['dubai']
        },
        serviceRequirements: {
          captainRequired: true,
          specialLicenseRequired: 'Yacht Captain License'
        },
        seo: {
          featured: true,
          featuredOrder: 2,
          keywords: ['azimut', 'yacht', 'superyacht', 'luxury', 'charter']
        }
      },
      
      // Private Jet
      {
        itemId: 'JET-GULFSTREAM-G700-001',
        itemName: 'Gulfstream G700',
        itemType: 'jets',
        category: 'ultra-long-range',
        brand: 'Gulfstream',
        model: 'G700',
        year: 2023,
        specifications: {
          passengers: 19,
          crew: 4,
          range: 7500,
          cruisingSpeed: 516,
          maxSpeed: 590,
          features: ['Ultra-Quiet Cabin', 'Full Kitchen', 'Master Suite', 'High-Speed WiFi']
        },
        media: {
          primaryImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85',
              caption: 'Gulfstream G700 - Tarmac View',
              category: 'exterior'
            }
          ]
        },
        pricing: {
          basePrice: 35000,
          currency: 'USD',
          securityDeposit: 150000,
          minimumRental: { days: 1 }
        },
        location: {
          primaryLocation: 'washington-dc',
          availableLocations: ['washington-dc', 'houston', 'atlanta']
        },
        serviceRequirements: {
          pilotRequired: true,
          specialLicenseRequired: 'Commercial Pilot License'
        },
        seo: {
          featured: true,
          featuredOrder: 3,
          keywords: ['gulfstream', 'g700', 'private jet', 'luxury', 'charter']
        }
      }
    ];
    
    const createdItems = [];
    
    for (const itemData of sampleItems) {
      const item = new Inventory(itemData);
      await item.save();
      createdItems.push(item);
      
      logMigrationEvent('inventory_item_created', { 
        itemId: item.itemId,
        itemName: item.itemName,
        id: item._id 
      }, 'info');
    }
    
    logMigrationEvent('sample_inventory_created', { 
      count: createdItems.length 
    }, 'info');
    
    return createdItems;
    
  } catch (error) {
    logMigrationEvent('sample_inventory_creation_failed', { 
      error: error.message 
    }, 'error');
    throw error;
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    logMigrationEvent('indexes_creation_started', {}, 'info');
    
    // User indexes
    await User.createIndexes();
    logMigrationEvent('user_indexes_created', {}, 'info');
    
    // Inventory indexes
    await Inventory.createIndexes();
    logMigrationEvent('inventory_indexes_created', {}, 'info');
    
    // Booking indexes
    await Booking.createIndexes();
    logMigrationEvent('booking_indexes_created', {}, 'info');
    
    logMigrationEvent('indexes_creation_completed', {}, 'info');
    
  } catch (error) {
    logMigrationEvent('indexes_creation_failed', { 
      error: error.message 
    }, 'error');
    throw error;
  }
};

// Main migration function
const runMigration = async () => {
  try {
    logMigrationEvent('migration_started', MIGRATION_CONFIG, 'info');
    
    // Connect to database
    await connectToDatabase();
    logMigrationEvent('database_connected', {}, 'info');
    
    // Create indexes
    await createIndexes();
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Create concierge users
    const conciergeUsers = await createConciergeUsers();
    
    // Create sample inventory
    const inventoryItems = await createSampleInventory();
    
    logMigrationEvent('migration_completed', {
      adminUser: adminUser._id,
      conciergeUsers: conciergeUsers.length,
      inventoryItems: inventoryItems?.length || 0
    }, 'info');
    
    return {
      success: true,
      migration: MIGRATION_CONFIG,
      results: {
        adminUser: adminUser._id,
        conciergeUsers: conciergeUsers.length,
        inventoryItems: inventoryItems?.length || 0
      }
    };
    
  } catch (error) {
    logMigrationEvent('migration_failed', { 
      error: error.message,
      stack: error.stack 
    }, 'error');
    
    throw error;
  }
};

// Rollback function
const rollbackMigration = async () => {
  try {
    logMigrationEvent('rollback_started', MIGRATION_CONFIG, 'warning');
    
    // Connect to database
    await connectToDatabase();
    
    // Remove sample data (be careful in production!)
    if (process.env.NODE_ENV !== 'production') {
      await User.deleteMany({ email: { $regex: '@midasthelifestyle.com$' } });
      await Inventory.deleteMany({});
      await Booking.deleteMany({});
      
      logMigrationEvent('rollback_completed', {}, 'warning');
    } else {
      logMigrationEvent('rollback_skipped_production', {}, 'warning');
    }
    
  } catch (error) {
    logMigrationEvent('rollback_failed', { 
      error: error.message 
    }, 'error');
    throw error;
  }
};

// Export migration functions
module.exports = {
  runMigration,
  rollbackMigration,
  config: MIGRATION_CONFIG
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then((result) => {
      console.log('Migration completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
