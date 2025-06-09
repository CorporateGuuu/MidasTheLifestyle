// Centralized Error Logging Service for Midas The Lifestyle
// Comprehensive error tracking, monitoring, and alerting system

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Error severity levels and categorization
const ERROR_CATEGORIES = {
  PAYMENT: {
    severity: 'HIGH',
    alertThreshold: 1, // Alert immediately
    escalationTime: 300000, // 5 minutes
    notifyTeams: ['finance', 'development', 'customer-service']
  },
  BOOKING: {
    severity: 'HIGH',
    alertThreshold: 2, // Alert after 2 errors
    escalationTime: 600000, // 10 minutes
    notifyTeams: ['operations', 'development', 'customer-service']
  },
  AUTHENTICATION: {
    severity: 'MEDIUM',
    alertThreshold: 5, // Alert after 5 errors
    escalationTime: 900000, // 15 minutes
    notifyTeams: ['security', 'development']
  },
  SYSTEM: {
    severity: 'HIGH',
    alertThreshold: 3, // Alert after 3 errors
    escalationTime: 300000, // 5 minutes
    notifyTeams: ['development', 'infrastructure']
  },
  USER_EXPERIENCE: {
    severity: 'MEDIUM',
    alertThreshold: 10, // Alert after 10 errors
    escalationTime: 1800000, // 30 minutes
    notifyTeams: ['development', 'customer-service']
  },
  INTEGRATION: {
    severity: 'MEDIUM',
    alertThreshold: 3, // Alert after 3 errors
    escalationTime: 600000, // 10 minutes
    notifyTeams: ['development', 'operations']
  }
};

// Error storage (in production, use database or external service)
const errorStore = new Map();
const alertStore = new Map();

// Business metrics tracking
const businessMetrics = {
  bookingFailures: 0,
  paymentFailures: 0,
  authenticationFailures: 0,
  totalErrors: 0,
  lastReset: Date.now()
};

// Enhanced error logging with business context
const logError = (errorData) => {
  const enhancedError = {
    id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    service: 'midas-luxury-rentals',
    environment: process.env.NODE_ENV || 'development',
    ...errorData,
    
    // Add business context
    businessContext: {
      userJourney: errorData.userJourney || 'unknown',
      bookingValue: errorData.bookingValue || 0,
      customerTier: errorData.customerTier || 'standard',
      deviceType: errorData.deviceType || 'unknown',
      location: errorData.location || 'unknown'
    },
    
    // Performance metrics
    performance: {
      responseTime: errorData.responseTime || 0,
      memoryUsage: process.memoryUsage(),
      timestamp: Date.now()
    }
  };
  
  // Store error for analysis
  errorStore.set(enhancedError.id, enhancedError);
  
  // Update business metrics
  updateBusinessMetrics(enhancedError);
  
  // Console logging with structured format
  console.error(JSON.stringify(enhancedError, null, 2));
  
  // Send to external monitoring services
  sendToMonitoringServices(enhancedError);
  
  // Check for alert conditions
  checkAlertConditions(enhancedError);
  
  return enhancedError.id;
};

// Update business metrics for dashboard
const updateBusinessMetrics = (error) => {
  businessMetrics.totalErrors++;
  
  switch (error.category) {
    case 'BOOKING':
      businessMetrics.bookingFailures++;
      break;
    case 'PAYMENT':
      businessMetrics.paymentFailures++;
      break;
    case 'AUTHENTICATION':
      businessMetrics.authenticationFailures++;
      break;
  }
  
  // Reset metrics daily
  const now = Date.now();
  if (now - businessMetrics.lastReset > 86400000) { // 24 hours
    Object.keys(businessMetrics).forEach(key => {
      if (key !== 'lastReset') businessMetrics[key] = 0;
    });
    businessMetrics.lastReset = now;
  }
};

