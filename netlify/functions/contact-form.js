// Netlify Function for Contact Form Processing
// Handles contact form submissions for Midas Lifestyle

// const nodemailer = require('nodemailer'); // Temporarily disabled for testing

// Email configuration (temporarily disabled for testing)
const createTransporter = () => {
  // return nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });
  return null; // Temporarily disabled
};

// Spam protection - simple honeypot and rate limiting
const validateSubmission = (body) => {
  const { name, email, phone, service, message, honeypot } = body;
  
  // Honeypot field should be empty
  if (honeypot && honeypot.trim() !== '') {
    return { valid: false, error: 'Spam detected' };
  }
  
  // Required fields validation
  if (!name || !email || !service || !message) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Message length validation
  if (message.length < 10) {
    return { valid: false, error: 'Message too short' };
  }
  
  return { valid: true };
};

// Format email content for luxury brand
const formatEmailContent = (formData) => {
  const { name, email, phone, service, message } = formData;
  
  return {
    subject: `🏆 New VVIP Inquiry - ${service} | Midas Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">Bespoke Luxury Rentals</p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h2 style="color: #D4AF37; margin-top: 0;">New VVIP Client Inquiry</h2>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #D4AF37; margin-bottom: 10px;">Client Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #D4AF37;">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Service Interest:</strong> <span style="color: #D4AF37;">${service}</span></p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #D4AF37; margin-bottom: 10px;">Requirements</h3>
            <div style="background: #222; padding: 15px; border-radius: 5px; border-left: 3px solid #D4AF37;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #D4AF37; font-weight: bold;">⏰ Response Time: Within 2 hours for VVIP clients</p>
            <p style="font-size: 12px; color: #888;">
              Submitted: ${new Date().toLocaleString()}<br>
              Source: Midas Lifestyle Website
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 12px;">
            Midas Lifestyle | Office #22, JAC Building, Al Quoz 1, Dubai<br>
            Phone: +971 123 456 789 | Email: concierge@midaslifestyle.com
          </p>
        </div>
      </div>
    `
  };
};

// Auto-reply email for customers
const formatAutoReply = (formData) => {
  const { name, service } = formData;
  
  return {
    subject: `🏆 Thank you for your inquiry - Midas Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">Bespoke Luxury Rentals</p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h2 style="color: #D4AF37; margin-top: 0;">Dear ${name},</h2>
          
          <p>Thank you for your interest in our <strong style="color: #D4AF37;">${service}</strong> services.</p>
          
          <p>Your inquiry has been received by our VVIP concierge team, and we will respond within <strong style="color: #D4AF37;">2 hours</strong> with a personalized quote and availability.</p>
          
          <div style="background: #222; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #D4AF37;">
            <h3 style="color: #D4AF37; margin-top: 0;">What happens next?</h3>
            <ul style="color: #fff; padding-left: 20px;">
              <li>Our concierge team reviews your requirements</li>
              <li>We prepare a bespoke quote with available options</li>
              <li>You receive a personalized response via email or phone</li>
              <li>We arrange viewing and booking details</li>
            </ul>
          </div>
          
          <p>For immediate assistance, please contact us:</p>
          <p style="color: #D4AF37;">
            📞 +971 123 456 789<br>
            📧 concierge@midaslifestyle.com
          </p>
          
          <p style="margin-top: 30px;">
            <em>Experience luxury. Experience Midas.</em>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 12px;">
            Midas Lifestyle | Office #22, JAC Building, Al Quoz 1, Dubai
          </p>
        </div>
      </div>
    `
  };
};

// Main handler function
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const formData = JSON.parse(event.body);
    
    // Validate submission
    const validation = validateSubmission(formData);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: validation.error })
      };
    }

    // Create email transporter (temporarily disabled for testing)
    // const transporter = createTransporter();

    // Send notification to concierge team (temporarily disabled)
    const emailContent = formatEmailContent(formData);
    console.log('Would send email to concierge:', emailContent.subject);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: 'concierge@midaslifestyle.com',
    //   subject: emailContent.subject,
    //   html: emailContent.html
    // });

    // Send auto-reply to customer (temporarily disabled)
    const autoReply = formatAutoReply(formData);
    console.log('Would send auto-reply to:', formData.email);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: formData.email,
    //   subject: autoReply.subject,
    //   html: autoReply.html
    // });

    // Log submission (in production, save to database)
    console.log('Form submission processed:', {
      timestamp: new Date().toISOString(),
      name: formData.name,
      email: formData.email,
      service: formData.service
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Your inquiry has been submitted successfully. Our VVIP concierge team will contact you within 2 hours.' 
      })
    };

  } catch (error) {
    console.error('Error processing form:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error. Please try again or contact us directly.' 
      })
    };
  }
};
