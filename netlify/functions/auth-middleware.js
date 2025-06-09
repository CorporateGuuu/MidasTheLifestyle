// Authentication Middleware for Midas The Lifestyle
// JWT token validation and session management

const jwt = require('jsonwebtoken');
const { withDatabase } = require('../../database/connection');
const User = require('../../database/models/User');

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'midas-luxury-secret-key-change-in-production',
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  issuer: 'midas-the-lifestyle',
  audience: 'midas-luxury-clients'
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Log authentication events
const logAuthEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'auth-middleware',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      token: data.token ? `***${data.token.slice(-8)}` : undefined,
      password: data.password ? '***REDACTED***' : undefined
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

// Generate JWT token
const generateToken = (user, type = 'access') => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    tier: user.serviceProfile?.tier || 'standard',
    type
  };
  
  const options = {
    expiresIn: type === 'refresh' ? JWT_CONFIG.refreshExpiresIn : JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user._id.toString()
  };
  
  return jwt.sign(payload, JWT_CONFIG.secret, options);
};

// Generate token pair (access + refresh)
const generateTokenPair = (user) => {
  const accessToken = generateToken(user, 'access');
  const refreshToken = generateToken(user, 'refresh');
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.expiresIn,
    tokenType: 'Bearer'
  };
};

// Verify JWT token
const verifyToken = (token, type = 'access') => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
    
    // Check token type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

// Extract token from request
const extractToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format. Use: Bearer <token>');
  }
  
  return parts[1];
};

// Authenticate user from token
const authenticateUser = async (token) => {
  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new Error(`User account is ${user.status}`);
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    logAuthEvent('user_authenticated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      tier: user.serviceProfile?.tier
    }, 'info');
    
    return user;
    
  } catch (error) {
    logAuthEvent('authentication_failed', {
      error: error.message,
      token: token
    }, 'warning');
    throw error;
  }
};

// Authorization middleware
const authorize = (roles = [], tiers = []) => {
  return async (user) => {
    // Check role authorization
    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new Error(`Access denied. Required roles: ${roles.join(', ')}`);
    }
    
    // Check tier authorization
    if (tiers.length > 0 && !tiers.includes(user.serviceProfile?.tier)) {
      throw new Error(`Access denied. Required service tiers: ${tiers.join(', ')}`);
    }
    
    logAuthEvent('user_authorized', {
      userId: user._id,
      role: user.role,
      tier: user.serviceProfile?.tier,
      requiredRoles: roles,
      requiredTiers: tiers
    }, 'info');
    
    return true;
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = new Map();

const checkAuthRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!authRateLimit.has(identifier)) {
    authRateLimit.set(identifier, []);
  }
  
  const attempts = authRateLimit.get(identifier);
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
  authRateLimit.set(identifier, recentAttempts);
  
  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const resetTime = oldestAttempt + windowMs;
    
    throw new Error(`Too many authentication attempts. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds.`);
  }
  
  // Add current attempt
  recentAttempts.push(now);
  authRateLimit.set(identifier, recentAttempts);
  
  return {
    remaining: maxAttempts - recentAttempts.length,
    resetTime: windowStart + windowMs
  };
};

// Authentication middleware wrapper
const withAuth = (handler, options = {}) => {
  const { roles = [], tiers = [], optional = false } = options;
  
  return withDatabase(async (event, context) => {
    try {
      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: ''
        };
      }
      
      // Extract token
      const token = extractToken(event);
      
      if (!token && !optional) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Authentication required',
            message: 'Please provide a valid authentication token'
          })
        };
      }
      
      let user = null;
      
      if (token) {
        // Authenticate user
        user = await authenticateUser(token);
        
        // Check authorization
        if (roles.length > 0 || tiers.length > 0) {
          await authorize(roles, tiers)(user);
        }
      }
      
      // Add user to event context
      event.user = user;
      event.isAuthenticated = !!user;
      
      // Call original handler
      return await handler(event, context);
      
    } catch (error) {
      logAuthEvent('auth_middleware_error', {
        error: error.message,
        function: context.functionName
      }, 'error');
      
      // Determine appropriate status code
      let statusCode = 500;
      if (error.message.includes('Authentication required') || 
          error.message.includes('Invalid token') ||
          error.message.includes('Token has expired')) {
        statusCode = 401;
      } else if (error.message.includes('Access denied')) {
        statusCode = 403;
      } else if (error.message.includes('Too many')) {
        statusCode = 429;
      }
      
      return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Authentication error',
          message: error.message
        })
      };
    }
  });
};

// Utility functions for token management
const refreshTokens = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new token pair
    const tokens = generateTokenPair(user);
    
    logAuthEvent('tokens_refreshed', {
      userId: user._id,
      email: user.email
    }, 'info');
    
    return tokens;
    
  } catch (error) {
    logAuthEvent('token_refresh_failed', {
      error: error.message
    }, 'warning');
    throw error;
  }
};

// Export authentication utilities
module.exports = {
  // Middleware
  withAuth,
  
  // Token management
  generateToken,
  generateTokenPair,
  verifyToken,
  refreshTokens,
  
  // Authentication
  authenticateUser,
  authorize,
  
  // Rate limiting
  checkAuthRateLimit,
  
  // Utilities
  extractToken,
  corsHeaders,
  
  // Configuration
  JWT_CONFIG
};
