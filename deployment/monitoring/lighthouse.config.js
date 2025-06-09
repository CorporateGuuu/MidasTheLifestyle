// Lighthouse CI Configuration for Midas The Lifestyle
// Performance monitoring and optimization for luxury user experience

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'https://midasthelifestyle.netlify.app/',
        'https://midasthelifestyle.netlify.app/inventory',
        'https://midasthelifestyle.netlify.app/inventory/cars',
        'https://midasthelifestyle.netlify.app/booking',
        'https://midasthelifestyle.netlify.app/login',
        'https://midasthelifestyle.netlify.app/register',
      ],
      
      // Collection settings
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        emulatedFormFactor: 'desktop',
        locale: 'en-US',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    
    assert: {
      // Performance thresholds for luxury experience
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        
        // Performance metrics
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'max-potential-fid': ['error', { maxNumericValue: 130 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['error', { maxLength: 0 }],
        'uses-optimized-images': ['error', { maxLength: 0 }],
        'uses-webp-images': ['warn', { maxLength: 0 }],
        'uses-responsive-images': ['error', { maxLength: 0 }],
        
        // Caching and compression
        'uses-long-cache-ttl': ['warn', { maxLength: 0 }],
        'uses-text-compression': ['error', { maxLength: 0 }],
        
        // JavaScript and CSS
        'render-blocking-resources': ['warn', { maxLength: 0 }],
        'unminified-css': ['error', { maxLength: 0 }],
        'unminified-javascript': ['error', { maxLength: 0 }],
        
        // Accessibility
        'color-contrast': ['error', { maxLength: 0 }],
        'image-alt': ['error', { maxLength: 0 }],
        'label': ['error', { maxLength: 0 }],
        'link-name': ['error', { maxLength: 0 }],
        'button-name': ['error', { maxLength: 0 }],
        
        // SEO
        'meta-description': ['error', { maxLength: 0 }],
        'document-title': ['error', { maxLength: 0 }],
        'html-has-lang': ['error', { maxLength: 0 }],
        'html-lang-valid': ['error', { maxLength: 0 }],
        'canonical': ['warn', { maxLength: 0 }],
        
        // Best practices
        'is-on-https': ['error', { maxLength: 0 }],
        'uses-http2': ['warn', { maxLength: 0 }],
        'no-vulnerable-libraries': ['error', { maxLength: 0 }],
        'csp-xss': ['warn', { maxLength: 0 }],
      },
    },
    
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
    
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
    
    wizard: {
      // Wizard configuration for setup
    },
  },
  
  // Custom audits for luxury experience
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      // Performance audits
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'max-potential-fid',
      
      // Resource audits
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-responsive-images',
      'uses-long-cache-ttl',
      'uses-text-compression',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      
      // Accessibility audits
      'color-contrast',
      'image-alt',
      'label',
      'link-name',
      'button-name',
      'focus-traps',
      'focusable-controls',
      'heading-order',
      'html-has-lang',
      'html-lang-valid',
      'meta-viewport',
      'tabindex',
      
      // SEO audits
      'meta-description',
      'document-title',
      'canonical',
      'robots-txt',
      'hreflang',
      'structured-data',
      
      // Best practices audits
      'is-on-https',
      'uses-http2',
      'no-vulnerable-libraries',
      'csp-xss',
      'geolocation-on-start',
      'notification-on-start',
      'password-inputs-can-be-pasted-into',
    ],
  },
  
  // Budget configuration for performance monitoring
  budgets: [
    {
      path: '/*',
      timings: [
        {
          metric: 'first-contentful-paint',
          budget: 1500,
        },
        {
          metric: 'largest-contentful-paint',
          budget: 2500,
        },
        {
          metric: 'cumulative-layout-shift',
          budget: 0.1,
        },
        {
          metric: 'total-blocking-time',
          budget: 200,
        },
        {
          metric: 'speed-index',
          budget: 3000,
        },
        {
          metric: 'interactive',
          budget: 3500,
        },
      ],
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 400,
        },
        {
          resourceType: 'stylesheet',
          budget: 100,
        },
        {
          resourceType: 'image',
          budget: 1000,
        },
        {
          resourceType: 'font',
          budget: 100,
        },
        {
          resourceType: 'document',
          budget: 50,
        },
        {
          resourceType: 'other',
          budget: 200,
        },
        {
          resourceType: 'total',
          budget: 1850,
        },
      ],
      resourceCounts: [
        {
          resourceType: 'script',
          budget: 10,
        },
        {
          resourceType: 'stylesheet',
          budget: 5,
        },
        {
          resourceType: 'image',
          budget: 20,
        },
        {
          resourceType: 'font',
          budget: 4,
        },
        {
          resourceType: 'document',
          budget: 1,
        },
        {
          resourceType: 'other',
          budget: 10,
        },
        {
          resourceType: 'total',
          budget: 50,
        },
      ],
    },
  ],
};
