// Performance Tests for Midas The Lifestyle APIs
// Tests response times, throughput, and scalability

const User = require('../../database/models/User');
const Booking = require('../../database/models/Booking');
const Inventory = require('../../database/models/Inventory');

// Import API handlers
const { handler: availabilityHandler } = require('../../netlify/functions/availability-check');
const { handler: bookingHandler } = require('../../netlify/functions/booking-management');
const { handler: adminDashboardHandler } = require('../../netlify/functions/admin-dashboard');

// Helper function to simulate Netlify function calls
const callNetlifyFunction = async (handler, httpMethod, body = null, headers = {}, queryStringParameters = {}, path = '') => {
  const startTime = process.hrtime.bigint();
  
  const event = {
    httpMethod,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
    path: path || '/'
  };

  const context = {};
  
  try {
    const result = await handler(event, context);
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      ...result,
      responseTime
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000;
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      responseTime
    };
  }
};

// Performance test utilities
const performanceUtils = {
  // Measure average response time over multiple requests
  measureAverageResponseTime: async (testFunction, iterations = 10) => {
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await testFunction();
      responseTimes.push(result.responseTime);
    }
    
    return {
      average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      median: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)],
      p95: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)]
    };
  },

  // Test concurrent requests
  measureConcurrentPerformance: async (testFunction, concurrency = 5, iterations = 10) => {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const promises = Array(concurrency).fill().map(() => testFunction());
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    const responseTimes = results.map(r => r.responseTime);
    const successCount = results.filter(r => r.statusCode < 400).length;
    
    return {
      totalRequests: results.length,
      successCount,
      successRate: (successCount / results.length) * 100,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes)
    };
  },

  // Memory usage monitoring
  measureMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }
};

