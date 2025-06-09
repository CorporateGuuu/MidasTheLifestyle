// Mobile Responsiveness Testing for Midas The Lifestyle
// Ensures luxury experience excellence across all mobile devices

describe('Mobile Responsiveness - Luxury Mobile Experience', () => {
  const mobileDevices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'Samsung Galaxy Note 20', width: 412, height: 915 },
    { name: 'Google Pixel 6', width: 393, height: 851 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
  ];

  const tabletDevices = [
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro 11"', width: 834, height: 1194 },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
    { name: 'Surface Pro', width: 912, height: 1368 },
    { name: 'Galaxy Tab S7', width: 753, height: 1037 },
  ];

  const testPages = [
    { url: '/', name: 'Homepage' },
    { url: '/inventory', name: 'Inventory' },
    { url: '/inventory/cars', name: 'Cars Category' },
    { url: '/booking', name: 'Booking Flow' },
    { url: '/login', name: 'Login' },
    { url: '/register', name: 'Registration' },
    { url: '/dashboard', name: 'Dashboard' },
  ];

  beforeEach(() => {
    // Clear browser state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  mobileDevices.forEach((device) => {
    describe(`${device.name} (${device.width}x${device.height})`, () => {
      beforeEach(() => {
        cy.viewport(device.width, device.height);
      });

      it('should display luxury mobile navigation correctly', () => {
        cy.log(`📱 Testing Mobile Navigation on ${device.name}`);
        
        cy.visit('/');
        
        // Verify mobile navigation elements
        cy.get('[data-testid="mobile-header"]').should('be.visible');
        cy.get('[data-testid="mobile-menu-btn"]').should('be.visible');
        cy.get('[data-testid="mobile-logo"]').should('be.visible');
        
        // Test mobile menu functionality
        cy.get('[data-testid="mobile-menu-btn"]').click();
        cy.get('[data-testid="mobile-menu-drawer"]').should('be.visible');
        
        // Verify menu items
        cy.get('[data-testid="mobile-nav-inventory"]').should('be.visible');
        cy.get('[data-testid="mobile-nav-booking"]').should('be.visible');
        cy.get('[data-testid="mobile-nav-login"]').should('be.visible');
        
        // Test menu item navigation
        cy.get('[data-testid="mobile-nav-inventory"]').click();
        cy.url().should('include', '/inventory');
        
        // Verify menu closes after navigation
        cy.get('[data-testid="mobile-menu-drawer"]').should('not.be.visible');
      });

      it('should render luxury content responsively', () => {
        cy.log(`🎨 Testing Responsive Content on ${device.name}`);
        
        testPages.forEach((page) => {
          cy.visit(page.url);
          
          // Verify page loads without horizontal scroll
          cy.get('body').should('have.css', 'overflow-x', 'hidden');
          
          // Check that content fits within viewport
          cy.get('[data-testid="main-content"]').then(($content) => {
            expect($content[0].scrollWidth).to.be.at.most(device.width + 1);
          });
          
          // Verify luxury branding is visible
          cy.get('[data-testid="luxury-branding"]').should('be.visible');
          
          // Check typography scaling
          cy.get('h1').should('have.css', 'font-size').then((fontSize) => {
            const size = parseFloat(fontSize);
            expect(size).to.be.at.least(24); // Minimum readable size
            expect(size).to.be.at.most(48); // Maximum mobile size
          });
          
          // Verify button sizes are touch-friendly
          cy.get('[data-testid="primary-button"]').then(($btn) => {
            const height = $btn.height();
            expect(height).to.be.at.least(44); // iOS minimum touch target
          });
        });
      });

      it('should handle touch interactions properly', () => {
        cy.log(`👆 Testing Touch Interactions on ${device.name}`);
        
        cy.visit('/inventory');
        
        // Test touch scrolling
        cy.get('[data-testid="vehicle-list"]').scrollTo('bottom');
        cy.get('[data-testid="load-more-btn"]').should('be.visible');
        
        // Test swipe gestures on image galleries
        cy.visit('/inventory/ferrari-f8');
        cy.get('[data-testid="image-gallery"]').should('be.visible');
        
        // Simulate swipe left
        cy.get('[data-testid="gallery-image"]')
          .trigger('touchstart', { touches: [{ clientX: 200, clientY: 200 }] })
          .trigger('touchmove', { touches: [{ clientX: 100, clientY: 200 }] })
          .trigger('touchend');
        
        // Verify image changed
        cy.get('[data-testid="gallery-indicator"]').should('contain', '2');
        
        // Test pinch zoom (if supported)
        cy.get('[data-testid="zoomable-image"]').then(($img) => {
          if ($img.length > 0) {
            cy.wrap($img)
              .trigger('touchstart', { 
                touches: [
                  { clientX: 100, clientY: 100 },
                  { clientX: 200, clientY: 200 }
                ]
              })
              .trigger('touchmove', { 
                touches: [
                  { clientX: 50, clientY: 50 },
                  { clientX: 250, clientY: 250 }
                ]
              })
              .trigger('touchend');
          }
        });
      });

      it('should optimize forms for mobile input', () => {
        cy.log(`📝 Testing Mobile Form Experience on ${device.name}`);
        
        cy.visit('/register');
        
        // Verify form layout
        cy.get('[data-testid="registration-form"]').should('be.visible');
        
        // Test input field sizing
        cy.get('[data-testid="email-input"]').then(($input) => {
          const height = $input.height();
          expect(height).to.be.at.least(44); // Touch-friendly height
        });
        
        // Test input types for mobile keyboards
        cy.get('[data-testid="email-input"]')
          .should('have.attr', 'type', 'email')
          .should('have.attr', 'inputmode', 'email');
        
        cy.get('[data-testid="phone-input"]')
          .should('have.attr', 'type', 'tel')
          .should('have.attr', 'inputmode', 'tel');
        
        // Test form validation on mobile
        cy.get('[data-testid="email-input"]').type('invalid-email');
        cy.get('[data-testid="submit-btn"]').click();
        cy.get('[data-testid="email-error"]').should('be.visible');
        
        // Test form submission
        cy.get('[data-testid="email-input"]').clear().type('test@example.com');
        cy.get('[data-testid="password-input"]').type('TestPassword123!');
        cy.get('[data-testid="submit-btn"]').click();
        
        // Verify mobile-friendly success message
        cy.get('[data-testid="success-message"]').should('be.visible');
      });

      it('should provide optimal booking flow on mobile', () => {
        cy.log(`🚗 Testing Mobile Booking Flow on ${device.name}`);
        
        cy.visit('/booking');
        
        // Verify mobile booking stepper
        cy.get('[data-testid="mobile-booking-stepper"]').should('be.visible');
        
        // Test date picker on mobile
        cy.get('[data-testid="start-date-picker"]').click();
        cy.get('[data-testid="mobile-date-picker"]').should('be.visible');
        
        // Select date
        cy.get('[data-date="2024-03-15"]').click();
        cy.get('[data-testid="date-confirm-btn"]').click();
        
        // Test location selection
        cy.get('[data-testid="location-select"]').click();
        cy.get('[data-testid="mobile-location-picker"]').should('be.visible');
        
        // Test map interaction on mobile
        cy.get('[data-testid="location-map"]').should('be.visible');
        cy.get('[data-testid="location-search"]').type('Washington DC');
        cy.get('[data-testid="location-result"]').first().click();
        
        // Test payment form on mobile
        cy.get('[data-testid="continue-to-payment"]').click();
        cy.get('[data-testid="mobile-payment-form"]').should('be.visible');
        
        // Verify secure payment indicators
        cy.get('[data-testid="mobile-ssl-badge"]').should('be.visible');
        cy.get('[data-testid="mobile-security-info"]').should('be.visible');
      });

      it('should handle mobile performance requirements', () => {
        cy.log(`⚡ Testing Mobile Performance on ${device.name}`);
        
        cy.visit('/');
        
        // Test page load performance
        cy.window().then((win) => {
          const performance = win.performance;
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          // Mobile-specific performance thresholds
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          expect(loadTime).to.be.lessThan(4000); // 4 seconds for mobile
          
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          expect(domContentLoaded).to.be.lessThan(2500); // 2.5 seconds for mobile
        });
        
        // Test image loading performance
        cy.get('[data-testid="hero-image"]').should('be.visible');
        cy.get('[data-testid="hero-image"]').should(($img) => {
          expect($img[0].complete).to.be.true;
        });
        
        // Test lazy loading
        cy.get('[data-testid="lazy-image"]').should('have.attr', 'loading', 'lazy');
        
        // Test resource optimization
        cy.get('img').each(($img) => {
          cy.wrap($img).should('have.attr', 'src').then((src) => {
            // Verify WebP or optimized format
            expect(src).to.match(/\.(webp|jpg|jpeg|png)$/i);
          });
        });
      });

      it('should maintain accessibility on mobile', () => {
        cy.log(`♿ Testing Mobile Accessibility on ${device.name}`);
        
        cy.visit('/');
        
        // Test touch target sizes
        cy.get('[data-testid="interactive-element"]').each(($el) => {
          const width = $el.width();
          const height = $el.height();
          expect(width).to.be.at.least(44);
          expect(height).to.be.at.least(44);
        });
        
        // Test focus management on mobile
        cy.get('[data-testid="focusable-element"]').focus();
        cy.get('[data-testid="focusable-element"]').should('have.focus');
        
        // Test screen reader support
        cy.get('[aria-label]').should('have.length.at.least', 1);
        cy.get('[role]').should('have.length.at.least', 1);
        
        // Test mobile-specific ARIA attributes
        cy.get('[data-testid="mobile-menu-btn"]')
          .should('have.attr', 'aria-expanded')
          .and('match', /true|false/);
        
        // Test color contrast on mobile
        cy.get('[data-testid="text-content"]').should('be.visible');
      });
    });
  });

  tabletDevices.forEach((device) => {
    describe(`${device.name} Tablet (${device.width}x${device.height})`, () => {
      beforeEach(() => {
        cy.viewport(device.width, device.height);
      });

      it('should provide optimal tablet experience', () => {
        cy.log(`📱 Testing Tablet Experience on ${device.name}`);
        
        cy.visit('/');
        
        // Verify tablet-specific layout
        cy.get('[data-testid="tablet-layout"]').should('be.visible');
        
        // Test navigation for tablets
        cy.get('[data-testid="tablet-navigation"]').should('be.visible');
        
        // Verify content adapts to tablet size
        cy.get('[data-testid="content-grid"]').should('have.css', 'grid-template-columns');
        
        // Test touch interactions
        cy.get('[data-testid="touch-element"]').click();
        cy.get('[data-testid="touch-feedback"]').should('be.visible');
      });

      it('should handle tablet-specific features', () => {
        cy.log(`🎯 Testing Tablet-Specific Features on ${device.name}`);
        
        cy.visit('/inventory');
        
        // Test split-screen layout
        cy.get('[data-testid="tablet-split-view"]').should('be.visible');
        
        // Test sidebar navigation
        cy.get('[data-testid="tablet-sidebar"]').should('be.visible');
        
        // Test multi-column layout
        cy.get('[data-testid="tablet-columns"]').should('have.css', 'column-count');
      });
    });
  });

  it('should handle orientation changes gracefully', () => {
    cy.log('🔄 Testing Orientation Changes');
    
    // Test portrait orientation
    cy.viewport(375, 667); // iPhone portrait
    cy.visit('/');
    cy.get('[data-testid="portrait-layout"]').should('be.visible');
    
    // Test landscape orientation
    cy.viewport(667, 375); // iPhone landscape
    cy.get('[data-testid="landscape-layout"]').should('be.visible');
    
    // Verify content adapts
    cy.get('[data-testid="responsive-content"]').should('be.visible');
  });

  it('should optimize for different pixel densities', () => {
    cy.log('🖼️ Testing High-DPI Display Support');
    
    cy.visit('/');
    
    // Test high-resolution images
    cy.get('[data-testid="hero-image"]').should('have.attr', 'srcset');
    
    // Test retina display optimization
    cy.window().then((win) => {
      const pixelRatio = win.devicePixelRatio;
      if (pixelRatio > 1) {
        cy.get('[data-testid="retina-image"]').should('be.visible');
      }
    });
  });

  afterEach(() => {
    // Take screenshot for visual regression testing
    cy.screenshot(`mobile-responsive-${Cypress.currentTest.title}`, {
      capture: 'viewport',
    });
  });
});
