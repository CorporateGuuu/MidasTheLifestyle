// Enhanced Email Service with Failover for Midas The Lifestyle
// Comprehensive email delivery system with multiple providers and retry logic

const nodemailer = require('nodemailer');

// CORS headers for luxury rental website
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Email service providers configuration
const EMAIL_PROVIDERS = {
  primary: {
    name: 'Gmail SMTP',
    transporter: null,
    config: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    }
  },
  secondary: {
    name: 'SendGrid',
    transporter: null,
    config: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    }
  },
  tertiary: {
    name: 'Mailgun',
    transporter: null,
    config: {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS
      }
    }
  }
};

// Email queue for retry logic
const emailQueue = new Map();
const deliveryAttempts = new Map();

// Email analytics tracking
const emailAnalytics = {
  sent: 0,
  failed: 0,
  bounced: 0,
  opened: 0,
  clicked: 0,
  lastReset: Date.now()
};

// Initialize email transporters
const initializeTransporters = () => {
  Object.keys(EMAIL_PROVIDERS).forEach(key => {
    const provider = EMAIL_PROVIDERS[key];
    if (provider.config.auth.user && provider.config.auth.pass) {
      try {
        provider.transporter = nodemailer.createTransporter(provider.config);
        console.log(`✅ ${provider.name} transporter initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${provider.name}:`, error.message);
      }
    } else {
      console.warn(`⚠️ ${provider.name} credentials not configured`);
    }
  });
};

// Log email events for monitoring and analytics
const logEmailEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'enhanced-email-service',
    eventType,
    severity,
    data: {
      ...data,
      // Remove sensitive data from logs
      recipient: data.recipient ? data.recipient.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
    }
  };
  
  console.log(JSON.stringify(logEntry));
  
  // Update analytics
  updateEmailAnalytics(eventType);
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Update email analytics
const updateEmailAnalytics = (eventType) => {
  switch (eventType) {
    case 'email_sent':
      emailAnalytics.sent++;
      break;
    case 'email_failed':
      emailAnalytics.failed++;
      break;
    case 'email_bounced':
      emailAnalytics.bounced++;
      break;
    case 'email_opened':
      emailAnalytics.opened++;
      break;
    case 'email_clicked':
      emailAnalytics.clicked++;
      break;
  }
  
  // Reset analytics daily
  const now = Date.now();
  if (now - emailAnalytics.lastReset > 86400000) { // 24 hours
    Object.keys(emailAnalytics).forEach(key => {
      if (key !== 'lastReset') emailAnalytics[key] = 0;
    });
    emailAnalytics.lastReset = now;
  }
};

// Send email with failover logic
const sendEmailWithFailover = async (emailData) => {
  const providers = ['primary', 'secondary', 'tertiary'];
  let lastError = null;
  
  for (const providerKey of providers) {
    const provider = EMAIL_PROVIDERS[providerKey];
    
    if (!provider.transporter) {
      continue;
    }
    
    try {
      logEmailEvent('email_attempt', {
        provider: provider.name,
        recipient: emailData.to,
        subject: emailData.subject
      }, 'info');
      
      const result = await provider.transporter.sendMail(emailData);
      
      logEmailEvent('email_sent', {
        provider: provider.name,
        recipient: emailData.to,
        subject: emailData.subject,
        messageId: result.messageId
      }, 'info');
      
      return {
        success: true,
        provider: provider.name,
        messageId: result.messageId
      };
      
    } catch (error) {
      lastError = error;
      logEmailEvent('email_provider_failed', {
        provider: provider.name,
        recipient: emailData.to,
        error: error.message
      }, 'warning');
      
      // Continue to next provider
      continue;
    }
  }
  
  // All providers failed
  logEmailEvent('email_failed', {
    recipient: emailData.to,
    subject: emailData.subject,
    error: lastError?.message || 'All providers failed'
  }, 'error');
  
  throw new Error(`Email delivery failed: ${lastError?.message || 'All providers unavailable'}`);
};

// Retry failed emails with exponential backoff
const retryFailedEmail = async (emailId) => {
  const emailData = emailQueue.get(emailId);
  const attempts = deliveryAttempts.get(emailId) || 0;
  
  if (!emailData || attempts >= 3) {
    emailQueue.delete(emailId);
    deliveryAttempts.delete(emailId);
    return false;
  }
  
  try {
    // Exponential backoff: 1min, 5min, 15min
    const delay = Math.pow(5, attempts) * 60 * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await sendEmailWithFailover(emailData);
    
    emailQueue.delete(emailId);
    deliveryAttempts.delete(emailId);
    
    logEmailEvent('email_retry_success', {
      emailId,
      attempts: attempts + 1,
      recipient: emailData.to
    }, 'info');
    
    return true;
  } catch (error) {
    deliveryAttempts.set(emailId, attempts + 1);
    
    logEmailEvent('email_retry_failed', {
      emailId,
      attempts: attempts + 1,
      error: error.message
    }, 'warning');
    
    return false;
  }
};

