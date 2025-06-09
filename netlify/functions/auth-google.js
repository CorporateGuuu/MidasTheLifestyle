// Google OAuth Backend Integration for Midas The Lifestyle
// Secure Google OAuth token validation and user profile creation

const { withDatabase } = require('../../database/connection');
const User = require('../../database/models/User');
const { generateTokenPair, corsHeaders } = require('./auth-middleware');

// Google OAuth configuration
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  tokenInfoUrl: 'https://oauth2.googleapis.com/tokeninfo',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

// Log OAuth events
const logOAuthEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'auth-google',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      accessToken: data.accessToken ? `***${data.accessToken.slice(-8)}` : undefined,
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

// Verify Google access token
const verifyGoogleToken = async (accessToken) => {
  try {
    // Verify token with Google
    const tokenResponse = await fetch(`${GOOGLE_CONFIG.tokenInfoUrl}?access_token=${accessToken}`);
    
    if (!tokenResponse.ok) {
      throw new Error('Invalid Google access token');
    }
    
    const tokenInfo = await tokenResponse.json();
    
    // Verify the token is for our application
    if (tokenInfo.aud !== GOOGLE_CONFIG.clientId) {
      throw new Error('Token not issued for this application');
    }
    
    // Get user profile information
    const profileResponse = await fetch(`${GOOGLE_CONFIG.userInfoUrl}?access_token=${accessToken}`);
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }
    
    const profile = await profileResponse.json();
    
    logOAuthEvent('google_token_verified', {
      googleId: profile.id,
      email: profile.email,
      verified: profile.verified_email
    }, 'info');
    
    return {
      googleId: profile.id,
      email: profile.email,
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
      picture: profile.picture,
      verified: profile.verified_email
    };
    
  } catch (error) {
    logOAuthEvent('google_token_verification_failed', {
      error: error.message
    }, 'error');
    throw error;
  }
};

// Create or update user from Google profile
const createOrUpdateGoogleUser = async (googleProfile, clientIP) => {
  try {
    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: googleProfile.googleId });
    
    if (user) {
      // Update existing user
      user.lastLogin = new Date();
      user.emailVerified = googleProfile.verified;
      
      // Update profile picture if provided
      if (googleProfile.picture && !user.profilePicture) {
        user.profilePicture = googleProfile.picture;
      }
      
      await user.save();
      
      logOAuthEvent('google_user_updated', {
        userId: user._id,
        googleId: googleProfile.googleId,
        email: user.email
      }, 'info');
      
      return user;
    }
    
    // Check if user exists by email
    user = await User.findByEmail(googleProfile.email);
    
    if (user) {
      // Link Google account to existing user
      user.googleId = googleProfile.googleId;
      user.emailVerified = googleProfile.verified;
      user.lastLogin = new Date();
      
      if (googleProfile.picture && !user.profilePicture) {
        user.profilePicture = googleProfile.picture;
      }
      
      await user.save();
      
      logOAuthEvent('google_account_linked', {
        userId: user._id,
        googleId: googleProfile.googleId,
        email: user.email
      }, 'info');
      
      return user;
    }
    
    // Create new user
    user = new User({
      googleId: googleProfile.googleId,
      email: googleProfile.email.toLowerCase(),
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
      profilePicture: googleProfile.picture,
      emailVerified: googleProfile.verified,
      status: 'active', // Google users are automatically verified
      role: 'customer',
      
      // Default service profile
      serviceProfile: {
        tier: 'standard',
        preferredLocations: [],
        preferredVehicleTypes: [],
        vipPreferences: {
          chauffeurService: false,
          airportPickup: false,
          customDelivery: false,
          personalConcierge: false
        }
      },
      
      // Default notification preferences
      notifications: {
        email: {
          bookingConfirmations: true,
          paymentReceipts: true,
          promotionalOffers: true,
          serviceUpdates: true
        },
        sms: {
          bookingReminders: false,
          emergencyAlerts: true
        }
      },
      
      // GDPR compliance
      gdprConsent: {
        given: true, // Implied by Google OAuth
        date: new Date(),
        ipAddress: clientIP
      },
      
      lastLogin: new Date()
    });
    
    await user.save();
    
    logOAuthEvent('google_user_created', {
      userId: user._id,
      googleId: googleProfile.googleId,
      email: user.email
    }, 'info');
    
    // Send welcome email
    await sendGoogleWelcomeEmail(user);
    
    return user;
    
  } catch (error) {
    logOAuthEvent('google_user_creation_failed', {
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Send welcome email for Google users
const sendGoogleWelcomeEmail = async (user) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'google_welcome_email',
        customerEmail: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        serviceTier: user.serviceProfile.tier,
        source: 'google-oauth'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google welcome email failed: ${response.status}`);
    }
    
    logOAuthEvent('google_welcome_email_sent', {
      userId: user._id,
      email: user.email
    }, 'info');
    
  } catch (error) {
    logOAuthEvent('google_welcome_email_failed', {
      userId: user._id,
      error: error.message
    }, 'error');
  }
};

// Main Google OAuth handler
const handleGoogleAuth = withDatabase(async (event, context) => {
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
    // Check if Google OAuth is configured
    if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.clientSecret) {
      logOAuthEvent('google_config_missing', {}, 'error');
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Google OAuth not configured',
          message: 'Google authentication is temporarily unavailable. Please try signing in with email and password.'
        })
      };
    }
    
    // Parse request data
    const { accessToken, idToken } = JSON.parse(event.body);
    
    if (!accessToken) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing access token',
          message: 'Google access token is required for authentication.'
        })
      };
    }
    
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    
    logOAuthEvent('google_auth_attempt', {
      clientIP,
      userAgent: event.headers['user-agent']
    }, 'info');
    
    // Verify Google token and get user profile
    const googleProfile = await verifyGoogleToken(accessToken);
    
    // Create or update user
    const user = await createOrUpdateGoogleUser(googleProfile, clientIP);
    
    // Generate authentication tokens
    const tokens = generateTokenPair(user);
    
    logOAuthEvent('google_auth_successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      serviceTier: user.serviceProfile?.tier,
      isNewUser: user.createdAt > new Date(Date.now() - 60000) // Created in last minute
    }, 'info');
    
    // Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Google authentication successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          serviceTier: user.serviceProfile?.tier,
          status: user.status,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin,
          totalBookings: user.totalBookings,
          lifetimeValue: user.lifetimeValue,
          loyaltyPoints: user.loyaltyPoints,
          isNewUser: user.createdAt > new Date(Date.now() - 60000)
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
        }
      })
    };
    
  } catch (error) {
    logOAuthEvent('google_auth_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Google authentication failed',
        message: 'We apologize for the inconvenience. Please try again or sign in with email and password.'
      })
    };
  }
});

module.exports = { handler: handleGoogleAuth };
