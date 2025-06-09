// End-to-End Tests for Complete Booking Flow
// Tests the entire booking process from availability check to completion

const User = require('../../database/models/User');
const Booking = require('../../database/models/Booking');
const Inventory = require('../../database/models/Inventory');

// Import API handlers
const { handler: authRegisterHandler } = require('../../netlify/functions/auth-register');
const { handler: authLoginHandler } = require('../../netlify/functions/auth-login');
const { handler: availabilityHandler } = require('../../netlify/functions/availability-check');
const { handler: bookingHandler } = require('../../netlify/functions/booking-management');
const { handler: statusSchedulerHandler } = require('../../netlify/functions/booking-status-scheduler');

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
    path: path || '/'
  };

  const context = {};
  
  return await handler(event, context);
};

describe('End-to-End Booking Flow Tests', () => {
  let testInventory;
  let customerData;
  let customerToken;
  let adminToken;

  beforeEach(async () => {
    // Create test inventory
    testInventory = new Inventory(global.testUtils.generateTestInventory({
      itemId: 'E2E-TEST-CAR-001',
      itemName: 'Ferrari F8 Tributo - E2E Test',
      pricing: {
        basePrice: 2000,
        currency: 'USD',
        minimumRental: {
          days: 1,
          hours: 4
        }
      }
    }));
    await testInventory.save();

    // Create admin user for testing
    const adminUser = new User(global.testUtils.generateTestUser({
      email: 'admin.e2e@test.com',
      role: 'admin'
    }));
    await adminUser.save();
    adminToken = global.testUtils.generateTestToken(adminUser._id, 'admin');

    // Prepare customer data for registration
    customerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer.e2e@test.com',
      password: 'SecurePassword123!',
      phone: '+1234567890',
      role: 'customer'
    };
  });

  describe('Complete Customer Booking Journey', () => {
    test('should complete full booking flow: registration → availability check → booking → status updates → completion', async () => {
      // Step 1: Customer Registration
      console.log('Step 1: Customer Registration');
      const registrationResponse = await callNetlifyFunction(
        authRegisterHandler,
        'POST',
        customerData
      );

      expect(registrationResponse.statusCode).toBe(201);
      const registrationBody = JSON.parse(registrationResponse.body);
      expect(registrationBody.success).toBe(true);
      expect(registrationBody.token).toBeDefined();
      
      customerToken = registrationBody.token;
      const customerId = registrationBody.user._id;

      // Step 2: Customer Login (verify authentication works)
      console.log('Step 2: Customer Login Verification');
      const loginResponse = await callNetlifyFunction(
        authLoginHandler,
        'POST',
        {
          email: customerData.email,
          password: customerData.password
        }
      );

      expect(loginResponse.statusCode).toBe(200);
      const loginBody = JSON.parse(loginResponse.body);
      expect(loginBody.success).toBe(true);
      expect(loginBody.token).toBeDefined();

      // Step 3: Check Availability
      console.log('Step 3: Availability Check');
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const availabilityResponse = await callNetlifyFunction(
        availabilityHandler,
        'GET',
        null,
        {},
        {
          itemId: testInventory.itemId,
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString()
        }
      );

      expect(availabilityResponse.statusCode).toBe(200);
      const availabilityBody = JSON.parse(availabilityResponse.body);
      expect(availabilityBody.success).toBe(true);
      expect(availabilityBody.available).toBe(true);
      expect(availabilityBody.pricing).toBeDefined();

      // Step 4: Create Booking
      console.log('Step 4: Create Booking');
      const bookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        pickupLocation: {
          address: '123 Luxury Lane',
          city: 'Washington',
          state: 'DC',
          zipCode: '20001'
        },
        dropoffLocation: {
          address: '123 Luxury Lane',
          city: 'Washington',
          state: 'DC',
          zipCode: '20001'
        },
        serviceTier: 'premium',
        specialRequests: ['Airport pickup', 'VIP service'],
        addOns: []
      };

      const bookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      expect(bookingResponse.statusCode).toBe(201);
      const bookingBody = JSON.parse(bookingResponse.body);
      expect(bookingBody.success).toBe(true);
      expect(bookingBody.booking).toBeDefined();
      expect(bookingBody.booking.status).toBe('pending-payment');
      
      const bookingId = bookingBody.booking.bookingId;

      // Step 5: Simulate Payment Processing (Admin updates status)
      console.log('Step 5: Payment Processing');
      const paymentProcessingResponse = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'payment-processing',
          reason: 'Payment initiated by customer'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      expect(paymentProcessingResponse.statusCode).toBe(200);
      const paymentProcessingBody = JSON.parse(paymentProcessingResponse.body);
      expect(paymentProcessingBody.booking.status).toBe('payment-processing');

      // Step 6: Confirm Payment (Admin updates status)
      console.log('Step 6: Payment Confirmation');
      const paymentConfirmResponse = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'confirmed',
          reason: 'Payment confirmed via Stripe'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      expect(paymentConfirmResponse.statusCode).toBe(200);
      const paymentConfirmBody = JSON.parse(paymentConfirmResponse.body);
      expect(paymentConfirmBody.booking.status).toBe('confirmed');

      // Step 7: Verify Booking Details
      console.log('Step 7: Verify Booking Details');
      const bookingDetailsResponse = await callNetlifyFunction(
        bookingHandler,
        'GET',
        null,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      expect(bookingDetailsResponse.statusCode).toBe(200);
      const bookingDetailsBody = JSON.parse(bookingDetailsResponse.body);
      expect(bookingDetailsBody.booking.status).toBe('confirmed');
      expect(bookingDetailsBody.booking.customer._id).toBe(customerId);
      expect(bookingDetailsBody.booking.item.itemId).toBe(testInventory.itemId);

      // Step 8: Progress Through Service Statuses
      console.log('Step 8: Service Status Progression');
      const serviceStatuses = ['preparing', 'ready-for-pickup', 'in-progress'];

      for (const status of serviceStatuses) {
        const statusResponse = await callNetlifyFunction(
          bookingHandler,
          'PUT',
          {
            action: 'status',
            status: status,
            reason: `Service progressed to ${status}`
          },
          { authorization: `Bearer ${adminToken}` },
          {},
          `/booking-management/${bookingId}`
        );

        expect(statusResponse.statusCode).toBe(200);
        const statusBody = JSON.parse(statusResponse.body);
        expect(statusBody.booking.status).toBe(status);
      }

      // Step 9: Complete Booking
      console.log('Step 9: Complete Booking');
      const completionResponse = await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'completed',
          reason: 'Service completed successfully'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      expect(completionResponse.statusCode).toBe(200);
      const completionBody = JSON.parse(completionResponse.body);
      expect(completionBody.booking.status).toBe('completed');

      // Step 10: Verify Customer Metrics Updated
      console.log('Step 10: Verify Customer Metrics');
      const updatedCustomer = await User.findById(customerId);
      expect(updatedCustomer.totalBookings).toBeGreaterThan(0);
      expect(updatedCustomer.totalSpent).toBeGreaterThan(0);

      // Step 11: Verify Final Booking State
      console.log('Step 11: Final Verification');
      const finalBooking = await Booking.findOne({ bookingId });
      expect(finalBooking.status).toBe('completed');
      expect(finalBooking.modifications.length).toBeGreaterThan(0);
      expect(finalBooking.customer.toString()).toBe(customerId);

      console.log('✅ Complete booking flow test passed successfully!');
    });

    test('should handle booking cancellation flow', async () => {
      // Register customer
      const registrationResponse = await callNetlifyFunction(
        authRegisterHandler,
        'POST',
        customerData
      );
      customerToken = JSON.parse(registrationResponse.body).token;

      // Create booking
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours ahead for cancellation
      const dayAfter = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const bookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        serviceTier: 'standard'
      };

      const bookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        bookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      const bookingId = JSON.parse(bookingResponse.body).booking.bookingId;

      // Confirm booking
      await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'payment-processing',
          reason: 'Payment processing'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'confirmed',
          reason: 'Payment confirmed'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      // Cancel booking
      const cancellationResponse = await callNetlifyFunction(
        bookingHandler,
        'DELETE',
        null,
        { authorization: `Bearer ${customerToken}` },
        {},
        `/booking-management/${bookingId}`
      );

      expect(cancellationResponse.statusCode).toBe(200);
      const cancellationBody = JSON.parse(cancellationResponse.body);
      expect(cancellationBody.success).toBe(true);
      expect(cancellationBody.booking.status).toBe('cancelled');
      expect(cancellationBody.refund).toBeDefined();
      expect(cancellationBody.refund.amount).toBeGreaterThan(0);

      // Verify cancellation in database
      const cancelledBooking = await Booking.findOne({ bookingId });
      expect(cancelledBooking.status).toBe('cancelled');
      expect(cancelledBooking.cancellation).toBeDefined();
      expect(cancelledBooking.cancellation.refundAmount).toBeGreaterThan(0);
    });

    test('should handle guest booking flow', async () => {
      // Check availability (no auth required)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const availabilityResponse = await callNetlifyFunction(
        availabilityHandler,
        'GET',
        null,
        {},
        {
          itemId: testInventory.itemId,
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString()
        }
      );

      expect(availabilityResponse.statusCode).toBe(200);

      // Create guest booking
      const guestBookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        firstName: 'Guest',
        lastName: 'Customer',
        email: 'guest.customer@example.com',
        phone: '+1987654321',
        serviceTier: 'standard'
      };

      const guestBookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        guestBookingData
        // No authorization header for guest booking
      );

      expect(guestBookingResponse.statusCode).toBe(201);
      const guestBookingBody = JSON.parse(guestBookingResponse.body);
      expect(guestBookingBody.success).toBe(true);
      expect(guestBookingBody.booking.guestDetails).toBeDefined();
      expect(guestBookingBody.booking.guestDetails.isGuest).toBe(true);
      expect(guestBookingBody.booking.guestDetails.email).toBe('guest.customer@example.com');
      expect(guestBookingBody.booking.customer).toBeNull();

      // Verify guest booking in database
      const guestBooking = await Booking.findOne({ 
        bookingId: guestBookingBody.booking.bookingId 
      });
      expect(guestBooking.guestDetails.isGuest).toBe(true);
      expect(guestBooking.customer).toBeNull();
    });
  });

  describe('Booking Conflict and Validation Tests', () => {
    test('should prevent double booking conflicts', async () => {
      // Register customer
      const registrationResponse = await callNetlifyFunction(
        authRegisterHandler,
        'POST',
        customerData
      );
      customerToken = JSON.parse(registrationResponse.body).token;

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Create first booking
      const firstBookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        serviceTier: 'standard'
      };

      const firstBookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        firstBookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      expect(firstBookingResponse.statusCode).toBe(201);
      const firstBookingId = JSON.parse(firstBookingResponse.body).booking.bookingId;

      // Confirm first booking
      await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'payment-processing',
          reason: 'Payment processing'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${firstBookingId}`
      );

      await callNetlifyFunction(
        bookingHandler,
        'PUT',
        {
          action: 'status',
          status: 'confirmed',
          reason: 'Payment confirmed'
        },
        { authorization: `Bearer ${adminToken}` },
        {},
        `/booking-management/${firstBookingId}`
      );

      // Try to create conflicting booking
      const conflictingBookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        serviceTier: 'premium'
      };

      const conflictingBookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        conflictingBookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      expect(conflictingBookingResponse.statusCode).toBe(409);
      const conflictingBody = JSON.parse(conflictingBookingResponse.body);
      expect(conflictingBody.success).toBe(false);
      expect(conflictingBody.error).toContain('Item not available');
    });

    test('should validate minimum rental periods', async () => {
      // Set minimum rental to 3 days
      testInventory.pricing.minimumRental.days = 3;
      await testInventory.save();

      // Register customer
      const registrationResponse = await callNetlifyFunction(
        authRegisterHandler,
        'POST',
        customerData
      );
      customerToken = JSON.parse(registrationResponse.body).token;

      // Try to book for only 1 day (less than minimum)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000); // Only 1 day

      const shortBookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        serviceTier: 'standard'
      };

      const shortBookingResponse = await callNetlifyFunction(
        bookingHandler,
        'POST',
        shortBookingData,
        { authorization: `Bearer ${customerToken}` }
      );

      expect(shortBookingResponse.statusCode).toBe(409);
      const shortBookingBody = JSON.parse(shortBookingResponse.body);
      expect(shortBookingBody.success).toBe(false);
      expect(shortBookingBody.code).toBe('MINIMUM_RENTAL_NOT_MET');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async () => {
      // This test would simulate network failures and verify graceful degradation
      // For now, we'll test basic error handling
      
      const invalidBookingData = {
        itemId: 'INVALID-ITEM-ID',
        startDate: 'invalid-date',
        endDate: 'invalid-date'
      };

      const response = await callNetlifyFunction(
        bookingHandler,
        'POST',
        invalidBookingData
      );

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
    });

    test('should handle concurrent booking attempts', async () => {
      // Register customer
      const registrationResponse = await callNetlifyFunction(
        authRegisterHandler,
        'POST',
        customerData
      );
      customerToken = JSON.parse(registrationResponse.body).token;

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const bookingData = {
        itemId: testInventory.itemId,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        serviceTier: 'standard'
      };

      // Simulate concurrent booking attempts
      const concurrentBookings = [
        callNetlifyFunction(bookingHandler, 'POST', bookingData, { authorization: `Bearer ${customerToken}` }),
        callNetlifyFunction(bookingHandler, 'POST', bookingData, { authorization: `Bearer ${customerToken}` }),
        callNetlifyFunction(bookingHandler, 'POST', bookingData, { authorization: `Bearer ${customerToken}` })
      ];

      const results = await Promise.allSettled(concurrentBookings);
      
      // Only one should succeed
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.statusCode === 201
      );
      const failed = results.filter(r => 
        r.status === 'fulfilled' && r.value.statusCode !== 201
      );

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });
  });
});
