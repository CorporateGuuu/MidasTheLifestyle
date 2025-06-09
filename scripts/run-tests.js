#!/usr/bin/env node

// Test Runner Script for Midas The Lifestyle
// Provides comprehensive testing capabilities with detailed reporting

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  coverage: true,
  verbose: true,
  bail: false,
  maxWorkers: '50%'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Check if Jest is available
function checkJestAvailability() {
  try {
    require.resolve('jest');
    return true;
  } catch (error) {
    return false;
  }
}

// Run Jest tests
function runJestTests(testPattern = '', options = {}) {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--verbose',
      '--coverage',
      '--testTimeout=30000'
    ];

    if (testPattern) {
      jestArgs.push(`--testPathPattern=${testPattern}`);
    }

    if (options.watch) {
      jestArgs.push('--watch');
    }

    if (options.bail) {
      jestArgs.push('--bail');
    }

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });

    jest.on('error', (error) => {
      reject(error);
    });
  });
}

// Run basic Node.js tests without Jest
function runBasicTests() {
  log.header('Running Basic Test Validation');
  
  const tests = [
    {
      name: 'Environment Variables',
      test: () => {
        const requiredEnvVars = ['NODE_ENV'];
        const missing = requiredEnvVars.filter(env => !process.env[env]);
        if (missing.length > 0) {
          throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
        return true;
      }
    },
    {
      name: 'Database Models',
      test: () => {
        const modelPaths = [
          'database/models/User.js',
          'database/models/Booking.js',
          'database/models/Inventory.js'
        ];
        
        for (const modelPath of modelPaths) {
          if (!fs.existsSync(path.join(process.cwd(), modelPath))) {
            throw new Error(`Model file not found: ${modelPath}`);
          }
        }
        return true;
      }
    },
    {
      name: 'Service Files',
      test: () => {
        const servicePaths = [
          'services/availabilityService.js',
          'services/bookingStatusService.js',
          'services/adminService.js'
        ];
        
        for (const servicePath of servicePaths) {
          if (!fs.existsSync(path.join(process.cwd(), servicePath))) {
            throw new Error(`Service file not found: ${servicePath}`);
          }
        }
        return true;
      }
    },
    {
      name: 'API Functions',
      test: () => {
        const functionPaths = [
          'netlify/functions/auth-register.js',
          'netlify/functions/auth-login.js',
          'netlify/functions/booking-management.js',
          'netlify/functions/availability-check.js'
        ];
        
        for (const functionPath of functionPaths) {
          if (!fs.existsSync(path.join(process.cwd(), functionPath))) {
            throw new Error(`Function file not found: ${functionPath}`);
          }
        }
        return true;
      }
    },
    {
      name: 'Test Files',
      test: () => {
        const testPaths = [
          'tests/setup.js',
          'tests/unit/services/availabilityService.test.js',
          'tests/integration/api/auth.test.js',
          'tests/e2e/booking-flow.test.js'
        ];
        
        for (const testPath of testPaths) {
          if (!fs.existsSync(path.join(process.cwd(), testPath))) {
            throw new Error(`Test file not found: ${testPath}`);
          }
        }
        return true;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test.test();
      log.success(`${test.name} - PASSED`);
      passed++;
    } catch (error) {
      log.error(`${test.name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  log.info(`\nBasic Tests Summary: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    throw new Error('Basic tests failed');
  }
}

// Generate test report
function generateTestReport() {
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    testSuite: 'Midas The Lifestyle Backend Tests',
    status: 'completed',
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      }
    }
  };

  // Try to read Jest coverage report if available
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  if (fs.existsSync(coveragePath)) {
    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      if (coverageData.total) {
        reportData.summary.coverage = {
          statements: coverageData.total.statements.pct,
          branches: coverageData.total.branches.pct,
          functions: coverageData.total.functions.pct,
          lines: coverageData.total.lines.pct
        };
      }
    } catch (error) {
      log.warning('Could not read coverage data');
    }
  }

  // Write test report
  const reportPath = path.join(process.cwd(), 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log.success(`Test report generated: ${reportPath}`);
}

// Main test runner
async function runTests() {
  try {
    log.header('🧪 Midas The Lifestyle - Test Suite Runner');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    const options = {
      watch: args.includes('--watch'),
      bail: args.includes('--bail'),
      verbose: args.includes('--verbose')
    };

    log.info(`Running tests: ${testType}`);
    log.info(`Environment: ${process.env.NODE_ENV}`);

    // Run basic validation tests first
    runBasicTests();

    // Check if Jest is available
    if (!checkJestAvailability()) {
      log.warning('Jest not found. Running basic tests only.');
      log.info('To run full test suite, install Jest: npm install --save-dev jest');
      return;
    }

    // Run Jest tests based on type
    switch (testType) {
      case 'unit':
        log.header('Running Unit Tests');
        await runJestTests('unit', options);
        break;
      
      case 'integration':
        log.header('Running Integration Tests');
        await runJestTests('integration', options);
        break;
      
      case 'e2e':
        log.header('Running End-to-End Tests');
        await runJestTests('e2e', options);
        break;
      
      case 'performance':
        log.header('Running Performance Tests');
        await runJestTests('performance', options);
        break;
      
      case 'security':
        log.header('Running Security Tests');
        await runJestTests('security', options);
        break;
      
      case 'all':
      default:
        log.header('Running All Tests');
        await runJestTests('', options);
        break;
    }

    // Generate test report
    generateTestReport();

    log.success('All tests completed successfully! ✨');
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  runBasicTests,
  generateTestReport
};
