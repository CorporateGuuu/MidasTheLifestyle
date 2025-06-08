// Netlify Function for Reservation Form Processing
// Handles modal reservation submissions for specific luxury items

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

// Validate reservation submission
const validateReservation = (body) => {
  const { name, email, dates, location, item, honeypot } = body;
  
  // Honeypot field should be empty
  if (honeypot && honeypot.trim() !== '') {
    return { valid: false, error: 'Spam detected' };
  }
  
  // Required fields validation
  if (!name || !email || !dates || !location || !item) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Date format validation (basic)
  if (dates.length < 5) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  return { valid: true };
};

// Get item category and pricing info
const getItemDetails = (itemName) => {
  const items = {
    // Cars
    'Bugatti Chiron': { category: 'Exotic Car', price: 'AED 20,000/day | $5,500/day', type: 'Hypercar' },
    'Koenigsegg Jesko': { category: 'Exotic Car', price: 'AED 22,000/day | $6,000/day', type: 'Hypercar' },
    'Rolls-Royce Cullinan': { category: 'Exotic Car', price: 'AED 8,000/day | $2,200/day', type: 'Luxury SUV' },
    
    // Yachts
    'Icon 280 Superyacht': { category: 'Superyacht', price: 'AED 50,000/day | $13,500/day', type: 'Mega Yacht' },
    'Azimut Grande 35': { category: 'Superyacht', price: 'AED 15,000/day | $4,000/day', type: 'Motor Yacht' },
    'Lürssen 90m': { category: 'Superyacht', price: 'AED 80,000/day | $22,000/day', type: 'Mega Yacht' },
    
    // Jets
    'Cessna Citation Longitude': { category: 'Private Jet', price: '$8,000/trip (Short-Haul)', type: 'Light Jet' },
    'Gulfstream G700': { category: 'Private Jet', price: '$20,000/trip (Long-Haul)', type: 'Heavy Jet' },
    'Bombardier Learjet 85': { category: 'Private Jet', price: '$9,000/trip (Short-Haul)', type: 'Light Jet' },
    
    // Properties
    'Dubai Marina Penthouse': { category: 'Exclusive Estate', price: '$2,000/night', type: 'Penthouse' },
    'Palm Jumeirah Villa': { category: 'Exclusive Estate', price: '$3,500/night', type: 'Villa' },
    'Miami Beach Penthouse': { category: 'Exclusive Estate', price: '$2,500/night', type: 'Penthouse' }
  };
  
  return items[itemName] || { category: 'Luxury Item', price: 'Price on request', type: 'Premium' };
};

// Format reservation email
const formatReservationEmail = (formData) => {
  const { name, email, dates, location, item } = formData;
  const itemDetails = getItemDetails(item);
  
  return {
    subject: `🏆 URGENT: ${itemDetails.category} Reservation - ${item} | Midas Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">VVIP Reservation Request</p>
        </div>
        
        <div style="background: #8B0000; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #D4AF37;">
          <h2 style="color: #D4AF37; margin-top: 0; text-align: center;">🚨 PRIORITY RESERVATION 🚨</h2>
          <p style="text-align: center; color: #fff; font-size: 16px; margin: 0;">
            <strong>Immediate attention required - VVIP client waiting</strong>
          </p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h3 style="color: #D4AF37; margin-top: 0;">Reservation Details</h3>
          
          <div style="display: grid; gap: 15px;">
            <div style="background: #222; padding: 15px; border-radius: 5px; border-left: 3px solid #D4AF37;">
              <h4 style="color: #D4AF37; margin: 0 0 10px 0;">Luxury Item</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${item}</p>
              <p style="margin: 5px 0 0 0; color: #888;">
                ${itemDetails.category} | ${itemDetails.type} | ${itemDetails.price}
              </p>
            </div>
            
            <div style="background: #222; padding: 15px; border-radius: 5px; border-left: 3px solid #D4AF37;">
              <h4 style="color: #D4AF37; margin: 0 0 10px 0;">Client Information</h4>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #D4AF37;">${email}</a></p>
            </div>
            
            <div style="background: #222; padding: 15px; border-radius: 5px; border-left: 3px solid #D4AF37;">
              <h4 style="color: #D4AF37; margin: 0 0 10px 0;">Booking Details</h4>
              <p><strong>Dates:</strong> <span style="color: #D4AF37;">${dates}</span></p>
              <p><strong>Location:</strong> <span style="color: #D4AF37;">${location}</span></p>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #8B0000; border-radius: 5px; border: 1px solid #D4AF37;">
            <h4 style="color: #D4AF37; margin-top: 0;">⚡ Action Required</h4>
            <ul style="color: #fff; margin: 0; padding-left: 20px;">
              <li>Check availability for requested dates</li>
              <li>Prepare detailed quote with terms</li>
              <li>Contact client within 1 hour</li>
              <li>Arrange viewing if requested</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #D4AF37; font-weight: bold;">⏰ Response Time: Within 1 hour for reservations</p>
            <p style="font-size: 12px; color: #888;">
              Submitted: ${new Date().toLocaleString()}<br>
              Priority: HIGH - Specific item reservation<br>
              Source: Midas Lifestyle Website
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 12px;">
            Midas Lifestyle VVIP Concierge | +971 123 456 789
          </p>
        </div>
      </div>
    `
  };
};

