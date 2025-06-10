// OAuth Configuration for Midas The Lifestyle
// Centralized OAuth settings and utilities

class OAuthConfig {
  constructor() {
    this.providers = {
      google: {
        clientId: '2ETI2miG4SavDKllQ3dbRHWmZZ9d8ELMBhAMr8i9UhA',
        redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
        scope: [
          'openid',
          'email',
          'profile'
        ].join(' '),
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        responseType: 'code',
        accessType: 'offline',
        prompt: 'consent'
      }
    };

    this.netlifyConfig = {
      siteUrl: this.getSiteUrl(),
      callbackPath: '/.netlify/functions/oauth-callback',
      successRedirect: '/dashboard',
      errorRedirect: '/auth-error'
    };
  }

  // Get current site URL
  getSiteUrl() {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback for server-side
    return 'https://midasthelifestyle.netlify.app';
  }

  // Generate OAuth authorization URL
  generateAuthUrl(provider, state = null) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: config.responseType,
      access_type: config.accessType,
      prompt: config.prompt,
      state: state || this.generateState()
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  // Generate secure state parameter
  generateState() {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate OAuth state
  validateState(receivedState, expectedState) {
    return receivedState === expectedState && receivedState.length >= 32;
  }

  // Get provider configuration
  getProviderConfig(provider) {
    return this.providers[provider] || null;
  }

  // Check if provider is supported
  isProviderSupported(provider) {
    return provider in this.providers;
  }

  // Get all supported providers
  getSupportedProviders() {
    return Object.keys(this.providers);
  }

  // OAuth flow helpers
  startOAuthFlow(provider) {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Provider ${provider} is not supported`);
    }

    const state = this.generateState();
    
    // Store state in sessionStorage for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`oauth_state_${provider}`, state);
    }

    const authUrl = this.generateAuthUrl(provider, state);
    
    return {
      authUrl,
      state,
      provider
    };
  }

  // Handle OAuth callback
  async handleOAuthCallback(provider, code, state) {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Provider ${provider} is not supported`);
    }

    // Validate state
    const expectedState = typeof window !== 'undefined' 
      ? sessionStorage.getItem(`oauth_state_${provider}`)
      : null;

    if (!this.validateState(state, expectedState)) {
      throw new Error('Invalid OAuth state parameter');
    }

    // Clean up stored state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`oauth_state_${provider}`);
    }

    try {
      // Call our Netlify function to handle the token exchange
      const response = await fetch(`${this.netlifyConfig.siteUrl}${this.netlifyConfig.callbackPath}?provider=${provider}&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OAuth callback failed');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  // Store OAuth tokens securely
  storeTokens(provider, tokens) {
    if (typeof window === 'undefined') return;

    const tokenData = {
      provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      expiresAt: Date.now() + (tokens.expiresIn * 1000),
      createdAt: Date.now()
    };

    // Store in localStorage (in production, consider more secure storage)
    localStorage.setItem(`oauth_tokens_${provider}`, JSON.stringify(tokenData));
  }

  // Retrieve stored tokens
  getStoredTokens(provider) {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`oauth_tokens_${provider}`);
      if (!stored) return null;

      const tokenData = JSON.parse(stored);
      
      // Check if tokens are expired
      if (Date.now() > tokenData.expiresAt) {
        this.clearStoredTokens(provider);
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return null;
    }
  }

  // Clear stored tokens
  clearStoredTokens(provider) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`oauth_tokens_${provider}`);
  }

  // Check if user has valid tokens
  hasValidTokens(provider) {
    const tokens = this.getStoredTokens(provider);
    return tokens !== null;
  }

  // Refresh access token
  async refreshAccessToken(provider) {
    const tokens = this.getStoredTokens(provider);
    if (!tokens || !tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = this.getProviderConfig(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          refresh_token: tokens.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newTokens = await response.json();
      
      // Update stored tokens
      this.storeTokens(provider, {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresIn: newTokens.expires_in,
        tokenType: newTokens.token_type
      });

      return newTokens;

    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearStoredTokens(provider);
      throw error;
    }
  }

  // Revoke OAuth tokens
  async revokeTokens(provider) {
    const tokens = this.getStoredTokens(provider);
    if (!tokens) return;

    const config = this.getProviderConfig(provider);
    if (!config) return;

    try {
      // Revoke the refresh token (which also revokes access token)
      if (tokens.refreshToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.refreshToken}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Token revocation error:', error);
    } finally {
      // Always clear local tokens
      this.clearStoredTokens(provider);
    }
  }

  // Get user info using stored tokens
  async getUserInfo(provider) {
    const tokens = this.getStoredTokens(provider);
    if (!tokens) {
      throw new Error('No valid tokens found');
    }

    const config = this.getProviderConfig(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    try {
      const response = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `${tokens.tokenType} ${tokens.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Try to refresh token if unauthorized
        if (response.status === 401) {
          await this.refreshAccessToken(provider);
          return this.getUserInfo(provider); // Retry with new token
        }
        throw new Error('Failed to fetch user info');
      }

      return await response.json();

    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  }

  // OAuth error handling
  handleOAuthError(error, provider) {
    console.error(`OAuth error for ${provider}:`, error);
    
    // Clear any stored state or tokens on error
    this.clearStoredTokens(provider);
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`oauth_state_${provider}`);
    }

    // Return user-friendly error message
    const errorMessages = {
      'access_denied': 'Access was denied. Please try again.',
      'invalid_request': 'Invalid request. Please try again.',
      'invalid_client': 'Authentication configuration error.',
      'invalid_grant': 'Authentication expired. Please try again.',
      'unauthorized_client': 'Authentication not authorized.',
      'unsupported_grant_type': 'Authentication method not supported.',
      'invalid_scope': 'Requested permissions not available.'
    };

    return errorMessages[error.code] || 'Authentication failed. Please try again.';
  }
}

// Export singleton instance
const oauthConfig = new OAuthConfig();

// Global functions for use in HTML
if (typeof window !== 'undefined') {
  window.oauthConfig = oauthConfig;
}

export default oauthConfig;
