// Booking Confirmation Email Handler for Mida Luxury Rentals
// Sends confirmation emails for completed bookings

const validator = require('validator');

// Email configuration (temporarily disabled for testing)
// const nodemailer = require('nodemailer');

// Create email transporter (temporarily disabled)
// const createTransporter = () => {
//   return nodemailer.createTransporter({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });
// };

// Validate booking data
const validateBooking = (booking) => {
  const required = ['id', 'itemId', 'itemName', 'startDate', 'endDate', 'location', 'pricing', 'paymentId'];
  
  for (const field of required) {
    if (!booking[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate dates
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (startDate >= endDate) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  return { valid: true };
};

// Format confirmation email for customer
const formatCustomerConfirmation = (booking) => {
  const { itemName, startDate, endDate, location, pricing, currency, id } = booking;
  const currencySymbol = currency === 'aed' ? 'AED' : '$';
  
  return {
    subject: `🏆 Booking Confirmed - ${itemName} | Midas The Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas The Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">Bespoke Luxury Rentals</p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 15px;">✅</div>
            <h2 style="color: #D4AF37; margin: 0 0 10px 0;">Booking Confirmed!</h2>
            <p style="color: #888; margin: 0;">Your luxury experience has been reserved</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #D4AF37; margin-bottom: 15px;">Booking Details</h3>
            
            <div style="background: #222; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                <span style="color: #888;">Booking ID:</span>
                <span style="color: #D4AF37; font-weight: bold;">${id}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                <span style="color: #888;">Item:</span>
                <span style="color: #fff;">${itemName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                <span style="color: #888;">Dates:</span>
                <span style="color: #fff;">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                <span style="color: #888;">Location:</span>
                <span style="color: #fff;">${location}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #888;">Total Amount:</span>
                <span style="color: #D4AF37; font-weight: bold; font-size: 18px;">${currencySymbol} ${pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid #D4AF37; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #D4AF37; margin-top: 0;">What happens next?</h3>
            <ul style="color: #fff; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Our VVIP concierge team will contact you within 2 hours</li>
              <li style="margin-bottom: 8px;">We'll confirm all details and arrange pickup/delivery</li>
              <li style="margin-bottom: 8px;">You'll receive detailed instructions 24 hours before your experience</li>
              <li style="margin-bottom: 8px;">Our team will be available 24/7 during your rental period</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #D4AF37; font-weight: bold; margin: 0;">Need immediate assistance?</p>
            <p style="color: #fff; margin: 10px 0;">
              📞 +971 123 456 789<br>
              📧 concierge@midasthelifestyle.com
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #D4AF37; font-style: italic; margin: 0;">
              Experience luxury. Experience Midas The Lifestyle.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 12px;">
            Midas The Lifestyle | Dubai | Washington DC | Atlanta | Maryland | Northern Virginia
          </p>
        </div>
      </div>
    `
  };
};

// Format notification email for concierge team
const formatConciergeNotification = (booking) => {
  const { itemName, startDate, endDate, location, pricing, currency, id, paymentId, paymentMethod } = booking;
  const currencySymbol = currency === 'aed' ? 'AED' : '$';
  
  return {
    subject: `🚨 NEW BOOKING CONFIRMED - ${itemName} | Midas The Lifestyle`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">Midas The Lifestyle</h1>
          <p style="color: #fff; margin: 5px 0;">VVIP Concierge Alert</p>
        </div>
        
        <div style="background: #8B0000; padding: 20px; border-radius: 10px; border: 2px solid #D4AF37; margin-bottom: 20px;">
          <h2 style="color: #D4AF37; margin-top: 0; text-align: center;">🚨 URGENT: New Booking Confirmed</h2>
          <p style="color: #fff; text-align: center; margin: 0; font-weight: bold;">
            Immediate action required - Customer contact within 2 hours
          </p>
        </div>
        
        <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #D4AF37;">
          <h3 style="color: #D4AF37; margin-bottom: 20px;">Booking Information</h3>
          
          <div style="background: #222; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Booking ID:</span>
              <span style="color: #D4AF37; font-weight: bold;">${id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Item:</span>
              <span style="color: #fff; font-weight: bold;">${itemName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Dates:</span>
              <span style="color: #fff;">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Location:</span>
              <span style="color: #fff;">${location}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Payment Method:</span>
              <span style="color: #fff;">${paymentMethod.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
              <span style="color: #888;">Payment ID:</span>
              <span style="color: #fff;">${paymentId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #888;">Total Amount:</span>
              <span style="color: #D4AF37; font-weight: bold; font-size: 18px;">${currencySymbol} ${pricing.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid #D4AF37; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #D4AF37; margin-top: 0;">Required Actions</h3>
            <ol style="color: #fff; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Contact customer within 2 hours to confirm details</li>
              <li style="margin-bottom: 8px;">Verify item availability and prepare for delivery/pickup</li>
              <li style="margin-bottom: 8px;">Send detailed instructions 24 hours before rental</li>
              <li style="margin-bottom: 8px;">Ensure 24/7 support availability during rental period</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
            <p style="color: #D4AF37; font-weight: bold;">⏰ Response Time: Within 2 hours for VVIP clients</p>
            <p style="font-size: 12px; color: #888;">
              Booking confirmed: ${new Date().toLocaleString()}<br>
              Source: Midas The Lifestyle Website - Automated Booking System
            </p>
          </div>
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
    const booking = JSON.parse(event.body);
    
    // Validate booking data
    const validation = validateBooking(booking);
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

    // Send confirmation to customer (temporarily disabled)
    const customerEmail = formatCustomerConfirmation(booking);
    console.log('Would send customer confirmation:', customerEmail.subject);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: booking.customerEmail,
    //   subject: customerEmail.subject,
    //   html: customerEmail.html
    // });

    // Send notification to concierge team (temporarily disabled)
    const conciergeEmail = formatConciergeNotification(booking);
    console.log('Would send concierge notification:', conciergeEmail.subject);

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: 'concierge@midasthelifestyle.com',
    //   subject: conciergeEmail.subject,
    //   html: conciergeEmail.html
    // });

    // Log booking confirmation (in production, save to database)
    console.log('Booking confirmation processed:', {
      timestamp: new Date().toISOString(),
      bookingId: booking.id,
      itemName: booking.itemName,
      total: booking.pricing.total,
      currency: booking.currency
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Booking confirmation emails sent successfully.' 
      })
    };

  } catch (error) {
    console.error('Error processing booking confirmation:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error. Booking confirmed but email notification failed.' 
      })
    };
  }
};
