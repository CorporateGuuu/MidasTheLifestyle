// Simplified contact form function for testing (without email dependencies)
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    
    // Basic validation
    const { name, email, service, message, honeypot } = formData;
    
    // Honeypot check
    if (honeypot && honeypot.trim() !== '') {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Spam detected' })
      };
    }
    
    // Required fields validation
    if (!name || !email || !service || !message) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }
    
    // Log the submission (in production, this would be saved to a database)
    console.log('Contact form submission:', {
      timestamp: new Date().toISOString(),
      name,
      email,
      service,
      messageLength: message.length,
      ip: event.headers['x-forwarded-for'] || 'unknown'
    });
    
    // Simulate email sending (replace with actual email service)
    const emailSent = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Your inquiry has been submitted successfully. Our VVIP concierge team will contact you within 2 hours.',
        data: {
          name,
          email,
          service,
          timestamp: new Date().toISOString(),
          emailConfigured: emailSent
        }
      })
    };

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error. Please try again or contact us directly.',
        details: error.message
      })
    };
  }
};
