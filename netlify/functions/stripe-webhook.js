// Stripe Webhook Handler for Midas The Lifestyle
// Processes payment confirmations, failures, and refunds with luxury service standards

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Luxury service error messages
const luxuryErrorMessages = {
  payment_failed: 'We apologize for the inconvenience. Your payment could not be processed. Our VVIP concierge team will contact you within 30 minutes to assist with alternative payment arrangements.',
  booking_conflict: 'We regret to inform you that your selected luxury vehicle is no longer available for the requested dates. Our concierge team will contact you immediately with premium alternatives.',
  system_error: 'We are experiencing a temporary service interruption. Your booking request has been prioritized and our team will contact you within 15 minutes to complete your reservation personally.'
};

// Log events for monitoring and business intelligence
const logEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'stripe-webhook',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      paymentMethod: data.paymentMethod ? 'REDACTED' : undefined,
      customerEmail: data.customerEmail ? data.customerEmail.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
    }
  };
  
  console.log(JSON.stringify(logEntry));
  
  // In production, send to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    // Send to monitoring service
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Send luxury-branded notification email
const sendLuxuryNotification = async (type, data) => {
  try {
    const emailEndpoint = `${process.env.URL || 'https://midasthelifestyle.netlify.app'}/.netlify/functions/booking-confirmation`;
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        ...data,
        source: 'stripe-webhook'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Email notification failed: ${response.status}`);
    }
    
    logEvent('email_sent', { type, recipient: data.customerEmail }, 'info');
  } catch (error) {
    logEvent('email_failed', { type, error: error.message }, 'error');
  }
};

// Process successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const bookingData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      customerEmail: paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail,
      itemName: paymentIntent.metadata?.itemName || 'Luxury Rental',
      bookingId: paymentIntent.metadata?.bookingId,
      startDate: paymentIntent.metadata?.startDate,
      endDate: paymentIntent.metadata?.endDate,
      location: paymentIntent.metadata?.location,
      paymentMethod: 'stripe',
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };
    
    // Send confirmation email to customer
    await sendLuxuryNotification('payment_success', bookingData);
    
    // Send notification to concierge team
    await sendLuxuryNotification('new_booking', {
      ...bookingData,
      priority: 'HIGH',
      conciergeAction: 'PREPARE_LUXURY_VEHICLE'
    });
    
    logEvent('payment_success', {
      paymentIntentId: paymentIntent.id,
      amount: bookingData.amount,
      currency: bookingData.currency,
      itemName: bookingData.itemName
    }, 'info');
    
    return { success: true, bookingData };
  } catch (error) {
    logEvent('payment_success_processing_failed', {
      paymentIntentId: paymentIntent.id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Process failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const failureData = {
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail,
      itemName: paymentIntent.metadata?.itemName || 'Luxury Rental',
      failureReason: paymentIntent.last_payment_error?.message || 'Payment declined',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      timestamp: new Date().toISOString()
    };
    
    // Send failure notification with luxury service recovery
    await sendLuxuryNotification('payment_failed', {
      ...failureData,
      recoveryMessage: luxuryErrorMessages.payment_failed,
      conciergeContact: '+971 58 553 1029',
      alternativePaymentOptions: ['Bank Transfer', 'PayPal', 'Cryptocurrency']
    });
    
    logEvent('payment_failed', {
      paymentIntentId: paymentIntent.id,
      failureReason: failureData.failureReason,
      amount: failureData.amount
    }, 'warning');
    
    return { success: true, failureData };
  } catch (error) {
    logEvent('payment_failure_processing_failed', {
      paymentIntentId: paymentIntent.id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Process refund
const handleRefund = async (refund) => {
  try {
    const refundData = {
      refundId: refund.id,
      paymentIntentId: refund.payment_intent,
      amount: refund.amount / 100,
      currency: refund.currency.toUpperCase(),
      reason: refund.reason || 'requested_by_customer',
      status: refund.status,
      timestamp: new Date().toISOString()
    };
    
    // Get original payment intent for customer details
    const paymentIntent = await stripe.paymentIntents.retrieve(refund.payment_intent);
    
    // Send refund confirmation
    await sendLuxuryNotification('refund_processed', {
      ...refundData,
      customerEmail: paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail,
      itemName: paymentIntent.metadata?.itemName || 'Luxury Rental',
      processingTime: '3-5 business days',
      conciergeMessage: 'Thank you for choosing Midas The Lifestyle. We hope to serve you again soon.'
    });
    
    logEvent('refund_processed', {
      refundId: refund.id,
      amount: refundData.amount,
      reason: refundData.reason
    }, 'info');
    
    return { success: true, refundData };
  } catch (error) {
    logEvent('refund_processing_failed', {
      refundId: refund.id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Main webhook handler
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
    // Verify webhook signature
    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      logEvent('webhook_config_error', { error: 'Missing STRIPE_WEBHOOK_SECRET' }, 'error');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Webhook configuration error' })
      };
    }
    
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err) {
      logEvent('webhook_signature_verification_failed', { error: err.message }, 'error');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }
    
    logEvent('webhook_received', { eventType: stripeEvent.type, eventId: stripeEvent.id }, 'info');
    
    // Process different event types
    let result;
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentSuccess(stripeEvent.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        result = await handlePaymentFailed(stripeEvent.data.object);
        break;
        
      case 'charge.dispute.created':
        logEvent('chargeback_created', {
          chargeId: stripeEvent.data.object.charge,
          amount: stripeEvent.data.object.amount / 100,
          reason: stripeEvent.data.object.reason
        }, 'warning');
        // Handle chargeback - notify legal team
        break;
        
      case 'refund.created':
        result = await handleRefund(stripeEvent.data.object);
        break;
        
      default:
        logEvent('unhandled_webhook_event', { eventType: stripeEvent.type }, 'info');
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        received: true, 
        eventType: stripeEvent.type,
        processed: !!result
      })
    };
    
  } catch (error) {
    logEvent('webhook_processing_error', { error: error.message }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        message: luxuryErrorMessages.system_error
      })
    };
  }
};
