// Refund Processing for Midas The Lifestyle
// Handles cancellations with luxury service policies and automated refund processing

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Luxury service refund policies
const REFUND_POLICIES = {
  // Refund percentages based on cancellation timing
  cancellationPolicies: {
    cars: {
      '72h+': 1.0,    // 100% refund if cancelled 72+ hours before
      '48h+': 0.75,   // 75% refund if cancelled 48-72 hours before
      '24h+': 0.50,   // 50% refund if cancelled 24-48 hours before
      '24h-': 0.25    // 25% refund if cancelled less than 24 hours before
    },
    yachts: {
      '168h+': 1.0,   // 100% refund if cancelled 7+ days before
      '72h+': 0.80,   // 80% refund if cancelled 3-7 days before
      '48h+': 0.60,   // 60% refund if cancelled 2-3 days before
      '24h+': 0.40,   // 40% refund if cancelled 1-2 days before
      '24h-': 0.20    // 20% refund if cancelled less than 24 hours before
    },
    jets: {
      '168h+': 1.0,   // 100% refund if cancelled 7+ days before
      '72h+': 0.75,   // 75% refund if cancelled 3-7 days before
      '48h+': 0.50,   // 50% refund if cancelled 2-3 days before
      '24h+': 0.30,   // 30% refund if cancelled 1-2 days before
      '24h-': 0.15    // 15% refund if cancelled less than 24 hours before
    },
    properties: {
      '336h+': 1.0,   // 100% refund if cancelled 14+ days before
      '168h+': 0.85,  // 85% refund if cancelled 7-14 days before
      '72h+': 0.70,   // 70% refund if cancelled 3-7 days before
      '48h+': 0.50,   // 50% refund if cancelled 2-3 days before
      '24h-': 0.25    // 25% refund if cancelled less than 48 hours before
    }
  },
  
  // Non-refundable fees
  nonRefundableFees: {
    processingFee: 0.05,      // 5% processing fee always retained
    conciergeServiceFee: 100,  // Fixed concierge service fee (in base currency)
    insuranceFee: 0.10        // 10% insurance fee retained for processing
  },
  
  // Special circumstances for full refunds
  fullRefundReasons: [
    'vehicle_unavailable',
    'weather_cancellation',
    'force_majeure',
    'medical_emergency',
    'government_restriction'
  ]
};

// Log events for monitoring and business intelligence
const logEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'process-refund',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      customerEmail: data.customerEmail ? data.customerEmail.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
      paymentIntentId: data.paymentIntentId ? `***${data.paymentIntentId.slice(-4)}` : undefined
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

// Calculate refund amount based on luxury service policies
const calculateRefundAmount = (bookingData, cancellationReason) => {
  const {
    originalAmount,
    itemType,
    startDate,
    currency,
    specialCircumstances = false
  } = bookingData;
  
  // Check for full refund circumstances
  if (specialCircumstances || REFUND_POLICIES.fullRefundReasons.includes(cancellationReason)) {
    return {
      refundAmount: originalAmount,
      refundPercentage: 1.0,
      reason: 'Full refund due to special circumstances',
      policyApplied: 'full_refund_policy'
    };
  }
  
  // Calculate hours until start date
  const now = new Date();
  const startDateTime = new Date(startDate);
  const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);
  
  // Get applicable policy for item type
  const policies = REFUND_POLICIES.cancellationPolicies[itemType] || REFUND_POLICIES.cancellationPolicies.cars;
  
  // Determine refund percentage based on timing
  let refundPercentage = 0;
  let policyKey = '24h-';
  
  if (hoursUntilStart >= 336) {
    refundPercentage = policies['336h+'] || policies['168h+'] || policies['72h+'] || 1.0;
    policyKey = '336h+';
  } else if (hoursUntilStart >= 168) {
    refundPercentage = policies['168h+'] || policies['72h+'] || 1.0;
    policyKey = '168h+';
  } else if (hoursUntilStart >= 72) {
    refundPercentage = policies['72h+'] || 0.75;
    policyKey = '72h+';
  } else if (hoursUntilStart >= 48) {
    refundPercentage = policies['48h+'] || 0.50;
    policyKey = '48h+';
  } else if (hoursUntilStart >= 24) {
    refundPercentage = policies['24h+'] || 0.25;
    policyKey = '24h+';
  } else {
    refundPercentage = policies['24h-'] || 0.25;
    policyKey = '24h-';
  }
  
  // Calculate non-refundable fees
  const processingFee = originalAmount * REFUND_POLICIES.nonRefundableFees.processingFee;
  const conciergeServiceFee = REFUND_POLICIES.nonRefundableFees.conciergeServiceFee;
  const insuranceFee = originalAmount * REFUND_POLICIES.nonRefundableFees.insuranceFee;
  
  // Calculate refund amount
  const grossRefund = originalAmount * refundPercentage;
  const totalFees = processingFee + conciergeServiceFee + insuranceFee;
  const netRefund = Math.max(0, grossRefund - totalFees);
  
  return {
    refundAmount: netRefund,
    refundPercentage,
    grossRefund,
    fees: {
      processing: processingFee,
      conciergeService: conciergeServiceFee,
      insurance: insuranceFee,
      total: totalFees
    },
    hoursUntilStart: Math.round(hoursUntilStart),
    policyApplied: policyKey,
    reason: `${Math.round(refundPercentage * 100)}% refund per ${itemType} cancellation policy`
  };
};

