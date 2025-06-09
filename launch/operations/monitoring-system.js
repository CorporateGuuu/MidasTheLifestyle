// 24/7 Monitoring System for Midas The Lifestyle
// Enterprise-grade monitoring and alerting for luxury platform operations

const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { performance } = require('perf_hooks');

/**
 * Comprehensive Monitoring System
 * Provides real-time monitoring, alerting, and incident response
 */
class MonitoringSystem {
  constructor(config) {
    this.config = config;
    this.metrics = new Map();
    this.alerts = new Map();
    this.incidents = new Map();
    this.isRunning = false;
    this.intervals = new Map();
    
    // Initialize communication services
    this.emailTransporter = nodemailer.createTransporter({
      service: 'sendgrid',
      auth: {
        user: 'apikey',
        pass: config.sendgrid.apiKey,
      },
    });
    
    this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    
    console.log('🔍 Monitoring system initialized');
  }

  /**
   * Start comprehensive monitoring
   */
  start() {
    if (this.isRunning) {
      console.log('Monitoring system is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting 24/7 monitoring for Midas The Lifestyle...');

    // Start monitoring intervals
    this.intervals.set('health', setInterval(() => {
      this.checkSystemHealth();
    }, 30000)); // Every 30 seconds

    this.intervals.set('performance', setInterval(() => {
      this.checkPerformance();
    }, 60000)); // Every minute

    this.intervals.set('security', setInterval(() => {
      this.checkSecurity();
    }, 300000)); // Every 5 minutes

    this.intervals.set('business', setInterval(() => {
      this.checkBusinessMetrics();
    }, 600000)); // Every 10 minutes

    this.intervals.set('infrastructure', setInterval(() => {
      this.checkInfrastructure();
    }, 120000)); // Every 2 minutes

    // Initial checks
    this.checkSystemHealth();
    this.checkPerformance();
    this.checkSecurity();
    this.checkBusinessMetrics();
    this.checkInfrastructure();
  }

  /**
   * Stop monitoring system
   */
  stop() {
    this.isRunning = false;
    
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped ${name} monitoring`);
    }
    
    this.intervals.clear();
    console.log('🛑 Monitoring system stopped');
  }

  /**
   * Check overall system health
   */
  async checkSystemHealth() {
    console.log('🏥 Checking system health...');
    
    const healthChecks = [
      { name: 'Homepage', url: this.config.endpoints.homepage },
      { name: 'API Health', url: this.config.endpoints.apiHealth },
      { name: 'Admin Panel', url: this.config.endpoints.admin },
      { name: 'Booking System', url: this.config.endpoints.booking },
      { name: 'Payment Gateway', url: this.config.endpoints.payment },
    ];

    for (const check of healthChecks) {
      try {
        const startTime = performance.now();
        const response = await axios.get(check.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Midas-Monitoring/1.0',
          },
        });
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const healthData = {
          name: check.name,
          status: 'healthy',
          responseTime: Math.round(responseTime),
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };

        this.updateMetric(`health_${check.name.toLowerCase()}`, healthData);

        // Check response time thresholds
        if (responseTime > this.config.thresholds.responseTime.critical) {
          await this.createAlert({
            type: 'performance',
            severity: 'critical',
            service: check.name,
            message: `Slow response time: ${Math.round(responseTime)}ms`,
            threshold: this.config.thresholds.responseTime.critical,
            value: responseTime,
          });
        } else if (responseTime > this.config.thresholds.responseTime.warning) {
          await this.createAlert({
            type: 'performance',
            severity: 'warning',
            service: check.name,
            message: `Elevated response time: ${Math.round(responseTime)}ms`,
            threshold: this.config.thresholds.responseTime.warning,
            value: responseTime,
          });
        }

      } catch (error) {
        const healthData = {
          name: check.name,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        this.updateMetric(`health_${check.name.toLowerCase()}`, healthData);

        await this.createAlert({
          type: 'availability',
          severity: 'critical',
          service: check.name,
          message: `Service unavailable: ${error.message}`,
          error: error.message,
        });
      }
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    console.log('⚡ Checking performance metrics...');
    
    try {
      // Check Core Web Vitals
      const performanceData = await this.getCoreWebVitals();
      
      // Validate performance thresholds
      if (performanceData.lcp > this.config.thresholds.coreWebVitals.lcp) {
        await this.createAlert({
          type: 'performance',
          severity: 'warning',
          service: 'Core Web Vitals',
          message: `LCP exceeds threshold: ${performanceData.lcp}ms`,
          threshold: this.config.thresholds.coreWebVitals.lcp,
          value: performanceData.lcp,
        });
      }

      if (performanceData.fid > this.config.thresholds.coreWebVitals.fid) {
        await this.createAlert({
          type: 'performance',
          severity: 'warning',
          service: 'Core Web Vitals',
          message: `FID exceeds threshold: ${performanceData.fid}ms`,
          threshold: this.config.thresholds.coreWebVitals.fid,
          value: performanceData.fid,
        });
      }

      if (performanceData.cls > this.config.thresholds.coreWebVitals.cls) {
        await this.createAlert({
          type: 'performance',
          severity: 'warning',
          service: 'Core Web Vitals',
          message: `CLS exceeds threshold: ${performanceData.cls}`,
          threshold: this.config.thresholds.coreWebVitals.cls,
          value: performanceData.cls,
        });
      }

      this.updateMetric('performance_core_web_vitals', performanceData);

    } catch (error) {
      console.error('Performance check failed:', error.message);
    }
  }

  /**
   * Check security status
   */
  async checkSecurity() {
    console.log('🔒 Checking security status...');
    
    try {
      // Check SSL certificate status
      const sslStatus = await this.checkSSLCertificate();
      this.updateMetric('security_ssl', sslStatus);

      // Check for security headers
      const securityHeaders = await this.checkSecurityHeaders();
      this.updateMetric('security_headers', securityHeaders);

      // Check for suspicious activity
      const securityEvents = await this.checkSecurityEvents();
      this.updateMetric('security_events', securityEvents);

      // Alert on security issues
      if (!sslStatus.valid) {
        await this.createAlert({
          type: 'security',
          severity: 'critical',
          service: 'SSL Certificate',
          message: 'SSL certificate is invalid or expired',
          details: sslStatus,
        });
      }

      if (securityEvents.suspiciousActivity > this.config.thresholds.security.suspiciousActivity) {
        await this.createAlert({
          type: 'security',
          severity: 'warning',
          service: 'Security Events',
          message: `Elevated suspicious activity: ${securityEvents.suspiciousActivity} events`,
          threshold: this.config.thresholds.security.suspiciousActivity,
          value: securityEvents.suspiciousActivity,
        });
      }

    } catch (error) {
      console.error('Security check failed:', error.message);
    }
  }

  /**
   * Check business metrics
   */
  async checkBusinessMetrics() {
    console.log('📊 Checking business metrics...');
    
    try {
      // Check booking conversion rates
      const conversionRate = await this.getConversionRate();
      this.updateMetric('business_conversion_rate', conversionRate);

      // Check revenue metrics
      const revenueMetrics = await this.getRevenueMetrics();
      this.updateMetric('business_revenue', revenueMetrics);

      // Check customer satisfaction
      const customerSatisfaction = await this.getCustomerSatisfaction();
      this.updateMetric('business_satisfaction', customerSatisfaction);

      // Alert on business metric thresholds
      if (conversionRate.rate < this.config.thresholds.business.conversionRate) {
        await this.createAlert({
          type: 'business',
          severity: 'warning',
          service: 'Conversion Rate',
          message: `Low conversion rate: ${conversionRate.rate}%`,
          threshold: this.config.thresholds.business.conversionRate,
          value: conversionRate.rate,
        });
      }

      if (customerSatisfaction.score < this.config.thresholds.business.satisfactionScore) {
        await this.createAlert({
          type: 'business',
          severity: 'warning',
          service: 'Customer Satisfaction',
          message: `Low satisfaction score: ${customerSatisfaction.score}/5`,
          threshold: this.config.thresholds.business.satisfactionScore,
          value: customerSatisfaction.score,
        });
      }

    } catch (error) {
      console.error('Business metrics check failed:', error.message);
    }
  }

  /**
   * Check infrastructure status
   */
  async checkInfrastructure() {
    console.log('🏗️ Checking infrastructure status...');
    
    try {
      // Check database connectivity
      const databaseStatus = await this.checkDatabase();
      this.updateMetric('infrastructure_database', databaseStatus);

      // Check CDN performance
      const cdnStatus = await this.checkCDN();
      this.updateMetric('infrastructure_cdn', cdnStatus);

      // Check third-party services
      const thirdPartyStatus = await this.checkThirdPartyServices();
      this.updateMetric('infrastructure_third_party', thirdPartyStatus);

      // Alert on infrastructure issues
      if (!databaseStatus.connected) {
        await this.createAlert({
          type: 'infrastructure',
          severity: 'critical',
          service: 'Database',
          message: 'Database connection failed',
          details: databaseStatus,
        });
      }

      if (cdnStatus.responseTime > this.config.thresholds.infrastructure.cdnResponseTime) {
        await this.createAlert({
          type: 'infrastructure',
          severity: 'warning',
          service: 'CDN',
          message: `Slow CDN response: ${cdnStatus.responseTime}ms`,
          threshold: this.config.thresholds.infrastructure.cdnResponseTime,
          value: cdnStatus.responseTime,
        });
      }

    } catch (error) {
      console.error('Infrastructure check failed:', error.message);
    }
  }

  /**
   * Create and manage alerts
   */
  async createAlert(alertData) {
    const alertId = `${alertData.type}_${alertData.service}_${Date.now()}`;
    const alert = {
      id: alertId,
      ...alertData,
      timestamp: new Date().toISOString(),
      status: 'active',
      notificationsSent: [],
    };

    this.alerts.set(alertId, alert);

    // Check if this is a duplicate alert
    const recentAlerts = Array.from(this.alerts.values())
      .filter(a => 
        a.type === alertData.type && 
        a.service === alertData.service && 
        a.status === 'active' &&
        Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 minutes
      );

    if (recentAlerts.length > 1) {
      console.log(`Suppressing duplicate alert for ${alertData.service}`);
      return;
    }

    // Send notifications based on severity
    await this.sendNotifications(alert);

    // Create incident if critical
    if (alert.severity === 'critical') {
      await this.createIncident(alert);
    }

    console.log(`🚨 Alert created: ${alert.severity.toUpperCase()} - ${alert.service}: ${alert.message}`);
  }

  /**
   * Send alert notifications
   */
  async sendNotifications(alert) {
    const notifications = this.config.notifications[alert.severity] || this.config.notifications.default;

    // Send email notifications
    if (notifications.email) {
      try {
        await this.sendEmailAlert(alert, notifications.email);
        alert.notificationsSent.push({ type: 'email', timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to send email alert:', error.message);
      }
    }

    // Send SMS notifications for critical alerts
    if (alert.severity === 'critical' && notifications.sms) {
      try {
        await this.sendSMSAlert(alert, notifications.sms);
        alert.notificationsSent.push({ type: 'sms', timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to send SMS alert:', error.message);
      }
    }

    // Send Slack notifications
    if (notifications.slack) {
      try {
        await this.sendSlackAlert(alert, notifications.slack);
        alert.notificationsSent.push({ type: 'slack', timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to send Slack alert:', error.message);
      }
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert, emailConfig) {
    const subject = `🚨 ${alert.severity.toUpperCase()} Alert - ${alert.service}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A0A0A; color: #FFFFFF; padding: 20px; text-align: center;">
          <h1 style="color: #D4AF37; margin: 0;">MIDAS THE LIFESTYLE</h1>
          <h2 style="color: #FFFFFF; margin: 10px 0 0 0;">System Alert</h2>
        </div>
        
        <div style="padding: 20px; background: #F5F5F5;">
          <div style="background: ${alert.severity === 'critical' ? '#F44336' : '#FF9800'}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin: 0;">${alert.severity.toUpperCase()} ALERT</h3>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #DDD; font-weight: bold;">Service:</td>
              <td style="padding: 10px; border-bottom: 1px solid #DDD;">${alert.service}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #DDD; font-weight: bold;">Message:</td>
              <td style="padding: 10px; border-bottom: 1px solid #DDD;">${alert.message}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #DDD; font-weight: bold;">Time:</td>
              <td style="padding: 10px; border-bottom: 1px solid #DDD;">${new Date(alert.timestamp).toLocaleString()}</td>
            </tr>
            ${alert.threshold ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #DDD; font-weight: bold;">Threshold:</td>
              <td style="padding: 10px; border-bottom: 1px solid #DDD;">${alert.threshold}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #DDD; font-weight: bold;">Current Value:</td>
              <td style="padding: 10px; border-bottom: 1px solid #DDD;">${alert.value}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #E3F2FD; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">Next Steps:</p>
            <ul style="margin: 10px 0 0 0;">
              <li>Investigate the issue immediately</li>
              <li>Check system logs for additional details</li>
              <li>Contact the on-call engineer if needed</li>
              <li>Update the incident status</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #0A0A0A; color: #FFFFFF; padding: 15px; text-align: center;">
          <p style="margin: 0; color: #D4AF37;">Midas The Lifestyle Monitoring System</p>
        </div>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: this.config.email.from,
      to: emailConfig.recipients,
      subject: subject,
      html: html,
    });
  }

