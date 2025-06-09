// PayPal IPN Handler for Midas The Lifestyle
// Processes PayPal Instant Payment Notifications with luxury service standards

const https = require('https');
const querystring = require('querystring');

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// PayPal sandbox/production URLs
const PAYPAL_VERIFY_URL = {
  sandbox: 'ipnpb.sandbox.paypal.com',
  production: 'ipnpb.paypal.com'
};

// Luxury service error messages
const luxuryErrorMessages = {
  payment_failed: 'We apologize for the inconvenience with your PayPal payment. Our VVIP concierge team will contact you within 30 minutes to assist with alternative payment arrangements.',
  verification_failed: 'PayPal payment verification failed. Our security team will review this transaction and contact you within 1 hour.',
  system_error: 'We are experiencing a temporary service interruption. Your PayPal payment is being processed manually by our team.'
};

// Log events for monitoring and business intelligence
const logEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'paypal-ipn',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      payerEmail: data.payerEmail ? data.payerEmail.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
      transactionId: data.transactionId ? `***${data.transactionId.slice(-4)}` : undefined
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

// Verify IPN with PayPal
const verifyIPN = (ipnData) => {
  return new Promise((resolve, reject) => {
    const verifyData = 'cmd=_notify-validate&' + ipnData;
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = PAYPAL_VERIFY_URL[isProduction ? 'production' : 'sandbox'];
    
    const options = {
      hostname,
      port: 443,
      path: '/cgi-bin/webscr',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(verifyData),
        'User-Agent': 'Midas-The-Lifestyle-IPN-Verification'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data === 'VERIFIED') {
          resolve(true);
        } else if (data === 'INVALID') {
          resolve(false);
        } else {
          reject(new Error(`Unexpected PayPal response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(verifyData);
    req.end();
  });
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
        source: 'paypal-ipn'
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

// Process successful PayPal payment
const handlePayPalSuccess = async (ipnData) => {
  try {
    const bookingData = {
      transactionId: ipnData.txn_id,
      paypalPaymentId: ipnData.payment_id || ipnData.txn_id,
      amount: parseFloat(ipnData.mc_gross),
      currency: ipnData.mc_currency,
      customerEmail: ipnData.payer_email,
      payerName: `${ipnData.first_name} ${ipnData.last_name}`,
      itemName: ipnData.item_name || 'Luxury Rental',
      itemNumber: ipnData.item_number,
      paymentStatus: ipnData.payment_status,
      paymentMethod: 'paypal',
      payerCountry: ipnData.address_country_code,
      timestamp: new Date().toISOString(),
      // Custom fields from booking system
      bookingId: ipnData.custom,
      startDate: ipnData.option_selection1,
      endDate: ipnData.option_selection2,
      location: ipnData.option_selection3
    };
    
    // Send confirmation email to customer
    await sendLuxuryNotification('payment_success', {
      ...bookingData,
      paymentMethod: 'PayPal',
      confirmationMessage: 'Your PayPal payment has been successfully processed. Our concierge team will contact you within 1 hour to finalize your luxury rental arrangements.'
    });
    
    // Send notification to concierge team
    await sendLuxuryNotification('new_booking', {
      ...bookingData,
      priority: 'HIGH',
      conciergeAction: 'PREPARE_LUXURY_VEHICLE',
      paymentVerified: true,
      paymentProcessor: 'PayPal'
    });
    
    logEvent('paypal_payment_success', {
      transactionId: ipnData.txn_id,
      amount: bookingData.amount,
      currency: bookingData.currency,
      itemName: bookingData.itemName,
      paymentStatus: ipnData.payment_status
    }, 'info');
    
    return { success: true, bookingData };
  } catch (error) {
    logEvent('paypal_success_processing_failed', {
      transactionId: ipnData.txn_id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Process PayPal refund
const handlePayPalRefund = async (ipnData) => {
  try {
    const refundData = {
      transactionId: ipnData.txn_id,
      parentTransactionId: ipnData.parent_txn_id,
      refundAmount: Math.abs(parseFloat(ipnData.mc_gross)),
      currency: ipnData.mc_currency,
      customerEmail: ipnData.payer_email,
      reasonCode: ipnData.reason_code,
      timestamp: new Date().toISOString()
    };
    
    // Send refund confirmation
    await sendLuxuryNotification('refund_processed', {
      ...refundData,
      refundMethod: 'PayPal',
      processingTime: '3-5 business days',
      conciergeMessage: 'Your refund has been processed through PayPal. Thank you for choosing Midas The Lifestyle.'
    });
    
    logEvent('paypal_refund_processed', {
      transactionId: ipnData.txn_id,
      parentTransactionId: ipnData.parent_txn_id,
      refundAmount: refundData.refundAmount,
      reasonCode: ipnData.reason_code
    }, 'info');
    
    return { success: true, refundData };
  } catch (error) {
    logEvent('paypal_refund_processing_failed', {
      transactionId: ipnData.txn_id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Process PayPal chargeback/dispute
const handlePayPalDispute = async (ipnData) => {
  try {
    const disputeData = {
      caseId: ipnData.case_id,
      transactionId: ipnData.txn_id,
      caseType: ipnData.case_type,
      reasonCode: ipnData.reason_code,
      amount: parseFloat(ipnData.mc_gross),
      currency: ipnData.mc_currency,
      timestamp: new Date().toISOString()
    };
    
    // Alert legal/finance team
    await sendLuxuryNotification('dispute_created', {
      ...disputeData,
      urgency: 'HIGH',
      actionRequired: 'Legal team review required within 24 hours',
      customerService: 'Escalate to senior concierge for resolution'
    });
    
    logEvent('paypal_dispute_created', {
      caseId: ipnData.case_id,
      caseType: ipnData.case_type,
      reasonCode: ipnData.reason_code,
      amount: disputeData.amount
    }, 'warning');
    
    return { success: true, disputeData };
  } catch (error) {
    logEvent('paypal_dispute_processing_failed', {
      caseId: ipnData.case_id,
      error: error.message
    }, 'error');
    throw error;
  }
};

// Main IPN handler
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
    // Parse IPN data
    const ipnData = querystring.parse(event.body);
    
    logEvent('ipn_received', {
      paymentStatus: ipnData.payment_status,
      transactionType: ipnData.txn_type,
      transactionId: ipnData.txn_id
    }, 'info');
    
    // Verify IPN with PayPal
    const isVerified = await verifyIPN(event.body);
    
    if (!isVerified) {
      logEvent('ipn_verification_failed', {
        transactionId: ipnData.txn_id,
        paymentStatus: ipnData.payment_status
      }, 'error');
      
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'IPN verification failed',
          message: luxuryErrorMessages.verification_failed
        })
      };
    }
    
    logEvent('ipn_verified', { transactionId: ipnData.txn_id }, 'info');
    
    // Process different payment statuses and transaction types
    let result;
    
    if (ipnData.payment_status === 'Completed' && ipnData.txn_type === 'web_accept') {
      result = await handlePayPalSuccess(ipnData);
    } else if (ipnData.payment_status === 'Refunded' || ipnData.txn_type === 'adjustment') {
      result = await handlePayPalRefund(ipnData);
    } else if (ipnData.case_type) {
      result = await handlePayPalDispute(ipnData);
    } else {
      logEvent('unhandled_ipn_type', {
        paymentStatus: ipnData.payment_status,
        transactionType: ipnData.txn_type,
        transactionId: ipnData.txn_id
      }, 'info');
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        received: true,
        verified: true,
        processed: !!result,
        transactionId: ipnData.txn_id
      })
    };
    
  } catch (error) {
    logEvent('ipn_processing_error', { error: error.message }, 'error');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'IPN processing failed',
        message: luxuryErrorMessages.system_error
      })
    };
  }
};
