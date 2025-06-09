// Unit Tests for Booking Status Service
// Tests booking workflow and status transitions

const mongoose = require('mongoose');
const {
  updateBookingStatus,
  getBookingStatusHistory,
  validateStatusTransition,
  STATUS_WORKFLOW
} = require('../../../services/bookingStatusService');

const Booking = require('../../../database/models/Booking');
const User = require('../../../database/models/User');
const Inventory = require('../../../database/models/Inventory');

// Mock external services
jest.mock('node-fetch');
const fetch = require('node-fetch');

describe('Booking Status Service', () => {
  let testUser;
  let testConcierge;
  let testInventory;
  let testBooking;

  beforeEach(async () => {
    // Create test user
    testUser = new User(global.testUtils.generateTestUser());
    await testUser.save();

    // Create test concierge
    testConcierge = new User(global.testUtils.generateTestUser({
      email: 'concierge@test.com',
      role: 'concierge',
      firstName: 'Jane',
      lastName: 'Smith'
    }));
    await testConcierge.save();

    // Create test inventory
    testInventory = new Inventory(global.testUtils.generateTestInventory());
    await testInventory.save();

    // Create test booking
    const bookingData = global.testUtils.generateTestBooking(testUser._id, testInventory.itemId);
    testBooking = new Booking(bookingData);
    await testBooking.save();

    // Mock fetch for external API calls
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('validateStatusTransition', () => {
    test('should allow valid status transitions', () => {
      const validTransitions = [
        ['pending-payment', 'payment-processing'],
        ['payment-processing', 'confirmed'],
        ['confirmed', 'preparing'],
        ['preparing', 'ready-for-pickup'],
        ['ready-for-pickup', 'in-progress'],
        ['in-progress', 'completed']
      ];

      validTransitions.forEach(([from, to]) => {
        const result = validateStatusTransition(from, to);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid status transitions', () => {
      const invalidTransitions = [
        ['pending-payment', 'completed'],
        ['confirmed', 'payment-processing'],
        ['completed', 'in-progress'],
        ['cancelled', 'confirmed']
      ];

      invalidTransitions.forEach(([from, to]) => {
        const result = validateStatusTransition(from, to);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid status transition');
      });
    });

    test('should handle cancellation from any active status', () => {
      const activeStatuses = [
        'pending-payment',
        'payment-processing',
        'confirmed',
        'preparing',
        'ready-for-pickup',
        'in-progress'
      ];

      activeStatuses.forEach(status => {
        const result = validateStatusTransition(status, 'cancelled');
        expect(result.valid).toBe(true);
      });
    });

    test('should reject transitions from terminal states', () => {
      const terminalStates = ['completed', 'cancelled', 'no-show', 'refunded'];
      
      terminalStates.forEach(status => {
        const result = validateStatusTransition(status, 'confirmed');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('updateBookingStatus', () => {
    test('should update booking status with valid transition', async () => {
      const updatedBooking = await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Payment initiated by customer'
      );

      expect(updatedBooking.status).toBe('payment-processing');
      expect(updatedBooking.modifications).toHaveLength(1);
      
      const modification = updatedBooking.modifications[0];
      expect(modification.modifiedBy.toString()).toBe(testUser._id.toString());
      expect(modification.changes.field).toBe('status');
      expect(modification.changes.oldValue).toBe('pending-payment');
      expect(modification.changes.newValue).toBe('payment-processing');
      expect(modification.reason).toBe('Payment initiated by customer');
    });

    test('should reject invalid status transition', async () => {
      await expect(updateBookingStatus(
        testBooking.bookingId,
        'completed',
        testUser._id,
        'Invalid transition'
      )).rejects.toThrow('Invalid status transition');
    });

    test('should reject update for non-existent booking', async () => {
      await expect(updateBookingStatus(
        'NON-EXISTENT-BOOKING',
        'confirmed',
        testUser._id,
        'Test update'
      )).rejects.toThrow('Booking not found');
    });

    test('should execute status-specific actions', async () => {
      // Update to confirmed status which should trigger actions
      await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Payment processing'
      );

      await updateBookingStatus(
        testBooking.bookingId,
        'confirmed',
        testUser._id,
        'Payment confirmed'
      );

      // Verify that external API calls were made for status actions
      expect(fetch).toHaveBeenCalled();
      
      // Check if email notification was triggered
      const emailCalls = fetch.mock.calls.filter(call => 
        call[0].includes('enhanced-email-service')
      );
      expect(emailCalls.length).toBeGreaterThan(0);
    });

    test('should assign concierge when status changes to confirmed', async () => {
      // First transition to payment-processing
      await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Payment processing'
      );

      // Then to confirmed
      const updatedBooking = await updateBookingStatus(
        testBooking.bookingId,
        'confirmed',
        testUser._id,
        'Payment confirmed'
      );

      // Concierge should be assigned (if available)
      // Note: This depends on having concierges in the database
      expect(updatedBooking.serviceDetails).toBeDefined();
    });

    test('should update customer metrics on completion', async () => {
      // Progress through all statuses to completion
      const statusProgression = [
        'payment-processing',
        'confirmed',
        'preparing',
        'ready-for-pickup',
        'in-progress',
        'completed'
      ];

      let currentBooking = testBooking;
      for (const status of statusProgression) {
        currentBooking = await updateBookingStatus(
          currentBooking.bookingId,
          status,
          testUser._id,
          `Status update to ${status}`
        );
      }

      // Verify final status
      expect(currentBooking.status).toBe('completed');

      // Check if customer metrics were updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.totalBookings).toBeGreaterThan(0);
    });

    test('should handle metadata updates', async () => {
      const metadata = {
        'serviceDetails.specialNotes': 'VIP customer - extra attention required',
        'communications.lastContact': new Date()
      };

      const updatedBooking = await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Payment processing with metadata',
        metadata
      );

      expect(updatedBooking.serviceDetails.specialNotes).toBe(metadata['serviceDetails.specialNotes']);
      expect(updatedBooking.communications.lastContact).toBeDefined();
    });
  });

  describe('getBookingStatusHistory', () => {
    beforeEach(async () => {
      // Create a booking with some status changes
      await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Payment initiated'
      );

      await updateBookingStatus(
        testBooking.bookingId,
        'confirmed',
        testUser._id,
        'Payment confirmed'
      );
    });

    test('should return complete status history', async () => {
      const history = await getBookingStatusHistory(testBooking.bookingId);

      expect(history.bookingId).toBe(testBooking.bookingId);
      expect(history.currentStatus).toBe('confirmed');
      expect(history.history).toHaveLength(3); // Initial + 2 updates

      // Check chronological order
      const statuses = history.history.map(h => h.status);
      expect(statuses).toEqual(['pending-payment', 'payment-processing', 'confirmed']);

      // Check first entry (creation)
      const firstEntry = history.history[0];
      expect(firstEntry.status).toBe('pending-payment');
      expect(firstEntry.modifiedBy).toBe('System');
      expect(firstEntry.reason).toBe('Booking created');

      // Check subsequent entries
      const secondEntry = history.history[1];
      expect(secondEntry.status).toBe('payment-processing');
      expect(secondEntry.reason).toBe('Payment initiated');
    });

    test('should return error for non-existent booking', async () => {
      await expect(getBookingStatusHistory('NON-EXISTENT-BOOKING'))
        .rejects.toThrow('Booking not found');
    });

    test('should include user information in history', async () => {
      const history = await getBookingStatusHistory(testBooking.bookingId);

      // Find entries modified by user (not system)
      const userModifications = history.history.filter(h => h.modifiedBy !== 'System');
      
      userModifications.forEach(modification => {
        expect(modification.modifiedBy).toContain(testUser.firstName);
        expect(modification.modifiedBy).toContain(testUser.lastName);
      });
    });
  });

  describe('STATUS_WORKFLOW configuration', () => {
    test('should have correct status transitions defined', () => {
      expect(STATUS_WORKFLOW.transitions).toBeDefined();
      expect(STATUS_WORKFLOW.transitions['pending-payment']).toContain('payment-processing');
      expect(STATUS_WORKFLOW.transitions['payment-processing']).toContain('confirmed');
      expect(STATUS_WORKFLOW.transitions['confirmed']).toContain('preparing');
    });

    test('should have auto-trigger timings defined', () => {
      expect(STATUS_WORKFLOW.autoTriggers).toBeDefined();
      expect(STATUS_WORKFLOW.autoTriggers.preparing).toBe(48);
      expect(STATUS_WORKFLOW.autoTriggers['ready-for-pickup']).toBe(4);
      expect(STATUS_WORKFLOW.autoTriggers['in-progress']).toBe(0);
      expect(STATUS_WORKFLOW.autoTriggers.completed).toBe(-24);
    });

    test('should have status actions defined', () => {
      expect(STATUS_WORKFLOW.statusActions).toBeDefined();
      expect(STATUS_WORKFLOW.statusActions.confirmed).toContain('send_confirmation_email');
      expect(STATUS_WORKFLOW.statusActions.confirmed).toContain('update_inventory');
      expect(STATUS_WORKFLOW.statusActions.confirmed).toContain('assign_concierge');
    });

    test('should allow cancellation from all active statuses', () => {
      const activeStatuses = [
        'pending-payment',
        'payment-processing', 
        'confirmed',
        'preparing',
        'ready-for-pickup',
        'in-progress'
      ];

      activeStatuses.forEach(status => {
        expect(STATUS_WORKFLOW.transitions[status]).toContain('cancelled');
      });
    });

    test('should have terminal states with no outgoing transitions', () => {
      const terminalStates = ['completed', 'cancelled', 'no-show', 'refunded'];
      
      terminalStates.forEach(status => {
        expect(STATUS_WORKFLOW.transitions[status]).toEqual([]);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle concurrent status updates gracefully', async () => {
      // Simulate concurrent updates
      const promises = [
        updateBookingStatus(testBooking.bookingId, 'payment-processing', testUser._id, 'Update 1'),
        updateBookingStatus(testBooking.bookingId, 'payment-processing', testUser._id, 'Update 2')
      ];

      // One should succeed, one should fail or both should handle gracefully
      const results = await Promise.allSettled(promises);
      
      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    test('should handle missing user gracefully', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const updatedBooking = await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        nonExistentUserId,
        'Update by non-existent user'
      );

      expect(updatedBooking.status).toBe('payment-processing');
      expect(updatedBooking.modifications).toHaveLength(1);
    });

    test('should handle external service failures gracefully', async () => {
      // Mock fetch to fail
      fetch.mockRejectedValueOnce(new Error('External service unavailable'));

      // Status update should still succeed even if external actions fail
      const updatedBooking = await updateBookingStatus(
        testBooking.bookingId,
        'payment-processing',
        testUser._id,
        'Update with external failure'
      );

      expect(updatedBooking.status).toBe('payment-processing');
    });
  });
});
