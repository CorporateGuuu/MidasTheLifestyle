// Payment Intent Creation for Midas The Lifestyle
// Calculates luxury rental pricing, applies taxes, and creates secure Stripe payment intents

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map();

// Luxury rental pricing tiers and tax rates
const PRICING_CONFIG = {
  // Base pricing multipliers for luxury service levels
  serviceTiers: {
    standard: 1.0,
    premium: 1.3,
    vvip: 1.8
  },
  
  // Location-based tax rates and fees
  locationTaxes: {
    'dubai': { tax: 0.05, serviceFee: 0.10, currency: 'AED' },
    'washington-dc': { tax: 0.06, serviceFee: 0.12, currency: 'USD' },
    'houston': { tax: 0.0825, serviceFee: 0.12, currency: 'USD' },
    'atlanta': { tax: 0.089, serviceFee: 0.12, currency: 'USD' },
    'maryland': { tax: 0.06, serviceFee: 0.12, currency: 'USD' },
    'northern-virginia': { tax: 0.057, serviceFee: 0.12, currency: 'USD' }
  },
  
  // Seasonal pricing adjustments
  seasonalMultipliers: {
    peak: 1.5,      // Dec 15 - Jan 15, major holidays
    high: 1.25,     // Summer months, special events
    standard: 1.0,  // Regular periods
    low: 0.85       // Off-peak periods
  },
  
  // Insurance and security deposits
  insurance: {
    cars: { rate: 0.15, deposit: 5000 },
    yachts: { rate: 0.20, deposit: 25000 },
    jets: { rate: 0.25, deposit: 50000 },
    properties: { rate: 0.10, deposit: 10000 }
  }
};

// Log events for monitoring and business intelligence
const logEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'create-payment-intent',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      customerEmail: data.customerEmail ? data.customerEmail.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
    }
  };
  
  console.log(JSON.stringify(logEntry));
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Rate limiting check (10 requests per minute per IP)
const checkRateLimit = (clientIP) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  const clientData = rateLimitStore.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset window
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (clientData.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: clientData.resetTime };
  }
  
  clientData.count++;
  return { allowed: true, remaining: maxRequests - clientData.count };
};

// Calculate seasonal pricing multiplier
const getSeasonalMultiplier = (startDate) => {
  const date = new Date(startDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Peak season: December 15 - January 15
  if ((month === 12 && day >= 15) || (month === 1 && day <= 15)) {
    return PRICING_CONFIG.seasonalMultipliers.peak;
  }
  
  // High season: June - August
  if (month >= 6 && month <= 8) {
    return PRICING_CONFIG.seasonalMultipliers.high;
  }
  
  // Low season: January 16 - March 31
  if ((month === 1 && day > 15) || month === 2 || month === 3) {
    return PRICING_CONFIG.seasonalMultipliers.low;
  }
  
  return PRICING_CONFIG.seasonalMultipliers.standard;
};

// Calculate comprehensive luxury rental pricing
const calculatePricing = (bookingData) => {
  const {
    itemType,
    basePrice,
    days,
    location,
    serviceTier = 'premium',
    startDate,
    addOns = []
  } = bookingData;
  
  // Get location-specific taxes and fees
  const locationConfig = PRICING_CONFIG.locationTaxes[location] || PRICING_CONFIG.locationTaxes['dubai'];
  
  // Calculate base rental cost
  const serviceTierMultiplier = PRICING_CONFIG.serviceTiers[serviceTier];
  const seasonalMultiplier = getSeasonalMultiplier(startDate);
  const adjustedBasePrice = basePrice * serviceTierMultiplier * seasonalMultiplier;
  const subtotal = adjustedBasePrice * days;
  
  // Calculate insurance and deposit
  const insuranceConfig = PRICING_CONFIG.insurance[itemType] || PRICING_CONFIG.insurance.cars;
  const insuranceCost = subtotal * insuranceConfig.rate;
  const securityDeposit = insuranceConfig.deposit;
  
  // Calculate add-ons
  const addOnsCost = addOns.reduce((total, addOn) => total + (addOn.price * days), 0);
  
  // Calculate service fee and taxes
  const serviceSubtotal = subtotal + insuranceCost + addOnsCost;
  const serviceFee = serviceSubtotal * locationConfig.serviceFee;
  const taxableAmount = serviceSubtotal + serviceFee;
  const taxes = taxableAmount * locationConfig.tax;
  
  // Calculate total
  const total = taxableAmount + taxes + securityDeposit;
  
  return {
    breakdown: {
      basePrice: adjustedBasePrice,
      days,
      subtotal,
      insuranceCost,
      addOnsCost,
      serviceFee,
      taxes,
      securityDeposit,
      total
    },
    currency: locationConfig.currency,
    multipliers: {
      serviceTier: serviceTierMultiplier,
      seasonal: seasonalMultiplier
    }
  };
};

// Validate booking data
const validateBookingData = (data) => {
  const required = ['itemId', 'itemName', 'itemType', 'basePrice', 'startDate', 'endDate', 'location', 'customerEmail'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  // Validate dates
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const now = new Date();
  
  if (startDate < now) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }
  
  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, error: 'Invalid email address' };
  }
  
  // Validate price
  if (data.basePrice <= 0) {
    return { valid: false, error: 'Invalid base price' };
  }
  
  return { valid: true };
};

// Main payment intent creation handler
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
    // Rate limiting check
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      logEvent('rate_limit_exceeded', { clientIP }, 'warning');
      return {
        statusCode: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
        },
        body: JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many payment requests. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        })
      };
    }
    
    // Parse request data
    const bookingData = JSON.parse(event.body);
    
    // Validate booking data
    const validation = validateBookingData(bookingData);
    if (!validation.valid) {
      logEvent('validation_failed', { error: validation.error }, 'warning');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validation.error })
      };
    }
    
    // Calculate days
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate comprehensive pricing
    const pricing = calculatePricing({
      ...bookingData,
      days
    });
    
    // Create unique booking ID
    const bookingId = `MIDAS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pricing.breakdown.total * 100), // Convert to cents
      currency: pricing.currency.toLowerCase(),
      metadata: {
        bookingId,
        itemId: bookingData.itemId,
        itemName: bookingData.itemName,
        itemType: bookingData.itemType,
        customerEmail: bookingData.customerEmail,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        location: bookingData.location,
        days: days.toString(),
        serviceTier: bookingData.serviceTier || 'premium',
        source: 'midas-luxury-rentals'
      },
      receipt_email: bookingData.customerEmail,
      description: `Midas The Lifestyle - ${bookingData.itemName} (${days} days)`,
      statement_descriptor: 'MIDAS LUXURY',
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    logEvent('payment_intent_created', {
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: pricing.breakdown.total,
      currency: pricing.currency,
      itemName: bookingData.itemName,
      days
    }, 'info');
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      },
      body: JSON.stringify({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        },
        booking: {
          id: bookingId,
          itemName: bookingData.itemName,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          days,
          location: bookingData.location
        },
        pricing: pricing.breakdown,
        currency: pricing.currency
      })
    };
    
  } catch (error) {
    logEvent('payment_intent_creation_failed', { error: error.message }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Payment intent creation failed',
        message: 'We apologize for the inconvenience. Our VVIP concierge team will contact you within 15 minutes to process your booking manually.'
      })
    };
  }
};