// Send luxury-branded refund notification
const sendRefundNotification = async (refundData) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/booking-confirmation`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'refund_confirmation',
        ...refundData,
        source: 'refund-processor'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Email notification failed: ${response.status}`);
    }
    
    logEvent('refund_email_sent', { 
      refundId: refundData.refundId,
      customerEmail: refundData.customerEmail 
    }, 'info');
  } catch (error) {
    logEvent('refund_email_failed', { 
      refundId: refundData.refundId,
      error: error.message 
    }, 'error');
  }
};

// Validate refund request
const validateRefundRequest = (data) => {
  const required = ['paymentIntentId', 'bookingId', 'cancellationReason', 'customerEmail'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, error: 'Invalid email address' };
  }
  
  return { valid: true };
};

// Main refund processing handler
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
    // Parse request data
    const refundRequest = JSON.parse(event.body);
    
    // Validate refund request
    const validation = validateRefundRequest(refundRequest);
    if (!validation.valid) {
      logEvent('refund_validation_failed', { error: validation.error }, 'warning');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validation.error })
      };
    }
    
    // Retrieve original payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(refundRequest.paymentIntentId);
    
    if (!paymentIntent) {
      logEvent('payment_intent_not_found', { 
        paymentIntentId: refundRequest.paymentIntentId 
      }, 'error');
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Payment intent not found' })
      };
    }
    
    // Extract booking data from payment intent metadata
    const bookingData = {
      originalAmount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      itemType: paymentIntent.metadata.itemType || 'cars',
      itemName: paymentIntent.metadata.itemName,
      startDate: paymentIntent.metadata.startDate,
      customerEmail: paymentIntent.receipt_email || paymentIntent.metadata.customerEmail,
      bookingId: paymentIntent.metadata.bookingId
    };
    
    // Calculate refund amount based on luxury service policies
    const refundCalculation = calculateRefundAmount(bookingData, refundRequest.cancellationReason);
    
    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: refundRequest.paymentIntentId,
      amount: Math.round(refundCalculation.refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        bookingId: bookingData.bookingId,
        cancellationReason: refundRequest.cancellationReason,
        refundPercentage: refundCalculation.refundPercentage.toString(),
        policyApplied: refundCalculation.policyApplied,
        processedBy: 'automated-system'
      }
    });
    
    // Prepare refund notification data
    const refundNotificationData = {
      refundId: refund.id,
      bookingId: bookingData.bookingId,
      itemName: bookingData.itemName,
      originalAmount: bookingData.originalAmount,
      refundAmount: refundCalculation.refundAmount,
      currency: bookingData.currency,
      customerEmail: bookingData.customerEmail,
      cancellationReason: refundRequest.cancellationReason,
      refundCalculation,
      processingTime: '3-5 business days',
      conciergeMessage: 'Thank you for choosing Midas The Lifestyle. We hope to serve you again in the future.'
    };
    
    // Send refund confirmation email
    await sendRefundNotification(refundNotificationData);
    
    logEvent('refund_processed_successfully', {
      refundId: refund.id,
      paymentIntentId: refundRequest.paymentIntentId,
      bookingId: bookingData.bookingId,
      refundAmount: refundCalculation.refundAmount,
      refundPercentage: refundCalculation.refundPercentage,
      cancellationReason: refundRequest.cancellationReason
    }, 'info');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        refund: {
          id: refund.id,
          amount: refundCalculation.refundAmount,
          currency: bookingData.currency,
          status: refund.status
        },
        calculation: refundCalculation,
        message: 'Your refund has been processed successfully. You will receive a confirmation email shortly.'
      })
    };
    
  } catch (error) {
    logEvent('refund_processing_failed', { 
      error: error.message,
      paymentIntentId: refundRequest?.paymentIntentId 
    }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Refund processing failed',
        message: 'We apologize for the inconvenience. Our VVIP concierge team will process your refund manually and contact you within 2 hours.'
      })
    };
  }
};
