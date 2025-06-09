// Integration Tests for Booking Management API
// Tests complete booking lifecycle and management operations

const request = require('supertest');
const User = require('../../../database/models/User');
const Booking = require('../../../database/models/Booking');
const Inventory = require('../../../database/models/Inventory');

// Mock the Netlify function handler
const { handler: bookingHandler } = require('../../../netlify/functions/booking-management');

// Helper function to simulate Netlify function calls
const callNetlifyFunction = async (handler, httpMethod, body = null, headers = {}, queryStringParameters = {}, path = '') => {
  const event = {
    httpMethod,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
    path: path || '/booking-management'
  };

  const context = {};
  
  return await handler(event, context);
};

describe('Booking Management API Integration Tests', () => {
  let testCustomer;
  let testAdmin;
  let testConcierge;
  let testInventory;
  let customerToken;
  let adminToken;
  let conciergeToken;

  beforeEach(async () => {
    // Create test users
    testCustomer = new User(global.testUtils.generateTestUser({
      email: 'customer@test.com',
      role: 'customer'
    }));
    await testCustomer.save();

    testAdmin = new User(global.testUtils.generateTestUser({
      email: 'admin@test.com',
      role: 'admin'
    }));
    await testAdmin.save();

    testConcierge = new User(global.testUtils.generateTestUser({
      email: 'concierge@test.com',
      role: 'concierge'
    }));
    await testConcierge.save();

    // Create test inventory
    testInventory = new Inventory(global.testUtils.generateTestInventory());
    await testInventory.save();

    // Generate tokens
    customerToken = global.testUtils.generateTestToken(testCustomer._id, 'customer');
    adminToken = global.testUtils.generateTestToken(testAdmin._id, 'admin');
    conciergeToken = global.testUtils.generateTestToken(testConcierge._id, 'concierge');
  });

  describe('POST /booking-management (Create Booking)', () => {
    test('should create booking for authenticated customer', async () => {
      const bookingData = {
        itemId: testInventory.itemId,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        pickupLocation: {
          address: '123 Test Street',
          city: 'Washington',
          state: 'DC',
          zipCode: '20001'
        },
        dropoffLocation: {
          address: '123 Test Street',
          city: 'Washington',
          state: 'DC',
          zipCode: '20001'
        },
        serviceTier: 'premium',
        specialRequests: ['Airport pickup', 'VIP service']
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking).toBeDefined();
      expect(responseBody.booking.bookingId).toMatch(/^MID-/);
      expect(responseBody.booking.status).toBe('pending-payment');
      expect(responseBody.booking.item.itemId).toBe(testInventory.itemId);
      expect(responseBody.booking.pricing.total).toBeGreaterThan(0);

      // Verify booking was created in database
      const createdBooking = await Booking.findOne({ 
        bookingId: responseBody.booking.bookingId 
      });
      expect(createdBooking).toBeTruthy();
      expect(createdBooking.customer.toString()).toBe(testCustomer._id.toString());
    });

    test('should create guest booking without authentication', async () => {
      const guestBookingData = {
        itemId: testInventory.itemId,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@example.com',
        phone: '+1234567890',
        pickupLocation: {
          address: '123 Test Street',
          city: 'Washington',
          state: 'DC',
          zipCode: '20001'
        }
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        guestBookingData
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.guestDetails).toBeDefined();
      expect(responseBody.booking.guestDetails.email).toBe('guest@example.com');
      expect(responseBody.booking.guestDetails.isGuest).toBe(true);
    });

    test('should reject booking with invalid item ID', async () => {
      const bookingData = {
        itemId: 'INVALID-ITEM-ID',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Item not found');
    });

    test('should reject booking with invalid date range', async () => {
      const bookingData = {
        itemId: testInventory.itemId,
        startDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Later date
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()    // Earlier date
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors).toContain('End date must be after start date');
    });

    test('should reject booking when item is unavailable', async () => {
      // Create conflicting booking
      const existingBooking = new Booking(global.testUtils.generateTestBooking(
        testCustomer._id,
        testInventory.itemId,
        { status: 'confirmed' }
      ));
      await existingBooking.save();

      const bookingData = {
        itemId: testInventory.itemId,
        startDate: existingBooking.startDate.toISOString(),
        endDate: existingBooking.endDate.toISOString()
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(409);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Item not available');
    });

    test('should calculate correct pricing for different service tiers', async () => {
      const bookingData = {
        itemId: testInventory.itemId,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        serviceTier: 'vvip'
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(201);
      expect(responseBody.booking.pricing.serviceTier).toBe('vvip');
      expect(responseBody.booking.pricing.serviceTierMultiplier).toBe(1.8);
      expect(responseBody.booking.pricing.total).toBeGreaterThan(
        testInventory.pricing.basePrice
      );
    });
  });

  describe('GET /booking-management (Retrieve Bookings)', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = new Booking(global.testUtils.generateTestBooking(
        testCustomer._id,
        testInventory.itemId
      ));
      await testBooking.save();
    });

    test('should retrieve specific booking by ID for customer', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking).toBeDefined();
      expect(responseBody.booking.bookingId).toBe(testBooking.bookingId);
      expect(responseBody.booking.customer._id).toBe(testCustomer._id.toString());
    });

    test('should deny access to other customer\'s booking', async () => {
      const otherCustomer = new User(global.testUtils.generateTestUser({
        email: 'other@test.com'
      }));
      await otherCustomer.save();
      
      const otherToken = global.testUtils.generateTestToken(otherCustomer._id, 'customer');

      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${otherToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Access denied');
    });

    test('should allow admin to access any booking', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.bookingId).toBe(testBooking.bookingId);
    });

    test('should search bookings with filters (admin only)', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${adminToken}` },
        {
          action: 'search',
          status: 'pending-payment',
          limit: '10',
          offset: '0'
        }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.bookings).toBeDefined();
      expect(responseBody.pagination).toBeDefined();
      expect(responseBody.pagination.total).toBeGreaterThanOrEqual(0);
    });

    test('should get customer\'s own bookings', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${customerToken}` },
        { action: 'my-bookings' }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.bookings).toBeDefined();
      expect(responseBody.bookings.length).toBeGreaterThan(0);
      expect(responseBody.bookings[0].customer).toBe(testCustomer._id.toString());
    });

    test('should deny search access to customers', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${customerToken}` },
        { action: 'search' }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Staff access required');
    });
  });

  describe('PUT /booking-management (Update Booking)', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = new Booking(global.testUtils.generateTestBooking(
        testCustomer._id,
        testInventory.itemId
      ));
      await testBooking.save();
    });

    test('should update booking status by admin', async () => {
      const updateData = {
        action: 'status',
        status: 'confirmed',
        reason: 'Payment verified'
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        updateData,
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.status).toBe('confirmed');

      // Verify in database
      const updatedBooking = await Booking.findOne({ 
        bookingId: testBooking.bookingId 
      });
      expect(updatedBooking.status).toBe('confirmed');
      expect(updatedBooking.modifications).toHaveLength(1);
    });

    test('should update booking fields by customer', async () => {
      const updateData = {
        serviceDetails: {
          specialRequests: ['Updated request']
        },
        location: {
          pickup: {
            address: 'Updated Address',
            city: 'Washington',
            state: 'DC',
            zipCode: '20001'
          }
        }
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        updateData,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.serviceDetails.specialRequests).toContain('Updated request');
    });

    test('should reject invalid status transition', async () => {
      const updateData = {
        action: 'status',
        status: 'completed', // Invalid transition from pending-payment
        reason: 'Invalid transition'
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        updateData,
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('failed');
    });

    test('should deny update access to other customers', async () => {
      const otherCustomer = new User(global.testUtils.generateTestUser({
        email: 'other@test.com'
      }));
      await otherCustomer.save();
      
      const otherToken = global.testUtils.generateTestToken(otherCustomer._id, 'customer');

      const updateData = {
        serviceDetails: {
          specialRequests: ['Unauthorized update']
        }
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        updateData,
        { authorization: `Bearer ${otherToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Access denied');
    });
  });

  describe('DELETE /booking-management (Cancel Booking)', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = new Booking(global.testUtils.generateTestBooking(
        testCustomer._id,
        testInventory.itemId,
        {
          status: 'confirmed',
          startDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
        }
      ));
      await testBooking.save();
    });

    test('should cancel booking by customer', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'DELETE',
        null,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.status).toBe('cancelled');
      expect(responseBody.refund).toBeDefined();
      expect(responseBody.refund.amount).toBeGreaterThan(0);

      // Verify in database
      const cancelledBooking = await Booking.findOne({ 
        bookingId: testBooking.bookingId 
      });
      expect(cancelledBooking.status).toBe('cancelled');
    });

    test('should cancel booking by admin', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'DELETE',
        null,
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.booking.status).toBe('cancelled');
    });

    test('should reject cancellation too close to start date', async () => {
      // Update booking to start in 1 hour (too close to cancel)
      testBooking.startDate = new Date(Date.now() + 60 * 60 * 1000);
      await testBooking.save();

      const response = await callNetlifyFunction(
        bookingHandler,
        'DELETE',
        null,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('cannot be cancelled');
    });

    test('should deny cancellation access to other customers', async () => {
      const otherCustomer = new User(global.testUtils.generateTestUser({
        email: 'other@test.com'
      }));
      await otherCustomer.save();
      
      const otherToken = global.testUtils.generateTestToken(otherCustomer._id, 'customer');

      const response = await callNetlifyFunction(
        bookingHandler,
        'DELETE',
        null,
        { authorization: `Bearer ${otherToken}` },
        {},
        `/booking-management/${testBooking.bookingId}`
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Access denied');
    });
  });

  describe('Authentication and Authorization', () => {
    test('should require authentication for protected endpoints', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        {}, // No authorization header
        { action: 'my-bookings' }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Authentication required');
    });

    test('should reject invalid tokens', async () => {
      const response = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: 'Bearer invalid-token' },
        { action: 'my-bookings' }
      );

      const responseBody = JSON.parse(response.body);

      expect(response.statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
    });

    test('should handle CORS preflight requests', async () => {
      const response = await callNetlifyFunction(bookingHandler, 'OPTIONS');

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('DELETE');
    });
  });
});
