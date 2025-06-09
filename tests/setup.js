// Test Setup Configuration for Midas The Lifestyle
// Global test configuration and utilities

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Global test configuration
global.testConfig = {
  timeout: 30000,
  retries: 3,
  verbose: true
};

// MongoDB Memory Server instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Increase timeout for database operations
  jest.setTimeout(30000);
  
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0'
    },
    instance: {
      dbName: 'midas-test'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log('Test database connected successfully');
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Test database cleanup completed');
});

// Clear database between tests
beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  // Generate test user data
  generateTestUser: (overrides = {}) => ({
    firstName: 'John',
    lastName: 'Doe',
    email: `test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '+1234567890',
    role: 'customer',
    serviceProfile: {
      tier: 'standard',
      preferredLocations: ['Washington DC'],
      preferredVehicleTypes: ['cars']
    },
    ...overrides
  }),
  
  // Generate test inventory item
  generateTestInventory: (overrides = {}) => ({
    itemId: `TEST-${Date.now()}`,
    itemName: 'Test Luxury Car',
    itemType: 'cars',
    category: 'luxury',
    brand: 'Ferrari',
    model: 'F8 Tributo',
    year: 2023,
    description: 'Test luxury vehicle',
    specifications: {
      engine: 'V8 Twin Turbo',
      horsepower: 710,
      topSpeed: '211 mph',
      acceleration: '2.9 seconds'
    },
    pricing: {
      basePrice: 1500,
      currency: 'USD',
      minimumRental: {
        days: 1,
        hours: 4
      }
    },
    location: {
      primaryLocation: 'Washington DC',
      availableLocations: ['Washington DC', 'Maryland', 'Virginia']
    },
    availability: {
      isAvailable: true,
      blackoutDates: []
    },
    condition: {
      overall: 'excellent',
      lastInspection: new Date(),
      nextInspection: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    media: {
      primaryImage: 'https://example.com/test-image.jpg',
      images: ['https://example.com/test-image.jpg'],
      videos: []
    },
    seo: {
      featured: false,
      tags: ['luxury', 'sports-car', 'ferrari']
    },
    status: 'available',
    ...overrides
  }),
  
  // Generate test booking data
  generateTestBooking: (customerId, itemId, overrides = {}) => ({
    customer: customerId,
    item: {
      itemId: itemId || `TEST-ITEM-${Date.now()}`,
      itemName: 'Test Luxury Car',
      itemType: 'cars',
      category: 'luxury',
      brand: 'Ferrari',
      model: 'F8 Tributo',
      year: 2023
    },
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    location: {
      pickup: {
        address: '123 Test Street',
        city: 'Washington',
        state: 'DC',
        zipCode: '20001'
      },
      dropoff: {
        address: '123 Test Street',
        city: 'Washington',
        state: 'DC',
        zipCode: '20001'
      }
    },
    pricing: {
      basePrice: 1500,
      serviceTier: 'premium',
      serviceTierMultiplier: 1.3,
      seasonalMultiplier: 1.0,
      subtotal: 1950,
      addOns: [],
      addOnsTotal: 0,
      serviceFee: 97.5,
      insurance: 150,
      taxes: 156,
      securityDeposit: 5000,
      total: 2353.5,
      currency: 'USD'
    },
    payment: {
      method: 'pending',
      status: 'pending'
    },
    status: 'pending-payment',
    source: 'test',
    ...overrides
  }),
  
  // Generate JWT token for testing
  generateTestToken: (userId, role = 'customer') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        id: userId, 
        role: role,
        email: `test.${Date.now()}@example.com`
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock external services
  mockStripe: () => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method'
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 235350
      })
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_123',
        status: 'succeeded',
        amount: 235350
      })
    }
  }),
  
  mockEmailService: () => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    })
  }),
  
  mockGoogleCalendar: () => ({
    events: {
      insert: jest.fn().mockResolvedValue({
        data: {
          id: 'test-event-id',
          summary: 'Test Event'
        }
      }),
      update: jest.fn().mockResolvedValue({
        data: {
          id: 'test-event-id',
          summary: 'Updated Test Event'
        }
      }),
      delete: jest.fn().mockResolvedValue({
        data: {}
      }),
      list: jest.fn().mockResolvedValue({
        data: {
          items: []
        }
      })
    },
    calendars: {
      insert: jest.fn().mockResolvedValue({
        data: {
          id: 'test-calendar-id',
          summary: 'Test Calendar'
        }
      })
    },
    calendarList: {
      list: jest.fn().mockResolvedValue({
        data: {
          items: []
        }
      })
    }
  })
};

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'test-private-key';
process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID = 'test-client-id';

// Suppress console logs during testing unless verbose
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

console.log('Test setup completed successfully');
