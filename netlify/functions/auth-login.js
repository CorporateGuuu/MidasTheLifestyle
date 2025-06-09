// User Login Endpoint for Midas The Lifestyle
// Secure user authentication with rate limiting and account protection

const validator = require('validator');
const { withDatabase } = require('../../database/connection');
const User = require('../../database/models/User');
const { generateTokenPair, checkAuthRateLimit, corsHeaders } = require('./auth-middleware');

// Log login events
const logLoginEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'auth-login',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      password: data.password ? '***REDACTED***' : undefined,
      email: data.email ? data.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
    }
  };
  
  console.log(JSON.stringify(logEntry));
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Validate login data
const validateLoginData = (data) => {
  const errors = [];
  
  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }
  
  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 1) {
    errors.push('Password cannot be empty');
  }
  
  return errors;
};

// Send login notification email
const sendLoginNotification = async (user, loginInfo) => {
  try {
    // Only send for suspicious logins or if user has enabled notifications
    const shouldNotify = loginInfo.newDevice || 
                        loginInfo.newLocation || 
                        user.notifications?.email?.securityAlerts;
    
    if (!shouldNotify) return;
    
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'login_notification',
        customerEmail: user.email,
        firstName: user.firstName,
        loginInfo,
        source: 'login'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login notification failed: ${response.status}`);
    }
    
    logLoginEvent('login_notification_sent', {
      userId: user._id,
      email: user.email
    }, 'info');
    
  } catch (error) {
    logLoginEvent('login_notification_failed', {
      userId: user._id,
      error: error.message
    }, 'error');
  }
};

// Analyze login context
const analyzeLoginContext = (event, user) => {
  const userAgent = event.headers['user-agent'] || '';
  const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
  
  // Simple device detection
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown';
  
  // Check if this is a new device/location (simplified)
  const lastLogin = user.lastLogin;
  const timeSinceLastLogin = lastLogin ? Date.now() - lastLogin.getTime() : Infinity;
  
  return {
    clientIP,
    userAgent,
    browser,
    isMobile,
    newDevice: timeSinceLastLogin > 30 * 24 * 60 * 60 * 1000, // 30 days
    newLocation: false, // Would need geolocation service
    timeSinceLastLogin
  };
};

// Main login handler
const loginUser = withDatabase(async (event, context) => {
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
    // Rate limiting
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const rateLimit = checkAuthRateLimit(`login_${clientIP}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    
    // Parse request data
    const loginData = JSON.parse(event.body);
    
    logLoginEvent('login_attempt', {
      email: loginData.email,
      clientIP,
      userAgent: event.headers['user-agent']
    }, 'info');
    
    // Validate login data
    const validationErrors = validateLoginData(loginData);
    if (validationErrors.length > 0) {
      logLoginEvent('login_validation_failed', {
        errors: validationErrors,
        email: loginData.email
      }, 'warning');
      
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation failed',
          errors: validationErrors
        })
      };
    }
    
    // Find user by email
    const user = await User.findByEmail(loginData.email).select('+password');
    
    if (!user) {
      logLoginEvent('login_user_not_found', {
        email: loginData.email,
        clientIP
      }, 'warning');
      
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.'
        })
      };
    }
    
    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      
      logLoginEvent('login_account_locked', {
        userId: user._id,
        email: user.email,
        lockTimeRemaining
      }, 'warning');
      
      return {
        statusCode: 423,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Account locked',
          message: `Your account is temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
          lockTimeRemaining
        })
      };
    }
    
    // Check account status
    if (user.status === 'suspended') {
      logLoginEvent('login_account_suspended', {
        userId: user._id,
        email: user.email
      }, 'warning');
      
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Account suspended',
          message: 'Your account has been suspended. Please contact our support team for assistance.'
        })
      };
    }
    
    if (user.status === 'inactive') {
      logLoginEvent('login_account_inactive', {
        userId: user._id,
        email: user.email
      }, 'warning');
      
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Account inactive',
          message: 'Your account is inactive. Please contact our support team to reactivate your account.'
        })
      };
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(loginData.password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      logLoginEvent('login_invalid_password', {
        userId: user._id,
        email: user.email,
        loginAttempts: user.loginAttempts + 1
      }, 'warning');
      
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.',
          attemptsRemaining: Math.max(0, 5 - (user.loginAttempts + 1))
        })
      };
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Analyze login context
    const loginContext = analyzeLoginContext(event, user);
    
    // Update user login information
    user.lastLogin = new Date();
    await user.save();
    
    // Generate authentication tokens
    const tokens = generateTokenPair(user);
    
    logLoginEvent('login_successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      serviceTier: user.serviceProfile?.tier,
      loginContext
    }, 'info');
    
    // Send login notification if needed
    await sendLoginNotification(user, loginContext);
    
    // Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          serviceTier: user.serviceProfile?.tier,
          status: user.status,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          totalBookings: user.totalBookings,
          lifetimeValue: user.lifetimeValue,
          loyaltyPoints: user.loyaltyPoints
        },
        tokens,
        preferences: {
          notifications: user.notifications,
          serviceProfile: {
            tier: user.serviceProfile?.tier,
            preferredLocations: user.serviceProfile?.preferredLocations,
            preferredVehicleTypes: user.serviceProfile?.preferredVehicleTypes,
            vipPreferences: user.serviceProfile?.vipPreferences
          }
        },
        loginContext: {
          newDevice: loginContext.newDevice,
          browser: loginContext.browser,
          isMobile: loginContext.isMobile
        }
      })
    };
    
  } catch (error) {
    logLoginEvent('login_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Login failed',
        message: 'We apologize for the inconvenience. Please try again or contact our support team.'
      })
    };
  }
});

module.exports = { handler: loginUser };
