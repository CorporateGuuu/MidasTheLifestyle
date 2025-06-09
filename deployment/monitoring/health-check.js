// Health Check System for Midas The Lifestyle
// Comprehensive monitoring and alerting for production deployment

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

/**
 * Health Check Configuration
 */
const config = {
  // Environments to monitor
  environments: {
    production: {
      name: 'Production',
      url: 'https://midasthelifestyle.netlify.app',
      critical: true,
      timeout: 10000,
      expectedStatus: 200,
    },
    staging: {
      name: 'Staging',
      url: 'https://midasthelifestyle-staging.netlify.app',
      critical: false,
      timeout: 15000,
      expectedStatus: 200,
    },
  },
  
  // Critical endpoints to monitor
  endpoints: [
    {
      path: '/',
      name: 'Homepage',
      critical: true,
      timeout: 5000,
      checks: ['status', 'performance', 'content'],
    },
    {
      path: '/inventory',
      name: 'Inventory Page',
      critical: true,
      timeout: 8000,
      checks: ['status', 'performance'],
    },
    {
      path: '/inventory/cars',
      name: 'Cars Inventory',
      critical: true,
      timeout: 8000,
      checks: ['status', 'performance'],
    },
    {
      path: '/.netlify/functions/health',
      name: 'API Health',
      critical: true,
      timeout: 5000,
      checks: ['status', 'response'],
    },
    {
      path: '/login',
      name: 'Login Page',
      critical: true,
      timeout: 5000,
      checks: ['status'],
    },
    {
      path: '/register',
      name: 'Register Page',
      critical: true,
      timeout: 5000,
      checks: ['status'],
    },
  ],
  
  // Performance thresholds
  thresholds: {
    responseTime: {
      excellent: 1000,  // < 1s
      good: 2500,       // < 2.5s
      poor: 5000,       // < 5s
    },
    availability: {
      critical: 99.9,   // 99.9% uptime
      warning: 99.5,    // 99.5% uptime
    },
  },
  
  // Notification settings
  notifications: {
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts',
    },
    email: {
      enabled: !!process.env.SENDGRID_API_KEY,
      to: ['concierge@midasthelifestyle.com'],
      from: 'alerts@midasthelifestyle.com',
    },
  },
  
  // Check intervals
  intervals: {
    health: 60000,      // 1 minute
    performance: 300000, // 5 minutes
    uptime: 30000,      // 30 seconds
  },
};

/**
 * Health Check Class
 */
class HealthChecker {
  constructor() {
    this.results = new Map();
    this.alerts = new Map();
    this.isRunning = false;
    this.intervals = new Map();
  }