// Send errors to external monitoring services
const sendToMonitoringServices = async (error) => {
  const services = [
    {
      name: 'Sentry',
      url: process.env.SENTRY_WEBHOOK_URL,
      format: formatForSentry
    },
    {
      name: 'DataDog',
      url: process.env.DATADOG_WEBHOOK_URL,
      format: formatForDataDog
    },
    {
      name: 'LogRocket',
      url: process.env.LOGROCKET_WEBHOOK_URL,
      format: formatForLogRocket
    }
  ];
  
  for (const service of services) {
    if (service.url) {
      try {
        const formattedError = service.format(error);
        await fetch(service.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env[`${service.name.toUpperCase()}_API_KEY`]}`
          },
          body: JSON.stringify(formattedError)
        });
      } catch (err) {
        console.error(`Failed to send error to ${service.name}:`, err.message);
      }
    }
  }
};

// Format error for Sentry
const formatForSentry = (error) => ({
  message: error.message,
  level: error.severity.toLowerCase(),
  tags: {
    category: error.category,
    service: error.service,
    environment: error.environment,
    userJourney: error.businessContext.userJourney
  },
  extra: {
    errorId: error.id,
    businessContext: error.businessContext,
    performance: error.performance,
    stackTrace: error.stackTrace
  },
  timestamp: error.timestamp
});

// Format error for DataDog
const formatForDataDog = (error) => ({
  title: `Midas Luxury Error: ${error.category}`,
  text: error.message,
  alert_type: error.severity === 'HIGH' ? 'error' : 'warning',
  tags: [
    `category:${error.category}`,
    `service:${error.service}`,
    `environment:${error.environment}`,
    `user_journey:${error.businessContext.userJourney}`
  ],
  source_type_name: 'netlify-functions'
});

// Format error for LogRocket
const formatForLogRocket = (error) => ({
  level: error.severity.toLowerCase(),
  message: error.message,
  metadata: {
    errorId: error.id,
    category: error.category,
    businessContext: error.businessContext,
    performance: error.performance
  }
});

// Check alert conditions and trigger notifications
const checkAlertConditions = (error) => {
  const category = ERROR_CATEGORIES[error.category];
  if (!category) return;
  
  const alertKey = `${error.category}_${Math.floor(Date.now() / category.escalationTime)}`;
  
  if (!alertStore.has(alertKey)) {
    alertStore.set(alertKey, { count: 0, firstError: error, errors: [] });
  }
  
  const alertData = alertStore.get(alertKey);
  alertData.count++;
  alertData.errors.push(error);
  
  // Trigger alert if threshold reached
  if (alertData.count >= category.alertThreshold) {
    triggerAlert(category, alertData);
    alertStore.delete(alertKey); // Reset counter after alert
  }
};

// Trigger alert notifications
const triggerAlert = async (category, alertData) => {
  const alertMessage = {
    severity: category.severity,
    category: alertData.firstError.category,
    count: alertData.count,
    timeWindow: category.escalationTime / 60000, // Convert to minutes
    errors: alertData.errors.map(e => ({
      id: e.id,
      message: e.message,
      timestamp: e.timestamp,
      userJourney: e.businessContext.userJourney
    })),
    businessImpact: calculateBusinessImpact(alertData.errors),
    recommendedActions: getRecommendedActions(alertData.firstError.category)
  };
  
  // Send to notification channels
  await sendAlertNotifications(alertMessage, category.notifyTeams);
};

// Calculate business impact of errors
const calculateBusinessImpact = (errors) => {
  const totalBookingValue = errors.reduce((sum, error) => 
    sum + (error.businessContext.bookingValue || 0), 0
  );
  
  const affectedCustomers = new Set(errors.map(e => e.userId)).size;
  
  return {
    potentialRevenueLoss: totalBookingValue,
    affectedCustomers,
    customerTiers: errors.map(e => e.businessContext.customerTier),
    criticalityScore: calculateCriticalityScore(errors)
  };
};

// Calculate error criticality score
const calculateCriticalityScore = (errors) => {
  let score = 0;
  errors.forEach(error => {
    score += error.businessContext.bookingValue / 1000; // Revenue impact
    score += error.businessContext.customerTier === 'vvip' ? 10 : 1; // Customer tier impact
    score += error.category === 'PAYMENT' ? 5 : 1; // Category impact
  });
  return Math.min(score, 100); // Cap at 100
};

// Get recommended actions for error categories
const getRecommendedActions = (category) => {
  const actions = {
    PAYMENT: [
      'Check payment gateway status',
      'Verify API keys and webhooks',
      'Contact payment processor support',
      'Implement manual payment processing'
    ],
    BOOKING: [
      'Check inventory system status',
      'Verify calendar synchronization',
      'Review booking validation logic',
      'Contact affected customers'
    ],
    AUTHENTICATION: [
      'Check OAuth provider status',
      'Verify API credentials',
      'Review session management',
      'Check for security incidents'
    ],
    SYSTEM: [
      'Check server resources',
      'Review function logs',
      'Verify database connections',
      'Check third-party integrations'
    ]
  };
  
  return actions[category] || ['Review error logs', 'Contact development team'];
};

// Send alert notifications to teams
const sendAlertNotifications = async (alertMessage, teams) => {
  // Email notifications
  if (process.env.ALERT_EMAIL_ENDPOINT) {
    try {
      await fetch(process.env.ALERT_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error_alert',
          teams,
          alert: alertMessage,
          priority: alertMessage.severity
        })
      });
    } catch (err) {
      console.error('Failed to send email alert:', err.message);
    }
  }
  
  // Slack notifications
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Midas Luxury Alert: ${alertMessage.category}`,
          attachments: [{
            color: alertMessage.severity === 'HIGH' ? 'danger' : 'warning',
            fields: [
              { title: 'Error Count', value: alertMessage.count, short: true },
              { title: 'Time Window', value: `${alertMessage.timeWindow} minutes`, short: true },
              { title: 'Affected Customers', value: alertMessage.businessImpact.affectedCustomers, short: true },
              { title: 'Potential Revenue Loss', value: `$${alertMessage.businessImpact.potentialRevenueLoss}`, short: true }
            ]
          }]
        })
      });
    } catch (err) {
      console.error('Failed to send Slack alert:', err.message);
    }
  }
};

// Main error logging handler
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const errorData = JSON.parse(event.body);
    
    // Validate required fields
    if (!errorData.message || !errorData.category) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: message, category' })
      };
    }
    
    // Log the error
    const errorId = logError(errorData);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        errorId,
        message: 'Error logged successfully'
      })
    };
    
  } catch (error) {
    console.error('Error logging service failed:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Error logging failed',
        message: error.message
      })
    };
  }
};