// Auto-reply for reservation
const formatReservationAutoReply = (formData) => {
  const { name, item, dates, location } = formData;
  const itemDetails = getItemDetails(item);
  
  return {
    subject: `🏆 Reservation Confirmed - ${item} | Midas Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">Reservation Confirmation</p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h2 style="color: #D4AF37; margin-top: 0;">Dear ${name},</h2>
          
          <p>Thank you for your reservation request for the <strong style="color: #D4AF37;">${item}</strong>.</p>
          
          <div style="background: #222; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #D4AF37;">
            <h3 style="color: #D4AF37; margin-top: 0;">Reservation Summary</h3>
            <p><strong>Item:</strong> ${item}</p>
            <p><strong>Category:</strong> ${itemDetails.category}</p>
            <p><strong>Dates:</strong> ${dates}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Pricing:</strong> ${itemDetails.price}</p>
          </div>
          
          <div style="background: #8B0000; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #D4AF37;">
            <h3 style="color: #D4AF37; margin-top: 0;">⚡ Priority Processing</h3>
            <p>Your reservation is being processed with <strong style="color: #D4AF37;">PRIORITY status</strong>.</p>
            <p>Our VVIP concierge team will contact you within <strong style="color: #D4AF37;">1 hour</strong> with:</p>
            <ul style="color: #fff; padding-left: 20px;">
              <li>Availability confirmation</li>
              <li>Detailed pricing and terms</li>
              <li>Booking procedures</li>
              <li>Delivery/pickup arrangements</li>
            </ul>
          </div>
          
          <p>For immediate assistance:</p>
          <p style="color: #D4AF37;">
            📞 +971 123 456 789<br>
            📧 concierge@midaslifestyle.com<br>
            💬 WhatsApp: +971 123 456 789
          </p>
          
          <p style="margin-top: 30px;">
            <em>Your luxury experience awaits.</em>
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
    const validation = validateReservation(formData);
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

    // Send priority notification to concierge team (temporarily disabled)
    const emailContent = formatReservationEmail(formData);
    console.log('Would send priority email to concierge:', emailContent.subject);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: 'concierge@midaslifestyle.com',
    //   subject: emailContent.subject,
    //   html: emailContent.html,
    //   priority: 'high'
    // });

    // Send confirmation to customer (temporarily disabled)
    const autoReply = formatReservationAutoReply(formData);
    console.log('Would send confirmation to:', formData.email);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: formData.email,
    //   subject: autoReply.subject,
    //   html: autoReply.html
    // });

    // Log reservation (in production, save to database)
    console.log('Reservation processed:', {
      timestamp: new Date().toISOString(),
      name: formData.name,
      email: formData.email,
      item: formData.item,
      dates: formData.dates,
      location: formData.location,
      priority: 'HIGH'
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: `Your reservation request for ${formData.item} has been submitted with PRIORITY status. Our VVIP concierge team will contact you within 1 hour.` 
      })
    };

  } catch (error) {
    console.error('Error processing reservation:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error. Please contact our concierge team directly at +971 123 456 789.' 
      })
    };
  }
};
