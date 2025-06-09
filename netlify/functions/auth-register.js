// User Registration Endpoint for Midas The Lifestyle
// Secure user registration with email verification and luxury service onboarding

const validator = require('validator');
const { withDatabase } = require('../../database/connection');
const User = require('../../database/models/User');
const { generateTokenPair, checkAuthRateLimit, corsHeaders } = require('./auth-middleware');

// Registration validation rules
const VALIDATION_RULES = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  name: {
    minLength: 2,
    maxLength: 50
  },
  phone: {
    minLength: 10,
    maxLength: 20
  }
};

// Log registration events
const logRegistrationEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'auth-register',
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

// Validate password strength
const validatePassword = (password) => {
  const rules = VALIDATION_RULES.password;
  const errors = [];
  
  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }
  
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// Validate registration data
const validateRegistrationData = (data) => {
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
  } else {
    const passwordErrors = validatePassword(data.password);
    errors.push(...passwordErrors);
  }
  
  // Name validation
  if (!data.firstName) {
    errors.push('First name is required');
  } else if (data.firstName.length < VALIDATION_RULES.name.minLength || 
             data.firstName.length > VALIDATION_RULES.name.maxLength) {
    errors.push(`First name must be between ${VALIDATION_RULES.name.minLength} and ${VALIDATION_RULES.name.maxLength} characters`);
  }
  
  if (!data.lastName) {
    errors.push('Last name is required');
  } else if (data.lastName.length < VALIDATION_RULES.name.minLength || 
             data.lastName.length > VALIDATION_RULES.name.maxLength) {
    errors.push(`Last name must be between ${VALIDATION_RULES.name.minLength} and ${VALIDATION_RULES.name.maxLength} characters`);
  }
  
  // Phone validation (optional)
  if (data.phone && !validator.isMobilePhone(data.phone, 'any', { strictMode: false })) {
    errors.push('Please provide a valid phone number');
  }
  
  // Date of birth validation (optional)
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const now = new Date();
    const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (age < 18) {
      errors.push('You must be at least 18 years old to register');
    } else if (age > 120) {
      errors.push('Please provide a valid date of birth');
    }
  }
  
  // GDPR consent validation
  if (!data.gdprConsent) {
    errors.push('You must accept our privacy policy and terms of service');
  }
  
  return errors;
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/enhanced-email-service`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome_email',
        customerEmail: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        serviceTier: user.serviceProfile.tier,
        verificationToken: user.emailVerificationToken,
        source: 'registration'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Welcome email failed: ${response.status}`);
    }
    
    logRegistrationEvent('welcome_email_sent', {
      userId: user._id,
      email: user.email
    }, 'info');
    
  } catch (error) {
    logRegistrationEvent('welcome_email_failed', {
      userId: user._id,
      error: error.message
    }, 'error');
  }
};

// Determine initial service tier
const determineServiceTier = (registrationData) => {
  // Default to standard tier
  let tier = 'standard';
  
  // Upgrade to premium if certain criteria are met
  if (registrationData.referralCode || 
      registrationData.estimatedBookingValue > 10000 ||
      registrationData.companyName) {
    tier = 'premium';
  }
  
  // VVIP tier requires manual approval
  return tier;
};

// Main registration handler
const registerUser = withDatabase(async (event, context) => {
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
    const rateLimit = checkAuthRateLimit(`register_${clientIP}`, 3, 15 * 60 * 1000); // 3 attempts per 15 minutes
    
    // Parse request data
    const registrationData = JSON.parse(event.body);
    
    logRegistrationEvent('registration_attempt', {
      email: registrationData.email,
      clientIP,
      userAgent: event.headers['user-agent']
    }, 'info');
    
    // Validate registration data
    const validationErrors = validateRegistrationData(registrationData);
    if (validationErrors.length > 0) {
      logRegistrationEvent('registration_validation_failed', {
        errors: validationErrors,
        email: registrationData.email
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
    
    // Check if user already exists
    const existingUser = await User.findByEmail(registrationData.email);
    if (existingUser) {
      logRegistrationEvent('registration_duplicate_email', {
        email: registrationData.email,
        existingUserId: existingUser._id
      }, 'warning');
      
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Email already registered',
          message: 'An account with this email address already exists. Please sign in or use a different email.'
        })
      };
    }
    
    // Determine service tier
    const serviceTier = determineServiceTier(registrationData);
    
    // Create new user
    const user = new User({
      email: registrationData.email.toLowerCase(),
      password: registrationData.password,
      firstName: registrationData.firstName.trim(),
      lastName: registrationData.lastName.trim(),
      phone: registrationData.phone?.trim(),
      dateOfBirth: registrationData.dateOfBirth ? new Date(registrationData.dateOfBirth) : undefined,
      
      // Address information
      address: registrationData.address ? {
        street: registrationData.address.street?.trim(),
        city: registrationData.address.city?.trim(),
        state: registrationData.address.state?.trim(),
        country: registrationData.address.country?.trim(),
        zipCode: registrationData.address.zipCode?.trim()
      } : undefined,
      
      // Service profile
      serviceProfile: {
        tier: serviceTier,
        preferredLocations: registrationData.preferredLocations || [],
        preferredVehicleTypes: registrationData.preferredVehicleTypes || [],
        specialRequests: registrationData.specialRequests || [],
        vipPreferences: {
          chauffeurService: registrationData.vipPreferences?.chauffeurService || false,
          airportPickup: registrationData.vipPreferences?.airportPickup || false,
          customDelivery: registrationData.vipPreferences?.customDelivery || false,
          personalConcierge: registrationData.vipPreferences?.personalConcierge || false
        }
      },
      
      // Communication preferences
      notifications: {
        email: {
          bookingConfirmations: registrationData.notifications?.email?.bookingConfirmations !== false,
          paymentReceipts: registrationData.notifications?.email?.paymentReceipts !== false,
          promotionalOffers: registrationData.notifications?.email?.promotionalOffers !== false,
          serviceUpdates: registrationData.notifications?.email?.serviceUpdates !== false
        },
        sms: {
          bookingReminders: registrationData.notifications?.sms?.bookingReminders || false,
          emergencyAlerts: registrationData.notifications?.sms?.emergencyAlerts !== false
        }
      },
      
      // Privacy & compliance
      gdprConsent: {
        given: registrationData.gdprConsent,
        date: new Date(),
        ipAddress: clientIP
      },
      marketingConsent: {
        given: registrationData.marketingConsent || false,
        date: new Date()
      },
      
      // Account status
      status: 'pending-verification',
      role: 'customer'
    });
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    // Save user
    await user.save();
    
    logRegistrationEvent('user_registered', {
      userId: user._id,
      email: user.email,
      serviceTier: user.serviceProfile.tier,
      role: user.role
    }, 'info');
    
    // Generate authentication tokens
    const tokens = generateTokenPair(user);
    
    // Send welcome email with verification
    await sendWelcomeEmail(user);
    
    // Return success response (don't include sensitive data)
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          serviceTier: user.serviceProfile.tier,
          status: user.status,
          emailVerified: user.emailVerified
        },
        tokens,
        nextSteps: [
          'Check your email for verification instructions',
          'Complete your profile for better service',
          'Browse our luxury rental collection',
          'Contact our concierge team for personalized assistance'
        ]
      })
    };
    
  } catch (error) {
    logRegistrationEvent('registration_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Registration failed',
        message: 'We apologize for the inconvenience. Please try again or contact our support team.'
      })
    };
  }
});

module.exports = { handler: registerUser };
