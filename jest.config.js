// Jest Configuration for Midas The Lifestyle Testing Suite
// Comprehensive test configuration with coverage and performance settings

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'services/**/*.js',
    'database/**/*.js',
    'netlify/functions/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/migrations/**',
    '!**/seeds/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Service-specific thresholds
    'services/availabilityService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'services/bookingStatusService.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'services/adminService.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Maximum worker processes
  maxWorkers: '50%',
  
  // Test result processor
  testResultsProcessor: undefined,
  
  // Transform files
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],
  
  // Global variables
  globals: {
    'NODE_ENV': 'test'
  },
  
  // Test suites configuration
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'End-to-End Tests',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 60000 // Longer timeout for E2E tests
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 120000 // Longer timeout for performance tests
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/tests/security/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    }
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Midas The Lifestyle - Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ]
  ],
  
  // Watch mode configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.git/'
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Notification configuration
  notify: false,
  notifyMode: 'failure-change',
  
  // Snapshot configuration
  updateSnapshot: false,
  
  // Module name mapping
  moduleNameMapping: {},
  
  // Setup files before environment
  setupFiles: [],
  
  // Test environment options
  testEnvironmentOptions: {},
  
  // Custom test sequencer
  testSequencer: undefined,
  
  // Bail configuration
  bail: 0, // Don't bail on first failure
  
  // Cache configuration
  cache: true,
  cacheDirectory: '/tmp/jest_cache',
  
  // Dependency extractor
  dependencyExtractor: undefined,
  
  // Display name
  displayName: {
    name: 'Midas The Lifestyle Tests',
    color: 'gold'
  },
  
  // Extra globals
  extraGlobals: [],
  
  // Find related tests
  findRelatedTests: false,
  
  // Force coverage collection
  forceCoverageMatch: [],
  
  // Global setup
  globalSetup: undefined,
  
  // Global teardown
  globalTeardown: undefined,
  
  // Haste configuration
  haste: {
    computeSha1: false,
    throwOnModuleCollision: false
  },
  
  // Max concurrency
  maxConcurrency: 5,
  
  // Module directories
  moduleDirectories: [
    'node_modules'
  ],
  
  // Module paths
  modulePaths: [],
  
  // Preset
  preset: undefined,
  
  // Pretty format
  prettierPath: 'prettier',
  
  // Reset mocks
  resetMocks: false,
  
  // Reset modules
  resetModules: false,
  
  // Resolver
  resolver: undefined,
  
  // Roots
  roots: [
    '<rootDir>'
  ],
  
  // Runner
  runner: 'jest-runner',
  
  // Snapshot resolver
  snapshotResolver: undefined,
  
  // Snapshot serializers
  snapshotSerializers: [],
  
  // Test location in results
  testLocationInResults: false,
  
  // Test name pattern
  testNamePattern: undefined,
  
  // Test runner
  testRunner: 'jest-circus/runner',
  
  // Test URL
  testURL: 'http://localhost',
  
  // Timer implementation
  timers: 'real',
  
  // Unmocked module path patterns
  unmockedModulePathPatterns: undefined,
  
  // Use stderr
  useStderr: false,
  
  // Watch plugins
  watchPlugins: []
};
