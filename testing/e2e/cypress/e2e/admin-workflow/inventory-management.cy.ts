// Admin Inventory Management E2E Test for Midas The Lifestyle
// Tests comprehensive admin workflows for luxury vehicle inventory management

describe('Admin Inventory Management - Luxury Fleet Operations', () => {
  const adminUser = {
    email: 'admin@midasthelifestyle.com',
    password: 'AdminLuxury123!',
  };

  const testVehicle = {
    brand: 'Ferrari',
    model: 'F8 Tributo',
    year: '2024',
    category: 'Luxury Cars',
    basePrice: 2500,
    location: 'Washington DC',
    description: 'Experience the pinnacle of Italian automotive excellence with the Ferrari F8 Tributo.',
    specifications: {
      engine: '3.9L Twin-Turbo V8',
      horsepower: '710 HP',
      acceleration: '0-60 mph in 2.9 seconds',
      topSpeed: '211 mph',
      transmission: '7-Speed Dual-Clutch',
    },
    features: [
      'Carbon Fiber Interior',
      'Premium Sound System',
      'Advanced Driver Assistance',
      'Custom Leather Seats',
      'Performance Exhaust',
    ],
    images: [
      'ferrari-f8-front.jpg',
      'ferrari-f8-side.jpg',
      'ferrari-f8-interior.jpg',
      'ferrari-f8-rear.jpg',
    ],
  };

  beforeEach(() => {
    // Set viewport for admin desktop experience
    cy.viewport(1920, 1080);
    
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="admin-email-input"]').type(adminUser.email);
    cy.get('[data-testid="admin-password-input"]').type(adminUser.password);
    cy.get('[data-testid="admin-login-btn"]').click();
    
    // Verify admin dashboard loads
    cy.url().should('include', '/admin/dashboard');
    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    cy.get('[data-testid="admin-welcome"]').should('contain', 'Admin');
  });

  it('should manage complete inventory lifecycle', () => {
    // Step 1: Navigate to Inventory Management
    cy.log('🚗 Accessing Inventory Management');
    
    cy.get('[data-testid="inventory-nav"]').click();
    cy.url().should('include', '/admin/inventory');
    cy.get('[data-testid="inventory-management"]').should('be.visible');
    
    // Verify inventory overview
    cy.get('[data-testid="inventory-stats"]').should('be.visible');
    cy.get('[data-testid="total-vehicles"]').should('be.visible');
    cy.get('[data-testid="available-vehicles"]').should('be.visible');
    cy.get('[data-testid="booked-vehicles"]').should('be.visible');

    // Step 2: Add New Vehicle
    cy.log('➕ Adding New Luxury Vehicle');
    
    cy.get('[data-testid="add-vehicle-btn"]').click();
    cy.get('[data-testid="vehicle-form-modal"]').should('be.visible');
    
    // Fill basic information
    cy.get('[data-testid="vehicle-brand-input"]')
      .type(testVehicle.brand)
      .should('have.value', testVehicle.brand);
    
    cy.get('[data-testid="vehicle-model-input"]')
      .type(testVehicle.model)
      .should('have.value', testVehicle.model);
    
    cy.get('[data-testid="vehicle-year-select"]').click();
    cy.get(`[data-value="${testVehicle.year}"]`).click();
    
    cy.get('[data-testid="vehicle-category-select"]').click();
    cy.get(`[data-value="${testVehicle.category}"]`).click();
    
    cy.get('[data-testid="base-price-input"]')
      .clear()
      .type(testVehicle.basePrice.toString())
      .should('have.value', testVehicle.basePrice.toString());
    
    cy.get('[data-testid="location-select"]').click();
    cy.get(`[data-value="${testVehicle.location}"]`).click();
    
    // Fill description
    cy.get('[data-testid="vehicle-description-textarea"]')
      .type(testVehicle.description)
      .should('have.value', testVehicle.description);

    // Step 3: Add Specifications
    cy.log('⚙️ Adding Vehicle Specifications');
    
    cy.get('[data-testid="specifications-tab"]').click();
    
    Object.entries(testVehicle.specifications).forEach(([key, value]) => {
      cy.get(`[data-testid="spec-${key}-input"]`)
        .type(value)
        .should('have.value', value);
    });

    // Step 4: Add Features
    cy.log('✨ Adding Luxury Features');
    
    cy.get('[data-testid="features-tab"]').click();
    
    testVehicle.features.forEach((feature, index) => {
      cy.get('[data-testid="add-feature-btn"]').click();
      cy.get(`[data-testid="feature-input-${index}"]`)
        .type(feature)
        .should('have.value', feature);
    });

    // Step 5: Upload Images
    cy.log('📸 Uploading Vehicle Images');
    
    cy.get('[data-testid="images-tab"]').click();
    
    // Simulate image uploads
    testVehicle.images.forEach((image, index) => {
      cy.get('[data-testid="image-upload-dropzone"]').selectFile(
        `cypress/fixtures/images/${image}`,
        { action: 'drag-drop' }
      );
      
      // Verify image preview
      cy.get(`[data-testid="image-preview-${index}"]`).should('be.visible');
    });
    
    // Set primary image
    cy.get('[data-testid="set-primary-image-0"]').click();
    cy.get('[data-testid="primary-image-indicator"]').should('be.visible');

    // Step 6: Set Availability
    cy.log('📅 Configuring Availability');
    
    cy.get('[data-testid="availability-tab"]').click();
    
    // Set availability calendar
    cy.get('[data-testid="availability-calendar"]').should('be.visible');
    cy.get('[data-testid="set-available-all"]').click();
    
    // Configure blackout dates
    cy.get('[data-testid="add-blackout-btn"]').click();
    cy.get('[data-testid="blackout-start-date"]').type('2024-12-24');
    cy.get('[data-testid="blackout-end-date"]').type('2024-12-26');
    cy.get('[data-testid="blackout-reason"]').type('Holiday Maintenance');
    cy.get('[data-testid="save-blackout-btn"]').click();

    // Step 7: Save Vehicle
    cy.log('💾 Saving New Vehicle');
    
    cy.get('[data-testid="save-vehicle-btn"]').click();
    
    // Verify success message
    cy.get('[data-testid="success-notification"]')
      .should('be.visible')
      .and('contain', 'Vehicle added successfully');
    
    // Verify vehicle appears in inventory list
    cy.get('[data-testid="vehicle-list"]').should('contain', testVehicle.brand);
    cy.get('[data-testid="vehicle-list"]').should('contain', testVehicle.model);

    // Step 8: Edit Vehicle
    cy.log('✏️ Editing Vehicle Information');
    
    // Find and edit the newly created vehicle
    cy.get('[data-testid="vehicle-row"]')
      .contains(testVehicle.model)
      .parent()
      .find('[data-testid="edit-vehicle-btn"]')
      .click();
    
    // Update price
    const newPrice = testVehicle.basePrice + 500;
    cy.get('[data-testid="base-price-input"]')
      .clear()
      .type(newPrice.toString());
    
    // Add new feature
    cy.get('[data-testid="features-tab"]').click();
    cy.get('[data-testid="add-feature-btn"]').click();
    cy.get('[data-testid="feature-input-5"]').type('Premium Concierge Service');
    
    // Save changes
    cy.get('[data-testid="save-vehicle-btn"]').click();
    
    // Verify update success
    cy.get('[data-testid="success-notification"]')
      .should('be.visible')
      .and('contain', 'Vehicle updated successfully');

    // Step 9: Bulk Operations
    cy.log('📦 Testing Bulk Operations');
    
    // Select multiple vehicles
    cy.get('[data-testid="select-all-checkbox"]').check();
    cy.get('[data-testid="bulk-actions-menu"]').should('be.visible');
    
    // Test bulk price update
    cy.get('[data-testid="bulk-price-update"]').click();
    cy.get('[data-testid="bulk-price-modal"]').should('be.visible');
    cy.get('[data-testid="price-adjustment-type"]').select('percentage');
    cy.get('[data-testid="price-adjustment-value"]').type('10');
    cy.get('[data-testid="apply-bulk-price-btn"]').click();
    
    // Verify bulk update confirmation
    cy.get('[data-testid="bulk-update-confirmation"]')
      .should('be.visible')
      .and('contain', 'prices updated');

    // Step 10: Inventory Analytics
    cy.log('📊 Reviewing Inventory Analytics');
    
    cy.get('[data-testid="analytics-tab"]').click();
    
    // Verify analytics dashboard
    cy.get('[data-testid="inventory-analytics"]').should('be.visible');
    cy.get('[data-testid="utilization-chart"]').should('be.visible');
    cy.get('[data-testid="revenue-chart"]').should('be.visible');
    cy.get('[data-testid="popular-vehicles"]').should('be.visible');
    
    // Check performance metrics
    cy.get('[data-testid="avg-utilization"]').should('be.visible');
    cy.get('[data-testid="total-revenue"]').should('be.visible');
    cy.get('[data-testid="booking-conversion"]').should('be.visible');

    // Step 11: Export Inventory Data
    cy.log('📤 Exporting Inventory Data');
    
    cy.get('[data-testid="export-btn"]').click();
    cy.get('[data-testid="export-format-select"]').select('excel');
    cy.get('[data-testid="export-date-range"]').click();
    cy.get('[data-testid="date-range-last-30-days"]').click();
    cy.get('[data-testid="confirm-export-btn"]').click();
    
    // Verify export initiation
    cy.get('[data-testid="export-notification"]')
      .should('be.visible')
      .and('contain', 'Export started');

    // Step 12: Vehicle Status Management
    cy.log('🔄 Managing Vehicle Status');
    
    // Change vehicle status
    cy.get('[data-testid="vehicle-row"]')
      .contains(testVehicle.model)
      .parent()
      .find('[data-testid="status-dropdown"]')
      .click();
    
    cy.get('[data-testid="status-maintenance"]').click();
    
    // Add maintenance notes
    cy.get('[data-testid="maintenance-notes-modal"]').should('be.visible');
    cy.get('[data-testid="maintenance-reason"]').type('Scheduled maintenance');
    cy.get('[data-testid="estimated-completion"]').type('2024-02-15');
    cy.get('[data-testid="save-maintenance-btn"]').click();
    
    // Verify status change
    cy.get('[data-testid="vehicle-status"]').should('contain', 'Maintenance');

    // Step 13: Search and Filter Testing
    cy.log('🔍 Testing Search and Filter Functionality');
    
    // Test search functionality
    cy.get('[data-testid="inventory-search"]').type('Ferrari');
    cy.get('[data-testid="search-results"]').should('contain', testVehicle.brand);
    
    // Test category filter
    cy.get('[data-testid="category-filter"]').select('Luxury Cars');
    cy.get('[data-testid="filtered-results"]').should('be.visible');
    
    // Test location filter
    cy.get('[data-testid="location-filter"]').select('Washington DC');
    cy.get('[data-testid="filtered-results"]').should('contain', testVehicle.location);
    
    // Test availability filter
    cy.get('[data-testid="availability-filter"]').select('Available');
    cy.get('[data-testid="available-vehicles-only"]').should('be.visible');
    
    // Clear filters
    cy.get('[data-testid="clear-filters-btn"]').click();
    cy.get('[data-testid="all-vehicles"]').should('be.visible');

    // Step 14: Vehicle Performance Metrics
    cy.log('📈 Reviewing Vehicle Performance');
    
    // View individual vehicle performance
    cy.get('[data-testid="vehicle-row"]')
      .contains(testVehicle.model)
      .parent()
      .find('[data-testid="view-performance-btn"]')
      .click();
    
    cy.get('[data-testid="vehicle-performance-modal"]').should('be.visible');
    
    // Verify performance metrics
    cy.get('[data-testid="booking-count"]').should('be.visible');
    cy.get('[data-testid="revenue-generated"]').should('be.visible');
    cy.get('[data-testid="utilization-rate"]').should('be.visible');
    cy.get('[data-testid="customer-rating"]').should('be.visible');
    
    // Check booking history
    cy.get('[data-testid="booking-history-tab"]').click();
    cy.get('[data-testid="booking-history-list"]').should('be.visible');
    
    // Close performance modal
    cy.get('[data-testid="close-performance-modal"]').click();

    // Step 15: Inventory Validation
    cy.log('✅ Final Inventory Validation');
    
    // Verify inventory integrity
    cy.get('[data-testid="validate-inventory-btn"]').click();
    cy.get('[data-testid="validation-progress"]').should('be.visible');
    
    // Check validation results
    cy.get('[data-testid="validation-results"]', { timeout: 30000 })
      .should('be.visible');
    
    cy.get('[data-testid="validation-summary"]')
      .should('contain', 'validation complete');
    
    // Verify no critical issues
    cy.get('[data-testid="critical-issues"]').should('contain', '0');
  });

  it('should handle inventory errors gracefully', () => {
    cy.log('🚨 Testing Error Handling');
    
    // Test duplicate vehicle creation
    cy.get('[data-testid="add-vehicle-btn"]').click();
    cy.get('[data-testid="vehicle-brand-input"]').type('Ferrari');
    cy.get('[data-testid="vehicle-model-input"]').type('F8 Tributo');
    cy.get('[data-testid="save-vehicle-btn"]').click();
    
    // Verify duplicate error
    cy.get('[data-testid="error-notification"]')
      .should('be.visible')
      .and('contain', 'already exists');
    
    // Test invalid price input
    cy.get('[data-testid="base-price-input"]').clear().type('-100');
    cy.get('[data-testid="price-error"]')
      .should('be.visible')
      .and('contain', 'must be positive');
  });

  it('should maintain data consistency across operations', () => {
    cy.log('🔄 Testing Data Consistency');
    
    // Verify inventory counts
    cy.get('[data-testid="total-vehicles"]').then(($total) => {
      const totalCount = parseInt($total.text());
      
      // Add a vehicle
      cy.get('[data-testid="add-vehicle-btn"]').click();
      // ... fill form and save ...
      
      // Verify count increased
      cy.get('[data-testid="total-vehicles"]').should('contain', totalCount + 1);
    });
  });

  afterEach(() => {
    // Cleanup test data
    cy.task('clearDatabase');
    
    // Logout admin
    cy.get('[data-testid="admin-logout"]').click();
  });
});
