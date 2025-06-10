// OAuth Callback Handler for Midas The Lifestyle
// Handles Google OAuth authentication flow

const https = require('https');
const querystring = require('querystring');

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: '2ETI2miG4SavDKllQ3dbRHWmZZ9d8ELMBhAMr8i9UhA',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'ngJ0E-qGe9LqdI5oBKIT7AYaasRRsIoyXXDORgehIjU',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob', // For Netlify OAuth
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { provider, code, state } = event.queryStringParameters || {};

    if (!provider || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameters: provider and code'
        })
      };
    }

    // Handle Google OAuth
    if (provider === 'google') {
      const result = await handleGoogleOAuth(code, state);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Unsupported OAuth provider'
      })
    };

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error during OAuth processing',
        message: error.message
      })
    };
  }
};

// Handle Google OAuth flow
async function handleGoogleOAuth(code, state) {
  try {
    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);
    
    if (!tokenData.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Get user information
    const userInfo = await getUserInfo(tokenData.access_token);
    
    // Process and return user data
    const processedUser = processUserData(userInfo, tokenData);
    
    return {
      success: true,
      user: processedUser,
      message: 'OAuth authentication successful'
    };

  } catch (error) {
    console.error('Google OAuth error:', error);
    throw new Error(`Google OAuth failed: ${error.message}`);
  }
}

// Exchange authorization code for access token
function exchangeCodeForToken(code) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      client_id: OAUTH_CONFIG.google.clientId,
      client_secret: OAUTH_CONFIG.google.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: OAUTH_CONFIG.google.redirectUri
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tokenResponse = JSON.parse(data);
          
          if (res.statusCode === 200) {
            resolve(tokenResponse);
          } else {
            reject(new Error(`Token exchange failed: ${tokenResponse.error_description || tokenResponse.error}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse token response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Token exchange request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Get user information from Google
function getUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/oauth2/v2/userinfo',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const userInfo = JSON.parse(data);
          
          if (res.statusCode === 200) {
            resolve(userInfo);
          } else {
            reject(new Error(`User info request failed: ${userInfo.error_description || userInfo.error}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse user info response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`User info request failed: ${error.message}`));
    });

    req.end();
  });
}

// Process user data for our application
function processUserData(googleUser, tokenData) {
  return {
    id: `google_${googleUser.id}`,
    email: googleUser.email,
    firstName: googleUser.given_name || '',
    lastName: googleUser.family_name || '',
    fullName: googleUser.name || '',
    picture: googleUser.picture || '',
    provider: 'google',
    verified: googleUser.verified_email || false,
    locale: googleUser.locale || 'en',
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type || 'Bearer',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
}

// Validate OAuth state parameter (CSRF protection)
function validateState(state, expectedState) {
  // In production, implement proper state validation
  // For now, we'll just check if state exists
  return state && state.length > 0;
}

// Generate secure state parameter
function generateState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

// Log OAuth activity (for monitoring)
function logOAuthActivity(provider, action, userId, success) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    provider: provider,
    action: action,
    userId: userId,
    success: success,
    userAgent: process.env.HTTP_USER_AGENT || 'unknown'
  };
  
  console.log('OAuth Activity:', JSON.stringify(logEntry));
}

// Error response helper
function createErrorResponse(statusCode, error, message) {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      error: error,
      message: message,
      timestamp: new Date().toISOString()
    })
  };
}

// Success response helper
function createSuccessResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    })
  };
}