// Email template management
const EMAIL_TEMPLATES = {
  booking_confirmation: {
    subject: '🏆 Booking Confirmed - {{itemName}} | Midas The Lifestyle',
    template: 'luxury-booking-confirmation'
  },
  payment_success: {
    subject: '💳 Payment Confirmed - {{itemName}} | Midas The Lifestyle',
    template: 'luxury-payment-confirmation'
  },
  payment_failed: {
    subject: '⚠️ Payment Issue - {{itemName}} | Midas The Lifestyle',
    template: 'luxury-payment-failed'
  },
  refund_processed: {
    subject: '💰 Refund Processed - {{itemName}} | Midas The Lifestyle',
    template: 'luxury-refund-confirmation'
  },
  new_booking: {
    subject: '🚨 NEW BOOKING - {{itemName}} | Concierge Alert',
    template: 'concierge-booking-alert'
  }
};

// Process email template with data
const processEmailTemplate = (templateType, data) => {
  const template = EMAIL_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Unknown email template: ${templateType}`);
  }
  
  let subject = template.subject;
  Object.keys(data).forEach(key => {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  });
  
  // Generate HTML content based on template type
  const htmlContent = generateEmailHTML(templateType, data);
  
  return {
    subject,
    html: htmlContent,
    text: generateEmailText(templateType, data)
  };
};

// Generate HTML email content
const generateEmailHTML = (templateType, data) => {
  const baseStyle = `
    font-family: 'Arial', sans-serif; 
    max-width: 600px; 
    margin: 0 auto; 
    background: #000; 
    color: #fff; 
    padding: 20px;
  `;
  
  const headerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas The Lifestyle</h1>
      <p style="color: #fff; margin: 5px 0;">Bespoke Luxury Rentals</p>
    </div>
  `;
  
  const footerHTML = `
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
      <p style="color: #888; font-size: 12px;">
        Midas The Lifestyle | Dubai | Washington DC | Houston TX | Atlanta | Maryland | Northern Virginia
      </p>
    </div>
  `;
  
  // Template-specific content
  let contentHTML = '';
  
  switch (templateType) {
    case 'booking_confirmation':
      contentHTML = `
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 15px;">✅</div>
            <h2 style="color: #D4AF37; margin: 0 0 10px 0;">Booking Confirmed!</h2>
            <p style="color: #888; margin: 0;">Your luxury experience has been reserved</p>
          </div>
          <div style="background: #222; padding: 20px; border-radius: 8px;">
            <p style="color: #D4AF37; font-weight: bold;">Booking Details:</p>
            <p style="color: #fff;">Item: ${data.itemName || 'Luxury Rental'}</p>
            <p style="color: #fff;">Amount: ${data.currency || '$'} ${data.amount || '0'}</p>
            <p style="color: #fff;">Booking ID: ${data.bookingId || 'N/A'}</p>
          </div>
        </div>
      `;
      break;
      
    case 'payment_success':
      contentHTML = `
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 15px;">💳</div>
            <h2 style="color: #D4AF37; margin: 0 0 10px 0;">Payment Confirmed!</h2>
            <p style="color: #888; margin: 0;">Your payment has been successfully processed</p>
          </div>
        </div>
      `;
      break;
      
    default:
      contentHTML = `
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h2 style="color: #D4AF37;">Midas The Lifestyle</h2>
          <p style="color: #fff;">Thank you for choosing our luxury rental services.</p>
        </div>
      `;
  }
  
  return `<div style="${baseStyle}">${headerHTML}${contentHTML}${footerHTML}</div>`;
};

// Generate plain text email content
const generateEmailText = (templateType, data) => {
  return `
Midas The Lifestyle - Bespoke Luxury Rentals

${data.itemName || 'Luxury Rental Service'}
Amount: ${data.currency || '$'} ${data.amount || '0'}
Booking ID: ${data.bookingId || 'N/A'}

Thank you for choosing Midas The Lifestyle.

Contact us:
Phone: +971 58 553 1029 (UAE) | +1 240 351 0511 (USA)
Email: concierge@midasthelifestyle.com

Midas The Lifestyle | Dubai | Washington DC | Houston TX | Atlanta | Maryland | Northern Virginia
  `;
};

// Main email service handler
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
    // Initialize transporters if not already done
    if (!EMAIL_PROVIDERS.primary.transporter) {
      initializeTransporters();
    }
    
    const emailRequest = JSON.parse(event.body);
    
    // Validate required fields
    if (!emailRequest.type || !emailRequest.customerEmail) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: type, customerEmail' })
      };
    }
    
    // Process email template
    const emailContent = processEmailTemplate(emailRequest.type, emailRequest);
    
    // Prepare email data
    const emailData = {
      from: `"Midas The Lifestyle" <${process.env.EMAIL_USER || 'noreply@midasthelifestyle.com'}>`,
      to: emailRequest.customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      headers: {
        'X-Midas-Type': emailRequest.type,
        'X-Midas-Source': emailRequest.source || 'website'
      }
    };
    
    // Send email with failover
    const result = await sendEmailWithFailover(emailData);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        provider: result.provider,
        messageId: result.messageId,
        message: 'Email sent successfully'
      })
    };
    
  } catch (error) {
    // Add to retry queue
    const emailId = `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    emailQueue.set(emailId, JSON.parse(event.body));
    deliveryAttempts.set(emailId, 0);
    
    // Schedule retry
    setTimeout(() => retryFailedEmail(emailId), 60000); // Retry in 1 minute
    
    logEmailEvent('email_queued_for_retry', { emailId }, 'warning');
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Email delivery failed',
        message: 'Email has been queued for retry. Our team will ensure delivery.',
        emailId
      })
    };
  }
};
