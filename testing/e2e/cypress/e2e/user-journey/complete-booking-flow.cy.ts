// Complete Booking Flow E2E Test for Midas The Lifestyle
// Tests the entire user journey from registration to booking confirmation

describe('Complete Booking Flow - Luxury User Journey', () => {
  const testUser = {
    firstName: 'Alexander',
    lastName: 'Sterling',
    email: `test.user.${Date.now()}@midasthelifestyle.com`,
    password: 'LuxuryTest123!',
    phone: '+1 (555) 123-4567',
  };

  const testBooking = {
    vehicleType: 'Luxury Cars',
    vehicleName: 'Lamborghini Huracán',
    startDate: '2024-03-15',
    endDate: '2024-03-18',
    pickupLocation: 'Washington DC',
    serviceTier: 'Premium',
  };

  const testPayment = {
    cardNumber: '4242424242424242',
    expiryDate: '12/25',
    cvc: '123',
    name: 'Alexander Sterling',
    billingZip: '20001',
  };

  beforeEach(() => {
    // Set viewport for luxury desktop experience
    cy.viewport(1920, 1080);
    
    // Visit homepage
    cy.visit('/');
    
    // Ensure page loads completely
    cy.get('[data-testid="homepage-hero"]').should('be.visible');
    
    // Check for luxury branding
    cy.contains('MIDAS').should('be.visible');
    cy.get('[data-testid="luxury-navigation"]').should('be.visible');
  });

  it('should complete the entire luxury booking journey', () => {
    // Step 1: Homepage Interaction
    cy.log('🏠 Testing Homepage Experience');
    
    // Verify luxury design elements
    cy.get('[data-testid="hero-section"]')
      .should('be.visible')
      .and('contain', 'Luxury');
    
    // Check featured vehicles
    cy.get('[data-testid="featured-vehicles"]').should('be.visible');
    
    // Verify call-to-action buttons
    cy.get('[data-testid="browse-inventory-btn"]')
      .should('be.visible')
      .and('contain', 'Browse');

    // Step 2: User Registration
    cy.log('📝 Testing User Registration');
    
    // Navigate to registration
    cy.get('[data-testid="register-btn"]').click();
    cy.url().should('include', '/register');
    
    // Fill registration form
    cy.get('[data-testid="first-name-input"]')
      .type(testUser.firstName)
      .should('have.value', testUser.firstName);
    
    cy.get('[data-testid="last-name-input"]')
      .type(testUser.lastName)
      .should('have.value', testUser.lastName);
    
    cy.get('[data-testid="email-input"]')
      .type(testUser.email)
      .should('have.value', testUser.email);
    
    cy.get('[data-testid="phone-input"]')
      .type(testUser.phone)
      .should('have.value', testUser.phone);
    
    cy.get('[data-testid="password-input"]')
      .type(testUser.password);
    
    cy.get('[data-testid="confirm-password-input"]')
      .type(testUser.password);
    
    // Accept terms and conditions
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Submit registration
    cy.get('[data-testid="register-submit-btn"]').click();
    
    // Verify successful registration
    cy.get('[data-testid="registration-success"]')
      .should('be.visible')
      .and('contain', 'Welcome');
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
    cy.get('[data-testid="user-name"]').should('contain', testUser.firstName);

    // Step 3: Browse Inventory
    cy.log('🚗 Testing Inventory Browsing');
    
    // Navigate to inventory
    cy.get('[data-testid="inventory-nav"]').click();
    cy.url().should('include', '/inventory');
    
    // Verify inventory page loads
    cy.get('[data-testid="inventory-grid"]').should('be.visible');
    
    // Filter by vehicle type
    cy.get('[data-testid="category-filter"]').click();
    cy.get('[data-testid="category-luxury-cars"]').click();
    
    // Verify filtered results
    cy.get('[data-testid="vehicle-card"]').should('have.length.at.least', 1);
    
    // Search for specific vehicle
    cy.get('[data-testid="search-input"]')
      .type('Lamborghini')
      .should('have.value', 'Lamborghini');
    
    cy.get('[data-testid="search-btn"]').click();
    
    // Select vehicle
    cy.get('[data-testid="vehicle-card"]')
      .contains(testBooking.vehicleName)
      .click();
    
    // Verify vehicle details page
    cy.url().should('include', '/vehicle/');
    cy.get('[data-testid="vehicle-title"]')
      .should('contain', testBooking.vehicleName);
    
    // Check vehicle images and details
    cy.get('[data-testid="vehicle-gallery"]').should('be.visible');
    cy.get('[data-testid="vehicle-specifications"]').should('be.visible');
    cy.get('[data-testid="pricing-info"]').should('be.visible');

    // Step 4: Start Booking Process
    cy.log('📅 Testing Booking Initiation');
    
    // Click book now button
    cy.get('[data-testid="book-now-btn"]').click();
    
    // Verify booking flow starts
    cy.url().should('include', '/booking');
    cy.get('[data-testid="booking-stepper"]').should('be.visible');
    
    // Verify selected vehicle is displayed
    cy.get('[data-testid="selected-vehicle"]')
      .should('contain', testBooking.vehicleName);

    // Step 5: Date Selection
    cy.log('📅 Testing Date Selection');
    
    // Select start date
    cy.get('[data-testid="start-date-picker"]').click();
    cy.get(`[data-date="${testBooking.startDate}"]`).click();
    
    // Select end date
    cy.get('[data-testid="end-date-picker"]').click();
    cy.get(`[data-date="${testBooking.endDate}"]`).click();
    
    // Verify availability check
    cy.get('[data-testid="availability-status"]')
      .should('be.visible')
      .and('contain', 'Available');
    
    // Continue to next step
    cy.get('[data-testid="continue-btn"]').click();

    // Step 6: Location Details
    cy.log('📍 Testing Location Selection');
    
    // Select pickup location
    cy.get('[data-testid="pickup-location-select"]').click();
    cy.get('[data-testid="location-option"]')
      .contains(testBooking.pickupLocation)
      .click();
    
    // Verify location details
    cy.get('[data-testid="location-details"]').should('be.visible');
    
    // Continue to next step
    cy.get('[data-testid="continue-btn"]').click();

    // Step 7: Service Tier Selection
    cy.log('⭐ Testing Service Tier Selection');
    
    // Select service tier
    cy.get('[data-testid="service-tier-premium"]').click();
    
    // Verify tier benefits
    cy.get('[data-testid="tier-benefits"]')
      .should('be.visible')
      .and('contain', 'Premium');
    
    // Continue to next step
    cy.get('[data-testid="continue-btn"]').click();

    // Step 8: Add-ons Selection
    cy.log('➕ Testing Add-ons Selection');
    
    // Select add-ons
    cy.get('[data-testid="addon-chauffeur"]').check();
    cy.get('[data-testid="addon-insurance"]').check();
    
    // Verify pricing updates
    cy.get('[data-testid="total-price"]').should('be.visible');
    
    // Continue to next step
    cy.get('[data-testid="continue-btn"]').click();

    // Step 9: Review Booking
    cy.log('📋 Testing Booking Review');
    
    // Verify all booking details
    cy.get('[data-testid="booking-summary"]').should('be.visible');
    cy.get('[data-testid="summary-vehicle"]')
      .should('contain', testBooking.vehicleName);
    cy.get('[data-testid="summary-dates"]')
      .should('contain', testBooking.startDate);
    cy.get('[data-testid="summary-location"]')
      .should('contain', testBooking.pickupLocation);
    
    // Verify pricing breakdown
    cy.get('[data-testid="pricing-breakdown"]').should('be.visible');
    cy.get('[data-testid="total-amount"]').should('be.visible');
    
    // Continue to payment
    cy.get('[data-testid="proceed-to-payment-btn"]').click();

    // Step 10: Payment Processing
    cy.log('💳 Testing Payment Processing');
    
    // Verify payment form
    cy.get('[data-testid="payment-form"]').should('be.visible');
    
    // Fill payment details
    cy.get('[data-testid="card-number-input"]')
      .type(testPayment.cardNumber);
    
    cy.get('[data-testid="expiry-date-input"]')
      .type(testPayment.expiryDate);
    
    cy.get('[data-testid="cvc-input"]')
      .type(testPayment.cvc);
    
    cy.get('[data-testid="cardholder-name-input"]')
      .type(testPayment.name);
    
    cy.get('[data-testid="billing-zip-input"]')
      .type(testPayment.billingZip);
    
    // Verify secure payment indicators
    cy.get('[data-testid="secure-payment-badge"]').should('be.visible');
    cy.get('[data-testid="ssl-indicator"]').should('be.visible');
    
    // Submit payment
    cy.get('[data-testid="submit-payment-btn"]').click();
    
    // Wait for payment processing
    cy.get('[data-testid="payment-processing"]', { timeout: 30000 })
      .should('be.visible');

    // Step 11: Booking Confirmation
    cy.log('✅ Testing Booking Confirmation');
    
    // Verify successful booking
    cy.get('[data-testid="booking-confirmation"]', { timeout: 30000 })
      .should('be.visible');
    
    cy.get('[data-testid="confirmation-message"]')
      .should('contain', 'confirmed');
    
    // Verify booking details
    cy.get('[data-testid="booking-id"]').should('be.visible');
    cy.get('[data-testid="confirmation-vehicle"]')
      .should('contain', testBooking.vehicleName);
    
    // Verify next steps
    cy.get('[data-testid="next-steps"]').should('be.visible');
    
    // Check for confirmation email notice
    cy.get('[data-testid="email-confirmation-notice"]')
      .should('be.visible')
      .and('contain', testUser.email);

    // Step 12: Post-Booking Actions
    cy.log('📱 Testing Post-Booking Features');
    
    // Navigate to dashboard
    cy.get('[data-testid="view-dashboard-btn"]').click();
    cy.url().should('include', '/dashboard');
    
    // Verify booking appears in dashboard
    cy.get('[data-testid="recent-bookings"]').should('be.visible');
    cy.get('[data-testid="booking-card"]')
      .should('contain', testBooking.vehicleName);
    
    // Test booking details view
    cy.get('[data-testid="view-booking-details"]').first().click();
    cy.get('[data-testid="booking-details-modal"]').should('be.visible');
    
    // Verify all booking information
    cy.get('[data-testid="modal-vehicle-name"]')
      .should('contain', testBooking.vehicleName);
    cy.get('[data-testid="modal-booking-dates"]')
      .should('contain', testBooking.startDate);
    
    // Close modal
    cy.get('[data-testid="close-modal-btn"]').click();

    // Step 13: Performance Validation
    cy.log('⚡ Testing Performance Metrics');
    
    // Check page load performance
    cy.window().then((win) => {
      const performance = win.performance;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Verify load time is under threshold
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds
    });

    // Step 14: Accessibility Validation
    cy.log('♿ Testing Accessibility Compliance');
    
    // Check for accessibility violations
    cy.injectAxe();
    cy.checkA11y(null, {
      tags: ['wcag2a', 'wcag2aa'],
    });

    // Step 15: Visual Validation
    cy.log('👁️ Testing Visual Consistency');
    
    // Take screenshot for visual regression testing
    cy.screenshot('booking-confirmation-page', {
      capture: 'fullPage',
    });
    
    // Verify luxury design elements
    cy.get('[data-testid="luxury-branding"]').should('be.visible');
    cy.get('[data-testid="gold-accent-elements"]').should('be.visible');
  });

  it('should handle booking flow errors gracefully', () => {
    cy.log('🚨 Testing Error Handling');
    
    // Test with invalid payment information
    cy.visit('/booking');
    
    // Navigate through booking flow with invalid data
    cy.get('[data-testid="card-number-input"]')
      .type('4000000000000002'); // Declined card
    
    cy.get('[data-testid="submit-payment-btn"]').click();
    
    // Verify error handling
    cy.get('[data-testid="payment-error"]')
      .should('be.visible')
      .and('contain', 'declined');
    
    // Verify user can retry
    cy.get('[data-testid="retry-payment-btn"]').should('be.visible');
  });

  it('should work across different browsers', () => {
    cy.log('🌐 Testing Cross-Browser Compatibility');
    
    // This test would be run across different browsers
    // in the CI/CD pipeline with different browser configurations
    
    // Verify core functionality works
    cy.visit('/');
    cy.get('[data-testid="homepage-hero"]').should('be.visible');
    cy.get('[data-testid="browse-inventory-btn"]').should('be.visible');
    
    // Test responsive design
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu-btn"]').should('be.visible');
    
    cy.viewport(1920, 1080);
    cy.get('[data-testid="desktop-navigation"]').should('be.visible');
  });

  afterEach(() => {
    // Cleanup test data
    cy.task('clearDatabase');
    
    // Clear local storage
    cy.clearLocalStorage();
    cy.clearCookies();
  });
});
