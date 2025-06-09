// Unit Tests for Availability Service
// Tests real-time availability checking and conflict detection

const mongoose = require('mongoose');
const {
  checkAvailability,
  checkMultipleAvailability,
  getAvailabilityCalendar,
  createTemporaryReservation,
  checkBookingConflicts,
  validateBookingDates,
  AVAILABILITY_CONFIG
} = require('../../../services/availabilityService');

const Inventory = require('../../../database/models/Inventory');
const Booking = require('../../../database/models/Booking');
const User = require('../../../database/models/User');

describe('Availability Service', () => {
  let testUser;
  let testInventory;
  let testBooking;

  beforeEach(async () => {
    // Create test user
    testUser = new User(global.testUtils.generateTestUser());
    await testUser.save();

    // Create test inventory
    testInventory = new Inventory(global.testUtils.generateTestInventory());
    await testInventory.save();
  });

  describe('validateBookingDates', () => {
    test('should validate correct date range', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const errors = validateBookingDates(tomorrow, dayAfter, 'cars');
      expect(errors).toHaveLength(0);
    });

    test('should reject end date before start date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const errors = validateBookingDates(tomorrow, today, 'cars');
      expect(errors).toContain('End date must be after start date');
    });

    test('should reject booking too close to start time', () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      const errors = validateBookingDates(now, oneHourLater, 'cars');
      expect(errors.some(error => error.includes('Minimum'))).toBe(true);
    });

    test('should reject booking too far in advance', () => {
      const farFuture = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000); // 400 days
      const evenFarther = new Date(Date.now() + 401 * 24 * 60 * 60 * 1000);
      
      const errors = validateBookingDates(farFuture, evenFarther, 'cars');
      expect(errors.some(error => error.includes('Cannot book more than'))).toBe(true);
    });

    test('should apply different minimum notice for different item types', () => {
      const soon = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const later = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Cars require 2 hours minimum notice
      const carErrors = validateBookingDates(soon, later, 'cars');
      expect(carErrors.some(error => error.includes('Minimum 2 hours'))).toBe(true);
      
      // Yachts require 24 hours minimum notice
      const yachtErrors = validateBookingDates(soon, later, 'yachts');
      expect(yachtErrors.some(error => error.includes('Minimum 24 hours'))).toBe(true);
    });
  });

  describe('checkBookingConflicts', () => {
    beforeEach(async () => {
      // Create a confirmed booking for conflict testing
      const bookingData = global.testUtils.generateTestBooking(testUser._id, testInventory.itemId);
      testBooking = new Booking(bookingData);
      testBooking.status = 'confirmed';
      await testBooking.save();
    });

    test('should detect conflicts with existing bookings', async () => {
      const conflicts = await checkBookingConflicts(
        testInventory.itemId,
        testBooking.startDate,
        testBooking.endDate
      );
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].bookingId).toBe(testBooking.bookingId);
    });

    test('should not detect conflicts with cancelled bookings', async () => {
      testBooking.status = 'cancelled';
      await testBooking.save();
      
      const conflicts = await checkBookingConflicts(
        testInventory.itemId,
        testBooking.startDate,
        testBooking.endDate
      );
      
      expect(conflicts).toHaveLength(0);
    });

    test('should exclude specified booking from conflict check', async () => {
      const conflicts = await checkBookingConflicts(
        testInventory.itemId,
        testBooking.startDate,
        testBooking.endDate,
        testBooking._id
      );
      
      expect(conflicts).toHaveLength(0);
    });

    test('should consider buffer times in conflict detection', async () => {
      const bufferHours = AVAILABILITY_CONFIG.bufferTimes.cars;
      const bufferMs = bufferHours * 60 * 60 * 1000;
      
      // Try to book just after the existing booking ends
      const newStart = new Date(testBooking.endDate.getTime() + 30 * 60 * 1000); // 30 min after
      const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      const conflicts = await checkBookingConflicts(
        testInventory.itemId,
        newStart,
        newEnd
      );
      
      // Should detect conflict due to buffer time
      expect(conflicts).toHaveLength(1);
    });
  });

  describe('checkAvailability', () => {
    test('should return available for valid booking request', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const result = await checkAvailability(
        testInventory.itemId,
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.itemId).toBe(testInventory.itemId);
      expect(result.pricing).toBeDefined();
    });

    test('should return unavailable for non-existent item', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const result = await checkAvailability(
        'NON-EXISTENT-ITEM',
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toBe(false);
      expect(result.code).toBe('ITEM_NOT_FOUND');
    });

    test('should return unavailable for inactive item', async () => {
      testInventory.isAvailable = false;
      await testInventory.save();
      
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const result = await checkAvailability(
        testInventory.itemId,
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toBe(false);
      expect(result.code).toBe('ITEM_INACTIVE');
    });

    test('should return unavailable during blackout periods', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      // Add blackout period covering the requested dates
      testInventory.availability.blackoutDates.push({
        startDate: tomorrow,
        endDate: dayAfter,
        reason: 'Maintenance'
      });
      await testInventory.save();
      
      const result = await checkAvailability(
        testInventory.itemId,
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toBe(false);
      expect(result.code).toBe('BLACKOUT_PERIOD');
      expect(result.blackoutReason).toBe('Maintenance');
    });

    test('should return unavailable for booking shorter than minimum rental', async () => {
      // Set minimum rental to 3 days
      testInventory.pricing.minimumRental.days = 3;
      await testInventory.save();
      
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000); // Only 1 day
      
      const result = await checkAvailability(
        testInventory.itemId,
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toBe(false);
      expect(result.code).toBe('MINIMUM_RENTAL_NOT_MET');
      expect(result.minimumDays).toBe(3);
    });

    test('should return unavailable when conflicts exist', async () => {
      // Create conflicting booking
      const bookingData = global.testUtils.generateTestBooking(testUser._id, testInventory.itemId);
      const conflictingBooking = new Booking(bookingData);
      conflictingBooking.status = 'confirmed';
      await conflictingBooking.save();
      
      const result = await checkAvailability(
        testInventory.itemId,
        conflictingBooking.startDate,
        conflictingBooking.endDate
      );
      
      expect(result.available).toBe(false);
      expect(result.code).toBe('BOOKING_CONFLICT');
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('checkMultipleAvailability', () => {
    let secondInventory;

    beforeEach(async () => {
      secondInventory = new Inventory(global.testUtils.generateTestInventory({
        itemId: 'TEST-ITEM-2',
        itemName: 'Test Luxury Yacht'
      }));
      await secondInventory.save();
    });

    test('should check availability for multiple items', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const result = await checkMultipleAvailability(
        [testInventory.itemId, secondInventory.itemId],
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toHaveLength(2);
      expect(result.unavailable).toHaveLength(0);
      expect(result.summary.total).toBe(2);
      expect(result.summary.available).toBe(2);
      expect(result.summary.unavailable).toBe(0);
    });

    test('should handle mixed availability results', async () => {
      // Make second inventory unavailable
      secondInventory.isAvailable = false;
      await secondInventory.save();
      
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const result = await checkMultipleAvailability(
        [testInventory.itemId, secondInventory.itemId],
        tomorrow,
        dayAfter
      );
      
      expect(result.available).toHaveLength(1);
      expect(result.unavailable).toHaveLength(1);
      expect(result.summary.available).toBe(1);
      expect(result.summary.unavailable).toBe(1);
    });
  });

  describe('getAvailabilityCalendar', () => {
    beforeEach(async () => {
      // Create test booking
      const bookingData = global.testUtils.generateTestBooking(testUser._id, testInventory.itemId);
      testBooking = new Booking(bookingData);
      testBooking.status = 'confirmed';
      await testBooking.save();
      
      // Add blackout period
      testInventory.availability.blackoutDates.push({
        startDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 96 * 60 * 60 * 1000),
        reason: 'Maintenance'
      });
      await testInventory.save();
    });

    test('should return calendar with bookings and blackout dates', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const calendar = await getAvailabilityCalendar(
        testInventory.itemId,
        startDate,
        endDate
      );
      
      expect(calendar.itemId).toBe(testInventory.itemId);
      expect(calendar.itemName).toBe(testInventory.itemName);
      expect(calendar.bookings).toHaveLength(1);
      expect(calendar.blackoutDates).toHaveLength(1);
      expect(calendar.bufferTime).toBe(AVAILABILITY_CONFIG.bufferTimes.cars);
      
      // Check booking data
      expect(calendar.bookings[0].bookingId).toBe(testBooking.bookingId);
      expect(calendar.bookings[0].type).toBe('booking');
      
      // Check blackout data
      expect(calendar.blackoutDates[0].reason).toBe('Maintenance');
      expect(calendar.blackoutDates[0].type).toBe('blackout');
    });

    test('should return error for non-existent item', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await expect(getAvailabilityCalendar(
        'NON-EXISTENT-ITEM',
        startDate,
        endDate
      )).rejects.toThrow('Item not found');
    });
  });

  describe('createTemporaryReservation', () => {
    test('should create temporary reservation for available item', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const reservation = await createTemporaryReservation(
        testInventory.itemId,
        tomorrow,
        dayAfter,
        testUser._id,
        15
      );
      
      expect(reservation.reservationId).toMatch(/^TEMP-/);
      expect(reservation.expiresAt).toBeInstanceOf(Date);
      expect(reservation.item.itemId).toBe(testInventory.itemId);
      expect(reservation.pricing).toBeDefined();
      
      // Verify temporary booking was created
      const tempBooking = await Booking.findOne({ 
        bookingId: reservation.reservationId 
      });
      expect(tempBooking).toBeTruthy();
      expect(tempBooking.isTemporary).toBe(true);
      expect(tempBooking.status).toBe('temporary-hold');
    });

    test('should reject temporary reservation for unavailable item', async () => {
      testInventory.isAvailable = false;
      await testInventory.save();
      
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      await expect(createTemporaryReservation(
        testInventory.itemId,
        tomorrow,
        dayAfter,
        testUser._id,
        15
      )).rejects.toThrow('Item not available');
    });

    test('should set correct expiration time', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const durationMinutes = 10;
      
      const reservation = await createTemporaryReservation(
        testInventory.itemId,
        tomorrow,
        dayAfter,
        testUser._id,
        durationMinutes
      );
      
      const expectedExpiration = new Date(Date.now() + durationMinutes * 60 * 1000);
      const timeDiff = Math.abs(reservation.expiresAt - expectedExpiration);
      
      // Allow 1 second tolerance for execution time
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('AVAILABILITY_CONFIG', () => {
    test('should have correct buffer times for all item types', () => {
      expect(AVAILABILITY_CONFIG.bufferTimes.cars).toBe(2);
      expect(AVAILABILITY_CONFIG.bufferTimes.yachts).toBe(4);
      expect(AVAILABILITY_CONFIG.bufferTimes.jets).toBe(6);
      expect(AVAILABILITY_CONFIG.bufferTimes.properties).toBe(12);
    });

    test('should have correct minimum notice periods', () => {
      expect(AVAILABILITY_CONFIG.minimumNotice.cars).toBe(2);
      expect(AVAILABILITY_CONFIG.minimumNotice.yachts).toBe(24);
      expect(AVAILABILITY_CONFIG.minimumNotice.jets).toBe(48);
      expect(AVAILABILITY_CONFIG.minimumNotice.properties).toBe(72);
    });

    test('should have correct maximum advance booking periods', () => {
      expect(AVAILABILITY_CONFIG.maxAdvanceBooking.cars).toBe(365);
      expect(AVAILABILITY_CONFIG.maxAdvanceBooking.yachts).toBe(730);
      expect(AVAILABILITY_CONFIG.maxAdvanceBooking.jets).toBe(365);
      expect(AVAILABILITY_CONFIG.maxAdvanceBooking.properties).toBe(1095);
    });
  });
});
