// Production Configuration for Midas The Lifestyle
// Enterprise-grade production environment setup and optimization

const productionConfig = {
  // Application Configuration
  app: {
    name: 'Midas The Lifestyle',
    version: '1.0.0',
    environment: 'production',
    debug: false,
    logLevel: 'info',
    timezone: 'UTC',
    locale: 'en-US',
    currency: 'USD',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 8888,
    host: '0.0.0.0',
    protocol: 'https',
    domain: 'midasthelifestyle.com',
    subdomains: {
      api: 'api.midasthelifestyle.com',
      admin: 'admin.midasthelifestyle.com',
      cdn: 'cdn.midasthelifestyle.com',
      assets: 'assets.midasthelifestyle.com',
    },
    cors: {
      origin: [
        'https://midasthelifestyle.com',
        'https://www.midasthelifestyle.com',
        'https://admin.midasthelifestyle.com',
        'https://midasthelifestyle.netlify.app',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400, // 24 hours
    },
  },

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI_PRODUCTION,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        bufferMaxEntries: 0,
        bufferCommands: false,
        w: 'majority',
        wtimeoutMS: 5000,
        j: true,
        readPreference: 'primary',
        readConcern: { level: 'majority' },
        compressors: ['zstd', 'zlib'],
        ssl: true,
        sslValidate: true,
        authSource: 'admin',
        retryWrites: true,
        retryReads: true,
        appName: 'MidasTheLifestyle-Production',
      },
    },
    redis: {
      host: process.env.REDIS_HOST_PRODUCTION,
      port: process.env.REDIS_PORT_PRODUCTION || 6379,
      password: process.env.REDIS_PASSWORD_PRODUCTION,
      db: 0,
      keyPrefix: 'midas:prod:',
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },
  },

  // Authentication Configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET_PRODUCTION,
      expiresIn: '24h',
      refreshExpiresIn: '7d',
      issuer: 'midasthelifestyle.com',
      audience: 'midasthelifestyle.com',
      algorithm: 'HS256',
    },
    session: {
      secret: process.env.SESSION_SECRET_PRODUCTION,
      name: 'midas.sid',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
        domain: '.midasthelifestyle.com',
      },
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID_PRODUCTION,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET_PRODUCTION,
        redirectUri: 'https://midasthelifestyle.com/auth/google/callback',
        scope: ['profile', 'email'],
      },
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },

  // Payment Configuration
  payments: {
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY_PRODUCTION,
      secretKey: process.env.STRIPE_SECRET_KEY_PRODUCTION,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION,
      apiVersion: '2023-10-16',
      maxNetworkRetries: 3,
      timeout: 30000,
      telemetry: false,
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID_PRODUCTION,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET_PRODUCTION,
      mode: 'live',
      sandbox: false,
    },
    currency: 'USD',
    taxRate: 0.08, // 8% tax rate
    processingFee: 0.029, // 2.9% processing fee
  },

  // Email Configuration
  email: {
    primary: {
      service: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY_PRODUCTION,
      from: {
        email: 'concierge@midasthelifestyle.com',
        name: 'Midas The Lifestyle Concierge',
      },
      replyTo: 'concierge@midasthelifestyle.com',
    },
    backup: {
      service: 'mailgun',
      apiKey: process.env.MAILGUN_API_KEY_PRODUCTION,
      domain: process.env.MAILGUN_DOMAIN_PRODUCTION,
      from: {
        email: 'concierge@midasthelifestyle.com',
        name: 'Midas The Lifestyle Concierge',
      },
    },
    templates: {
      welcome: 'd-1234567890abcdef',
      bookingConfirmation: 'd-abcdef1234567890',
      bookingReminder: 'd-567890abcdef1234',
      passwordReset: 'd-cdef1234567890ab',
      paymentReceipt: 'd-890abcdef1234567',
    },
    rateLimits: {
      perHour: 1000,
      perDay: 10000,
      perUser: 50,
    },
  },

  // SMS Configuration
  sms: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID_PRODUCTION,
      authToken: process.env.TWILIO_AUTH_TOKEN_PRODUCTION,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER_PRODUCTION,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },
    rateLimits: {
      perHour: 100,
      perDay: 500,
      perUser: 10,
    },
  },

  // File Storage Configuration
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_PRODUCTION,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PRODUCTION,
      region: 'us-east-1',
      bucket: 'midas-production-assets',
      cloudFront: {
        distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        domain: 'cdn.midasthelifestyle.com',
      },
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME_PRODUCTION,
      apiKey: process.env.CLOUDINARY_API_KEY_PRODUCTION,
      apiSecret: process.env.CLOUDINARY_API_SECRET_PRODUCTION,
      secure: true,
      folder: 'midas-production',
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      totalStorage: 100 * 1024 * 1024 * 1024, // 100GB
    },
  },

  // Monitoring Configuration
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN_PRODUCTION,
      environment: 'production',
      release: process.env.SENTRY_RELEASE || '1.0.0',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      beforeSend: (event) => {
        // Filter out sensitive information
        if (event.request) {
          delete event.request.headers?.authorization;
          delete event.request.headers?.cookie;
        }
        return event;
      },
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY_PRODUCTION,
      appKey: process.env.DATADOG_APP_KEY_PRODUCTION,
      site: 'datadoghq.com',
      service: 'midas-the-lifestyle',
      version: '1.0.0',
      env: 'production',
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: 'Midas The Lifestyle Production',
      logging: {
        level: 'info',
        enabled: true,
      },
    },
    healthChecks: {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      endpoints: [
        '/health',
        '/api/health',
        '/admin/health',
      ],
    },
  },

  // Analytics Configuration
  analytics: {
    googleAnalytics: {
      measurementId: process.env.GA_MEASUREMENT_ID_PRODUCTION,
      apiSecret: process.env.GA_API_SECRET_PRODUCTION,
    },
    googleTagManager: {
      containerId: process.env.GTM_CONTAINER_ID_PRODUCTION,
    },
    hotjar: {
      siteId: process.env.HOTJAR_SITE_ID_PRODUCTION,
    },
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN_PRODUCTION,
    },
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://www.google.com',
            'https://www.gstatic.com',
            'https://js.stripe.com',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://static.hotjar.com',
            'https://script.hotjar.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://use.fontawesome.com',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://use.fontawesome.com',
            'data:',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'https://cdn.midasthelifestyle.com',
            'https://assets.midasthelifestyle.com',
          ],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com',
            'wss://ws.hotjar.com',
          ],
          frameSrc: [
            "'self'",
            'https://js.stripe.com',
            'https://www.google.com',
            'https://accounts.google.com',
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // days
      historyCount: 5,
    },
  },

  // Performance Configuration
  performance: {
    compression: {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return true;
      },
    },
    caching: {
      static: {
        maxAge: 31536000, // 1 year
        immutable: true,
      },
      api: {
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: 60,
      },
      html: {
        maxAge: 0,
        mustRevalidate: true,
      },
    },
    cdn: {
      enabled: true,
      provider: 'cloudflare',
      zones: {
        static: 'static.midasthelifestyle.com',
        images: 'images.midasthelifestyle.com',
        api: 'api.midasthelifestyle.com',
      },
    },
  },

  // Business Configuration
  business: {
    company: {
      name: 'Midas The Lifestyle',
      legalName: 'Midas The Lifestyle LLC',
      address: {
        street: '1234 Luxury Lane',
        city: 'Washington',
        state: 'DC',
        zipCode: '20001',
        country: 'United States',
      },
      contact: {
        phone: {
          usa: '+1 240 351 0511',
          uae: '+971 58 553 1029',
        },
        email: 'concierge@midasthelifestyle.com',
        website: 'https://midasthelifestyle.com',
      },
      social: {
        instagram: '@midasthelifestyle',
        youtube: '@MidasLifestyle',
        facebook: 'MidasTheLifestyle',
        twitter: '@MidasLifestyle',
      },
    },
    locations: [
      'Washington DC',
      'Maryland',
      'Northern Virginia',
      'Atlanta, Georgia',
      'Houston, Texas',
    ],
    operatingHours: {
      timezone: 'America/New_York',
      weekdays: { open: '08:00', close: '20:00' },
      weekends: { open: '09:00', close: '18:00' },
      holidays: { open: '10:00', close: '16:00' },
    },
    serviceTiers: {
      standard: { name: 'Standard', multiplier: 1.0 },
      premium: { name: 'Premium', multiplier: 1.5 },
      vvip: { name: 'VVIP', multiplier: 2.0 },
    },
  },

  // Feature Flags
  features: {
    realTimeBooking: true,
    guestBooking: true,
    multiCurrency: true,
    calendarSync: true,
    pushNotifications: true,
    advancedAnalytics: true,
    aiRecommendations: true,
    loyaltyProgram: true,
    conciergeChat: true,
    virtualTours: true,
    blockchainVerification: false,
    cryptoPayments: false,
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'json',
    timestamp: true,
    colorize: false,
    maxFiles: 30,
    maxSize: '100m',
    compress: true,
    destinations: {
      file: {
        enabled: true,
        filename: '/var/log/midas/app.log',
        level: 'info',
      },
      console: {
        enabled: false,
        level: 'error',
      },
      syslog: {
        enabled: true,
        host: 'logs.midasthelifestyle.com',
        port: 514,
        facility: 'local0',
      },
    },
    sensitive: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
    ],
  },
};

// Environment validation
const validateConfig = () => {
  const requiredEnvVars = [
    'MONGODB_URI_PRODUCTION',
    'JWT_SECRET_PRODUCTION',
    'STRIPE_SECRET_KEY_PRODUCTION',
    'SENDGRID_API_KEY_PRODUCTION',
    'SENTRY_DSN_PRODUCTION',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Production configuration validated successfully');
};

// Initialize production configuration
const initializeProduction = async () => {
  try {
    validateConfig();
    
    // Set production-specific settings
    process.env.NODE_ENV = 'production';
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    
    // Configure process settings
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
    
    console.log('🚀 Midas The Lifestyle production environment initialized');
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  productionConfig,
  validateConfig,
  initializeProduction,
};