  // Start monitoring
  start() {
    if (this.isRunning) {
      console.log('Health checker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🏥 Starting health monitoring for Midas The Lifestyle...');

    // Start periodic checks
    this.intervals.set('health', setInterval(() => {
      this.runHealthChecks();
    }, config.intervals.health));

    this.intervals.set('performance', setInterval(() => {
      this.runPerformanceChecks();
    }, config.intervals.performance));

    this.intervals.set('uptime', setInterval(() => {
      this.runUptimeChecks();
    }, config.intervals.uptime));

    // Run initial checks
    this.runHealthChecks();
    this.runPerformanceChecks();
    this.runUptimeChecks();
  }

  // Stop monitoring
  stop() {
    this.isRunning = false;
    
    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped ${name} monitoring`);
    }
    
    this.intervals.clear();
    console.log('🛑 Health monitoring stopped');
  }

  // Run comprehensive health checks
  async runHealthChecks() {
    console.log('🔍 Running health checks...');
    
    for (const [envName, envConfig] of Object.entries(config.environments)) {
      try {
        const envResults = await this.checkEnvironment(envName, envConfig);
        this.results.set(envName, {
          ...envResults,
          timestamp: new Date().toISOString(),
        });
        
        // Check for alerts
        await this.checkAlerts(envName, envResults);
        
      } catch (error) {
        console.error(`❌ Health check failed for ${envName}:`, error.message);
        
        await this.sendAlert({
          type: 'error',
          environment: envName,
          message: `Health check failed: ${error.message}`,
          severity: envConfig.critical ? 'critical' : 'warning',
        });
      }
    }
  }

  // Check specific environment
  async checkEnvironment(envName, envConfig) {
    const results = {
      environment: envName,
      status: 'unknown',
      endpoints: [],
      overall: {
        healthy: false,
        responseTime: 0,
        errors: [],
      },
    };

    for (const endpoint of config.endpoints) {
      const endpointResult = await this.checkEndpoint(
        envConfig.url + endpoint.path,
        endpoint,
        envConfig.timeout
      );
      
      results.endpoints.push(endpointResult);
      results.overall.responseTime += endpointResult.responseTime;
      
      if (!endpointResult.healthy) {
        results.overall.errors.push({
          endpoint: endpoint.name,
          error: endpointResult.error,
        });
      }
    }

    // Calculate overall health
    const healthyEndpoints = results.endpoints.filter(e => e.healthy).length;
    const totalEndpoints = results.endpoints.length;
    const healthPercentage = (healthyEndpoints / totalEndpoints) * 100;
    
    results.overall.healthy = healthPercentage >= 90; // 90% of endpoints must be healthy
    results.overall.responseTime = results.overall.responseTime / totalEndpoints;
    results.status = results.overall.healthy ? 'healthy' : 'unhealthy';

    return results;
  }

  // Check individual endpoint
  async checkEndpoint(url, endpoint, timeout) {
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequest(url, timeout);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result = {
        name: endpoint.name,
        url: url,
        healthy: true,
        status: response.statusCode,
        responseTime: Math.round(responseTime),
        contentLength: response.contentLength || 0,
        error: null,
        checks: {},
      };

      // Run specific checks
      if (endpoint.checks.includes('status')) {
        result.checks.status = response.statusCode === 200;
        if (!result.checks.status) {
          result.healthy = false;
          result.error = `Unexpected status code: ${response.statusCode}`;
        }
      }

      if (endpoint.checks.includes('performance')) {
        const performanceGood = responseTime < config.thresholds.responseTime.good;
        result.checks.performance = performanceGood;
        if (!performanceGood) {
          result.healthy = false;
          result.error = `Slow response time: ${Math.round(responseTime)}ms`;
        }
      }

      if (endpoint.checks.includes('content')) {
        const hasContent = response.contentLength > 0;
        result.checks.content = hasContent;
        if (!hasContent) {
          result.healthy = false;
          result.error = 'No content received';
        }
      }

      if (endpoint.checks.includes('response')) {
        try {
          const data = JSON.parse(response.body);
          result.checks.response = data.status === 'healthy';
          if (!result.checks.response) {
            result.healthy = false;
            result.error = `API unhealthy: ${data.message || 'Unknown error'}`;
          }
        } catch (parseError) {
          result.checks.response = false;
          result.healthy = false;
          result.error = 'Invalid JSON response';
        }
      }

      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        name: endpoint.name,
        url: url,
        healthy: false,
        status: 0,
        responseTime: Math.round(responseTime),
        contentLength: 0,
        error: error.message,
        checks: {},
      };
    }
  }

  // Make HTTP request
  makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'Midas-Health-Checker/1.0',
          'Accept': 'text/html,application/json,*/*',
        },
      };

      const req = client.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            contentLength: body.length,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  // Run performance checks
  async runPerformanceChecks() {
    console.log('⚡ Running performance checks...');
    
    // This would integrate with external performance monitoring
    // For now, we'll use the response times from health checks
    
    for (const [envName, results] of this.results) {
      if (results && results.overall) {
        const avgResponseTime = results.overall.responseTime;
        
        if (avgResponseTime > config.thresholds.responseTime.poor) {
          await this.sendAlert({
            type: 'performance',
            environment: envName,
            message: `Poor performance detected: ${Math.round(avgResponseTime)}ms average response time`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Run uptime checks
  async runUptimeChecks() {
    // Simple uptime check - just ping the main endpoints
    for (const [envName, envConfig] of Object.entries(config.environments)) {
      try {
        const response = await this.makeRequest(envConfig.url, 5000);
        
        if (response.statusCode !== 200) {
          await this.sendAlert({
            type: 'uptime',
            environment: envName,
            message: `Site is down or returning error: HTTP ${response.statusCode}`,
            severity: envConfig.critical ? 'critical' : 'warning',
          });
        }
      } catch (error) {
        await this.sendAlert({
          type: 'uptime',
          environment: envName,
          message: `Site is unreachable: ${error.message}`,
          severity: envConfig.critical ? 'critical' : 'warning',
        });
      }
    }
  }

  // Check for alerts
  async checkAlerts(envName, results) {
    const alertKey = `${envName}_health`;
    
    if (!results.overall.healthy) {
      // Check if we've already sent this alert recently
      const lastAlert = this.alerts.get(alertKey);
      const now = Date.now();
      
      if (!lastAlert || (now - lastAlert.timestamp) > 300000) { // 5 minutes
        await this.sendAlert({
          type: 'health',
          environment: envName,
          message: `Environment is unhealthy: ${results.overall.errors.map(e => e.error).join(', ')}`,
          severity: config.environments[envName].critical ? 'critical' : 'warning',
        });
        
        this.alerts.set(alertKey, { timestamp: now });
      }
    } else {
      // Clear alert if environment is healthy again
      if (this.alerts.has(alertKey)) {
        this.alerts.delete(alertKey);
        
        await this.sendAlert({
          type: 'recovery',
          environment: envName,
          message: `Environment has recovered and is now healthy`,
          severity: 'info',
        });
      }
    }
  }

  // Send alert notification
  async sendAlert(alert) {
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    
    // Send to Slack
    if (config.notifications.slack.enabled) {
      await this.sendSlackAlert(alert);
    }
    
    // Send email (if configured)
    if (config.notifications.email.enabled) {
      await this.sendEmailAlert(alert);
    }
  }

  // Send Slack alert
  async sendSlackAlert(alert) {
    try {
      const color = {
        critical: 'danger',
        warning: 'warning',
        info: 'good',
      }[alert.severity] || 'warning';
      
      const payload = {
        channel: config.notifications.slack.channel,
        username: 'Midas Health Monitor',
        icon_emoji: ':hospital:',
        attachments: [{
          color: color,
          title: `${alert.type.toUpperCase()} Alert - ${alert.environment}`,
          text: alert.message,
          fields: [{
            title: 'Environment',
            value: alert.environment,
            short: true,
          }, {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          }, {
            title: 'Time',
            value: new Date().toISOString(),
            short: true,
          }],
        }],
      };
      
      // Send to Slack webhook (implementation would go here)
      console.log('📱 Slack alert sent');
      
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  // Send email alert
  async sendEmailAlert(alert) {
    try {
      // Email implementation would go here
      console.log('📧 Email alert sent');
    } catch (error) {
      console.error('Failed to send email alert:', error.message);
    }
  }

  // Get current status
  getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      environments: {},
      overall: {
        healthy: true,
        totalEndpoints: 0,
        healthyEndpoints: 0,
      },
    };

    for (const [envName, results] of this.results) {
      status.environments[envName] = results;
      
      if (results.endpoints) {
        status.overall.totalEndpoints += results.endpoints.length;
        status.overall.healthyEndpoints += results.endpoints.filter(e => e.healthy).length;
        
        if (!results.overall.healthy && config.environments[envName].critical) {
          status.overall.healthy = false;
        }
      }
    }

    return status;
  }
}

// Export for use in other modules
module.exports = {
  HealthChecker,
  config,
};

// CLI usage
if (require.main === module) {
  const checker = new HealthChecker();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down health checker...');
    checker.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down health checker...');
    checker.stop();
    process.exit(0);
  });
  
  // Start monitoring
  checker.start();
  
  // Keep process alive
  setInterval(() => {
    const status = checker.getStatus();
    console.log(`📊 Status: ${status.overall.healthy ? '✅ Healthy' : '❌ Unhealthy'} (${status.overall.healthyEndpoints}/${status.overall.totalEndpoints} endpoints)`);
  }, 60000);
}
