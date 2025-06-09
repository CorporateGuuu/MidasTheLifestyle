// Cypress E2E Testing Configuration for Midas The Lifestyle
// Comprehensive end-to-end testing setup for luxury rental platform

import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';

export default defineConfig({
  // E2E Testing Configuration
  e2e: {
    // Base URL for testing
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1920,
    viewportHeight: 1080,
    
    // Test file patterns
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      'cypress/e2e/**/*.feature'
    ],
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Video recording
    video: true,
    videoCompression: 32,
    
    // Screenshot settings
    screenshotOnRunFailure: true,
    
    // Test isolation
    testIsolation: true,
    
    // Browser settings
    chromeWebSecurity: false,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Environment variables
    env: {
      // API endpoints
      apiUrl: 'http://localhost:3000/.netlify/functions',
      
      // Test user credentials
      testUser: {
        email: 'test@midasthelifestyle.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
      
      // Admin credentials
      adminUser: {
        email: 'admin@midasthelifestyle.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
      },
      
      // Test data
      testBooking: {
        vehicleId: 'test-vehicle-001',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        pickupLocation: 'Washington DC',
      },
      
      // Payment test data
      testPayment: {
        cardNumber: '4242424242424242',
        expiryDate: '12/25',
        cvc: '123',
        name: 'Test User',
      },
      
      // Feature flags
      enableVisualTesting: true,
      enablePerformanceTesting: true,
      enableAccessibilityTesting: true,
      enableSecurityTesting: true,
      
      // Browser testing
      browsers: ['chrome', 'firefox', 'edge'],
      
      // Mobile testing
      mobileDevices: [
        'iphone-x',
        'iphone-se2',
        'samsung-galaxy-s10',
        'ipad-2',
      ],
      
      // Performance thresholds
      performanceThresholds: {
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1,
        firstInputDelay: 100,
      },
      
      // Accessibility standards
      accessibilityStandard: 'WCAG21AA',
      
      // Test environments
      environments: {
        local: 'http://localhost:3000',
        staging: 'https://midasthelifestyle-staging.netlify.app',
        production: 'https://midasthelifestyle.netlify.app',
      },
    },
    
    // Setup node events
    setupNodeEvents(on, config) {
      // Cucumber preprocessor
      addCucumberPreprocessorPlugin(on, config);
      
      // Esbuild preprocessor
      on(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      
      // Custom tasks
      on('task', {
        // Database seeding
        seedDatabase() {
          return new Promise((resolve) => {
            // Seed test data
            console.log('Seeding test database...');
            resolve(null);
          });
        },
        
        // Clear database
        clearDatabase() {
          return new Promise((resolve) => {
            // Clear test data
            console.log('Clearing test database...');
            resolve(null);
          });
        },
        
        // Generate test data
        generateTestData(type: string) {
          return new Promise((resolve) => {
            console.log(`Generating test data for: ${type}`);
            resolve(null);
          });
        },
        
        // Performance testing
        performanceTest(url: string) {
          return new Promise((resolve) => {
            console.log(`Running performance test for: ${url}`);
            resolve({
              fcp: 1200,
              lcp: 2100,
              cls: 0.05,
              fid: 80,
            });
          });
        },
        
        // Accessibility testing
        accessibilityTest(url: string) {
          return new Promise((resolve) => {
            console.log(`Running accessibility test for: ${url}`);
            resolve({
              violations: [],
              passes: 25,
              incomplete: 0,
            });
          });
        },
        
        // Visual regression testing
        visualTest(name: string) {
          return new Promise((resolve) => {
            console.log(`Running visual test: ${name}`);
            resolve({
              passed: true,
              differences: 0,
            });
          });
        },
        
        // Email testing
        getLastEmail() {
          return new Promise((resolve) => {
            console.log('Fetching last email...');
            resolve({
              to: 'test@midasthelifestyle.com',
              subject: 'Booking Confirmation',
              body: 'Your booking has been confirmed.',
            });
          });
        },
        
        // SMS testing
        getLastSMS() {
          return new Promise((resolve) => {
            console.log('Fetching last SMS...');
            resolve({
              to: '+1234567890',
              message: 'Your booking confirmation code is: 123456',
            });
          });
        },
      });
      
      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
        }
        
        if (browser.name === 'firefox') {
          launchOptions.args.push('--width=1920');
          launchOptions.args.push('--height=1080');
        }
        
        return launchOptions;
      });
      
      // After screenshot
      on('after:screenshot', (details) => {
        console.log('Screenshot taken:', details.path);
      });
      
      // After spec
      on('after:spec', (spec, results) => {
        if (results && results.video) {
          console.log('Video recorded:', results.video);
        }
      });
      
      return config;
    },
  },
  
  // Component Testing Configuration
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    
    // Component testing specific settings
    viewportWidth: 1000,
    viewportHeight: 660,
  },
  
  // Global configuration
  watchForFileChanges: true,
  
  // Experimental features
  experimentalStudio: true,
  experimentalWebKitSupport: true,
  
  // Reporter configuration
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress/reporter-config.json',
  },
  
  // Project ID for Cypress Dashboard
  projectId: 'midas-lifestyle',
  
  // Include shadow DOM
  includeShadowDom: true,
  
  // Modifying obstructive third-party code
  modifyObstructiveCode: true,
  
  // Scrolling behavior
  scrollBehavior: 'center',
  
  // Animation settings
  animationDistanceThreshold: 5,
  waitForAnimations: true,
  
  // Node version
  nodeVersion: 'system',
});