  /**
   * Send SMS alert
   */
  async sendSMSAlert(alert, smsConfig) {
    const message = `🚨 CRITICAL ALERT - ${alert.service}: ${alert.message}. Time: ${new Date(alert.timestamp).toLocaleString()}. Investigate immediately.`;

    for (const phoneNumber of smsConfig.recipients) {
      await this.twilioClient.messages.create({
        body: message,
        from: this.config.twilio.phoneNumber,
        to: phoneNumber,
      });
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert, slackConfig) {
    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const payload = {
      channel: slackConfig.channel,
      username: 'Midas Monitoring',
      icon_emoji: ':rotating_light:',
      attachments: [{
        color: color,
        title: `${alert.severity.toUpperCase()} Alert - ${alert.service}`,
        text: alert.message,
        fields: [
          {
            title: 'Service',
            value: alert.service,
            short: true,
          },
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true,
          },
        ],
        footer: 'Midas The Lifestyle Monitoring',
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    await axios.post(slackConfig.webhookUrl, payload);
  }

  /**
   * Create incident for critical alerts
   */
  async createIncident(alert) {
    const incidentId = `INC-${Date.now()}`;
    const incident = {
      id: incidentId,
      title: `${alert.service} - ${alert.message}`,
      description: alert.message,
      severity: alert.severity,
      status: 'open',
      assignee: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alerts: [alert.id],
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'incident_created',
        details: 'Incident automatically created from critical alert',
      }],
    };

    this.incidents.set(incidentId, incident);
    console.log(`📋 Incident created: ${incidentId}`);

    // Notify incident response team
    await this.notifyIncidentTeam(incident);
  }

  /**
   * Update metric data
   */
  updateMetric(key, data) {
    this.metrics.set(key, {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const now = Date.now();
    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => now - new Date(alert.timestamp).getTime() < 3600000) // Last hour
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const activeIncidents = Array.from(this.incidents.values())
      .filter(incident => incident.status === 'open');

    const healthMetrics = {};
    for (const [key, value] of this.metrics) {
      if (key.startsWith('health_')) {
        healthMetrics[key] = value;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallHealth(),
      alerts: {
        total: recentAlerts.length,
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        warning: recentAlerts.filter(a => a.severity === 'warning').length,
        recent: recentAlerts.slice(0, 10),
      },
      incidents: {
        active: activeIncidents.length,
        recent: activeIncidents.slice(0, 5),
      },
      health: healthMetrics,
      uptime: this.calculateUptime(),
    };
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth() {
    const healthChecks = Array.from(this.metrics.values())
      .filter(metric => metric.status !== undefined);

    if (healthChecks.length === 0) return 'unknown';

    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
    const healthPercentage = (healthyCount / healthChecks.length) * 100;

    if (healthPercentage >= 95) return 'healthy';
    if (healthPercentage >= 80) return 'degraded';
    return 'unhealthy';
  }

  /**
   * Calculate system uptime
   */
  calculateUptime() {
    // This would typically be calculated from historical data
    // For now, return a placeholder
    return {
      current: '99.95%',
      last24h: '99.98%',
      last7d: '99.92%',
      last30d: '99.89%',
    };
  }

  // Placeholder methods for specific checks
  async getCoreWebVitals() {
    // Implementation would integrate with real performance monitoring
    return {
      fcp: 1200,
      lcp: 2100,
      fid: 80,
      cls: 0.05,
      timestamp: new Date().toISOString(),
    };
  }

  async checkSSLCertificate() {
    // Implementation would check actual SSL certificate
    return {
      valid: true,
      expiresAt: '2024-12-31T23:59:59Z',
      issuer: 'Let\'s Encrypt',
      timestamp: new Date().toISOString(),
    };
  }

  async checkSecurityHeaders() {
    // Implementation would check actual security headers
    return {
      csp: true,
      hsts: true,
      xFrameOptions: true,
      xContentTypeOptions: true,
      timestamp: new Date().toISOString(),
    };
  }

  async checkSecurityEvents() {
    // Implementation would check actual security logs
    return {
      suspiciousActivity: 2,
      blockedRequests: 15,
      failedLogins: 3,
      timestamp: new Date().toISOString(),
    };
  }

  async getConversionRate() {
    // Implementation would calculate from actual data
    return {
      rate: 2.5,
      visitors: 1000,
      conversions: 25,
      timestamp: new Date().toISOString(),
    };
  }

  async getRevenueMetrics() {
    // Implementation would get from actual business data
    return {
      today: 5000,
      thisWeek: 25000,
      thisMonth: 100000,
      timestamp: new Date().toISOString(),
    };
  }

  async getCustomerSatisfaction() {
    // Implementation would get from actual feedback data
    return {
      score: 4.7,
      responses: 150,
      nps: 75,
      timestamp: new Date().toISOString(),
    };
  }

  async checkDatabase() {
    // Implementation would check actual database
    return {
      connected: true,
      responseTime: 45,
      connections: 15,
      timestamp: new Date().toISOString(),
    };
  }

  async checkCDN() {
    // Implementation would check actual CDN
    return {
      responseTime: 120,
      hitRate: 95,
      bandwidth: 1500,
      timestamp: new Date().toISOString(),
    };
  }

  async checkThirdPartyServices() {
    // Implementation would check actual third-party services
    return {
      stripe: 'operational',
      sendgrid: 'operational',
      twilio: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  async notifyIncidentTeam(incident) {
    // Implementation would notify actual incident response team
    console.log(`📞 Notifying incident response team for ${incident.id}`);
  }
}

// Configuration for monitoring system
const monitoringConfig = {
  endpoints: {
    homepage: 'https://midasthelifestyle.com',
    apiHealth: 'https://midasthelifestyle.com/.netlify/functions/health',
    admin: 'https://midasthelifestyle.com/admin',
    booking: 'https://midasthelifestyle.com/booking',
    payment: 'https://midasthelifestyle.com/.netlify/functions/payment-health',
  },
  
  thresholds: {
    responseTime: {
      warning: 2000,
      critical: 5000,
    },
    coreWebVitals: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
    },
    business: {
      conversionRate: 1.5,
      satisfactionScore: 4.0,
    },
    security: {
      suspiciousActivity: 10,
    },
    infrastructure: {
      cdnResponseTime: 500,
    },
  },
  
  notifications: {
    critical: {
      email: {
        recipients: ['ops@midasthelifestyle.com', 'cto@midasthelifestyle.com'],
      },
      sms: {
        recipients: ['+12403510511'],
      },
      slack: {
        channel: '#critical-alerts',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      },
    },
    warning: {
      email: {
        recipients: ['ops@midasthelifestyle.com'],
      },
      slack: {
        channel: '#alerts',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      },
    },
  },
  
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  email: {
    from: 'monitoring@midasthelifestyle.com',
  },
};

module.exports = {
  MonitoringSystem,
  monitoringConfig,
};

// CLI usage
if (require.main === module) {
  const monitoring = new MonitoringSystem(monitoringConfig);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down monitoring system...');
    monitoring.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down monitoring system...');
    monitoring.stop();
    process.exit(0);
  });
  
  // Start monitoring
  monitoring.start();
  
  // Keep process alive and log status
  setInterval(() => {
    const status = monitoring.getSystemStatus();
    console.log(`📊 System Status: ${status.overall.toUpperCase()} | Active Alerts: ${status.alerts.total} | Uptime: ${status.uptime.current}`);
  }, 300000); // Every 5 minutes
}
