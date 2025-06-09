// Security Headers Configuration for Midas The Lifestyle
// Enterprise-grade security headers for luxury platform protection

/**
 * Security Headers Configuration
 * Implements comprehensive security measures for the luxury rental platform
 */

// Content Security Policy for maximum security
const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React and Material-UI
    "'unsafe-eval'", // Required for development builds
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://js.stripe.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://connect.facebook.net',
    'https://static.hotjar.com',
    'https://script.hotjar.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Material-UI and styled-components
    'https://fonts.googleapis.com',
    'https://use.fontawesome.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'https://use.fontawesome.com',
    'data:',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://static.hotjar.com',
    'https://script.hotjar.com',
    'https://res.cloudinary.com',
    'https://images.unsplash.com',
    'https://via.placeholder.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://region1.google-analytics.com',
    'https://stats.g.doubleclick.net',
    'https://api.sendgrid.com',
    'https://api.mailgun.net',
    'https://api.twilio.com',
    'https://ws.hotjar.com',
    'https://vc.hotjar.io',
    'wss://ws.hotjar.com',
  ],
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://www.google.com',
    'https://accounts.google.com',
    'https://www.facebook.com',
    'https://vars.hotjar.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
  'block-all-mixed-content': [],
};

// Convert CSP object to string
const cspString = Object.entries(contentSecurityPolicy)
  .map(([directive, sources]) => {
    if (sources.length === 0) {
      return directive;
    }
    return `${directive} ${sources.join(' ')}`;
  })
  .join('; ');

// Security headers configuration
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': cspString,
  
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // X-Frame-Options (prevent clickjacking)
  'X-Frame-Options': 'DENY',
  
  // X-Content-Type-Options (prevent MIME sniffing)
  'X-Content-Type-Options': 'nosniff',
  
  // X-XSS-Protection (legacy XSS protection)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy (control referrer information)
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (control browser features)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'picture-in-picture=()',
  ].join(', '),
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'require-corp',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Server identification (security through obscurity)
  'Server': 'Midas-Security-Gateway',
  
  // Remove server information
  'X-Powered-By': '',
  
  // Cache control for security-sensitive pages
  'Cache-Control': 'no-cache, no-store, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Admin-specific security headers
const adminSecurityHeaders = {
  ...securityHeaders,
  
  // Stricter CSP for admin pages
  'Content-Security-Policy': cspString.replace(
    "'unsafe-inline'",
    "'nonce-admin-inline'"
  ),
  
  // Additional admin protection
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Admin-Protection': 'enabled',
  
  // Stricter cache control for admin
  'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
};

// API-specific security headers
const apiSecurityHeaders = {
  // Basic security headers for API
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  
  // API-specific headers
  'X-API-Version': '1.0',
  'X-Rate-Limit-Remaining': '100',
  'X-Rate-Limit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  
  // CORS headers (will be set dynamically)
  'Access-Control-Allow-Origin': 'https://midasthelifestyle.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  
  // Cache control for API responses
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Static assets security headers
const staticAssetsHeaders = {
  // Basic security
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  
  // Long-term caching for static assets
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Expires': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString(),
  
  // Compression
  'Vary': 'Accept-Encoding',
};

// Security middleware function for Netlify Edge Functions
const applySecurityHeaders = (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  let headers = {};
  
  // Apply appropriate headers based on path
  if (pathname.startsWith('/admin')) {
    headers = adminSecurityHeaders;
  } else if (pathname.startsWith('/api') || pathname.startsWith('/.netlify/functions')) {
    headers = apiSecurityHeaders;
  } else if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
    headers = staticAssetsHeaders;
  } else {
    headers = securityHeaders;
  }
  
  return headers;
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
};

// Admin rate limiting (stricter)
const adminRateLimitConfig = {
  ...rateLimitConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit admin requests
  message: {
    error: 'Too many admin requests, please try again later.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 300,
  },
};

// API rate limiting
const apiRateLimitConfig = {
  ...rateLimitConfig,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for API
  message: {
    error: 'API rate limit exceeded, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
};

// Export configurations
module.exports = {
  securityHeaders,
  adminSecurityHeaders,
  apiSecurityHeaders,
  staticAssetsHeaders,
  applySecurityHeaders,
  rateLimitConfig,
  adminRateLimitConfig,
  apiRateLimitConfig,
  contentSecurityPolicy,
  cspString,
};