describe('API Performance Tests', () => {
  let testUser;
  let testAdmin;
  let testInventory;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // Create test data
    testUser = new User(global.testUtils.generateTestUser({
      email: 'perf.customer@test.com'
    }));
    await testUser.save();

    testAdmin = new User(global.testUtils.generateTestUser({
      email: 'perf.admin@test.com',
      role: 'admin'
    }));
    await testAdmin.save();

    testInventory = new Inventory(global.testUtils.generateTestInventory({
      itemId: 'PERF-TEST-001'
    }));
    await testInventory.save();

    userToken = global.testUtils.generateTestToken(testUser._id, 'customer');
    adminToken = global.testUtils.generateTestToken(testAdmin._id, 'admin');

    // Create some test bookings for realistic data
    for (let i = 0; i < 10; i++) {
      const booking = new Booking(global.testUtils.generateTestBooking(
        testUser._id,
        testInventory.itemId,
        {
          startDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000)
        }
      ));
      await booking.save();
    }
  });

  describe('Availability Check Performance', () => {
    test('should respond to availability checks within 500ms', async () => {
      const testFunction = async () => {
        return await callNetlifyFunction(
          availabilityHandler,
          'GET',
          null,
          {},
          {
            itemId: testInventory.itemId,
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 20);

      expect(performance.average).toBeLessThan(500); // 500ms average
      expect(performance.p95).toBeLessThan(1000); // 95th percentile under 1s
      expect(performance.max).toBeLessThan(2000); // Max under 2s

      console.log('Availability Check Performance:', performance);
    });

    test('should handle concurrent availability checks efficiently', async () => {
      const testFunction = async () => {
        return await callNetlifyFunction(
          availabilityHandler,
          'GET',
          null,
          {},
          {
            itemId: testInventory.itemId,
            startDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000).toISOString()
          }
        );
      };

      const performance = await performanceUtils.measureConcurrentPerformance(testFunction, 10, 5);

      expect(performance.successRate).toBeGreaterThan(95); // 95% success rate
      expect(performance.averageResponseTime).toBeLessThan(1000); // 1s average under load

      console.log('Concurrent Availability Check Performance:', performance);
    });

    test('should handle multiple item availability checks efficiently', async () => {
      // Create additional inventory items
      const additionalItems = [];
      for (let i = 0; i < 5; i++) {
        const item = new Inventory(global.testUtils.generateTestInventory({
          itemId: `PERF-MULTI-${i}`
        }));
        await item.save();
        additionalItems.push(item);
      }

      const testFunction = async () => {
        const itemIds = additionalItems.map(item => item.itemId).join(',');
        return await callNetlifyFunction(
          availabilityHandler,
          'GET',
          null,
          {},
          {
            action: 'multiple',
            itemIds,
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 10);

      expect(performance.average).toBeLessThan(1000); // 1s average for multiple items
      expect(performance.p95).toBeLessThan(2000); // 95th percentile under 2s

      console.log('Multiple Item Availability Performance:', performance);
    });
  });

  describe('Booking Management Performance', () => {
    test('should create bookings within 1 second', async () => {
      const testFunction = async () => {
        const bookingData = {
          itemId: testInventory.itemId,
          startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000).toISOString(),
          serviceTier: 'standard'
        };

        return await callNetlifyFunction(
          bookingHandler,
          'POST',
          bookingData,
          { authorization: `Bearer ${userToken}` }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 10);

      expect(performance.average).toBeLessThan(1000); // 1s average
      expect(performance.p95).toBeLessThan(2000); // 95th percentile under 2s

      console.log('Booking Creation Performance:', performance);
    });

    test('should retrieve booking details within 300ms', async () => {
      // Create a test booking first
      const booking = new Booking(global.testUtils.generateTestBooking(
        testUser._id,
        testInventory.itemId
      ));
      await booking.save();

      const testFunction = async () => {
        return await callNetlifyFunction(
          bookingHandler,
          'GET',
          null,
          { authorization: `Bearer ${userToken}` },
          {},
          `/booking-management/${booking.bookingId}`
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 20);

      expect(performance.average).toBeLessThan(300); // 300ms average
      expect(performance.p95).toBeLessThan(500); // 95th percentile under 500ms

      console.log('Booking Retrieval Performance:', performance);
    });

    test('should handle booking searches efficiently', async () => {
      const testFunction = async () => {
        return await callNetlifyFunction(
          bookingHandler,
          'GET',
          null,
          { authorization: `Bearer ${adminToken}` },
          {
            action: 'search',
            status: 'pending-payment,confirmed',
            limit: '20',
            offset: '0'
          }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 15);

      expect(performance.average).toBeLessThan(800); // 800ms average for search
      expect(performance.p95).toBeLessThan(1500); // 95th percentile under 1.5s

      console.log('Booking Search Performance:', performance);
    });
  });

  describe('Admin Dashboard Performance', () => {
    test('should load dashboard overview within 1 second', async () => {
      const testFunction = async () => {
        return await callNetlifyFunction(
          adminDashboardHandler,
          'GET',
          null,
          { authorization: `Bearer ${adminToken}` },
          { action: 'overview', dateRange: '30' }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 10);

      expect(performance.average).toBeLessThan(1000); // 1s average
      expect(performance.p95).toBeLessThan(2000); // 95th percentile under 2s

      console.log('Dashboard Overview Performance:', performance);
    });

    test('should load real-time metrics within 500ms', async () => {
      const testFunction = async () => {
        return await callNetlifyFunction(
          adminDashboardHandler,
          'GET',
          null,
          { authorization: `Bearer ${adminToken}` },
          { action: 'realtime' }
        );
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 15);

      expect(performance.average).toBeLessThan(500); // 500ms average
      expect(performance.p95).toBeLessThan(1000); // 95th percentile under 1s

      console.log('Real-time Metrics Performance:', performance);
    });

    test('should handle concurrent dashboard requests', async () => {
      const testFunction = async () => {
        const actions = ['overview', 'realtime', 'inventory-analytics', 'customer-analytics'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        return await callNetlifyFunction(
          adminDashboardHandler,
          'GET',
          null,
          { authorization: `Bearer ${adminToken}` },
          { action: randomAction, dateRange: '30' }
        );
      };

      const performance = await performanceUtils.measureConcurrentPerformance(testFunction, 8, 5);

      expect(performance.successRate).toBeGreaterThan(90); // 90% success rate under load
      expect(performance.averageResponseTime).toBeLessThan(2000); // 2s average under load

      console.log('Concurrent Dashboard Performance:', performance);
    });
  });

  describe('Database Performance', () => {
    test('should maintain efficient database queries', async () => {
      const initialMemory = performanceUtils.measureMemoryUsage();

      // Perform multiple database operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          User.findById(testUser._id),
          Booking.find({ customer: testUser._id }).limit(10),
          Inventory.findOne({ itemId: testInventory.itemId })
        );
      }

      const startTime = process.hrtime.bigint();
      await Promise.all(operations);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const finalMemory = performanceUtils.measureMemoryUsage();

      expect(totalTime).toBeLessThan(5000); // All operations under 5s
      expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(50); // Memory increase under 50MB

      console.log('Database Operations Performance:', {
        totalTime: `${totalTime}ms`,
        memoryIncrease: `${finalMemory.heapUsed - initialMemory.heapUsed}MB`,
        operationsCount: operations.length
      });
    });

    test('should handle large result sets efficiently', async () => {
      // Create additional test data
      const bulkBookings = [];
      for (let i = 0; i < 100; i++) {
        bulkBookings.push(global.testUtils.generateTestBooking(
          testUser._id,
          testInventory.itemId,
          {
            startDate: new Date(Date.now() + (i + 100) * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + (i + 101) * 24 * 60 * 60 * 1000)
          }
        ));
      }
      await Booking.insertMany(bulkBookings);

      const testFunction = async () => {
        const startTime = process.hrtime.bigint();
        
        const result = await Booking.find({ customer: testUser._id })
          .sort({ createdAt: -1 })
          .limit(50);
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        
        return { responseTime, resultCount: result.length };
      };

      const performance = await performanceUtils.measureAverageResponseTime(testFunction, 10);

      expect(performance.average).toBeLessThan(200); // 200ms average for large queries
      expect(performance.p95).toBeLessThan(500); // 95th percentile under 500ms

      console.log('Large Result Set Performance:', performance);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should maintain stable memory usage under load', async () => {
      const initialMemory = performanceUtils.measureMemoryUsage();
      
      // Simulate sustained load
      const loadTest = async () => {
        const promises = [];
        for (let i = 0; i < 20; i++) {
          promises.push(
            callNetlifyFunction(
              availabilityHandler,
              'GET',
              null,
              {},
              {
                itemId: testInventory.itemId,
                startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
              }
            )
          );
        }
        await Promise.all(promises);
      };

      // Run load test multiple times
      for (let i = 0; i < 5; i++) {
        await loadTest();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = performanceUtils.measureMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(100); // Memory increase under 100MB

      console.log('Memory Usage Test:', {
        initial: initialMemory,
        final: finalMemory,
        increase: `${memoryIncrease}MB`
      });
    });

    test('should handle error conditions without memory leaks', async () => {
      const initialMemory = performanceUtils.measureMemoryUsage();

      // Generate errors intentionally
      const errorTests = [];
      for (let i = 0; i < 50; i++) {
        errorTests.push(
          callNetlifyFunction(
            bookingHandler,
            'GET',
            null,
            { authorization: 'Bearer invalid-token' },
            {},
            '/booking-management/INVALID-BOOKING-ID'
          )
        );
      }

      await Promise.allSettled(errorTests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performanceUtils.measureMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(20); // Memory increase under 20MB for error handling

      console.log('Error Handling Memory Test:', {
        initial: initialMemory,
        final: finalMemory,
        increase: `${memoryIncrease}MB`
      });
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Booking.deleteMany({ customer: testUser._id });
    await User.deleteMany({ _id: { $in: [testUser._id, testAdmin._id] } });
    await Inventory.deleteMany({ itemId: { $regex: /^PERF-/ } });
  });
});
