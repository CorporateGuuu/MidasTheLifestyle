// Payment System for Mida Luxury Rentals
// Stripe and PayPal integration for secure payments

class PaymentSystem {
  constructor() {
    this.stripe = null;
    this.paypal = null;
    this.bookingData = null;
    this.paymentMethod = 'stripe'; // default
    this.paymentIntent = null;
    this.init();
  }

  // Initialize payment system
  async init() {
    try {
      await this.loadStripe();
      await this.loadPayPal();
      this.setupPaymentUI();
      this.setupEventListeners();
      console.log('💳 Payment System initialized');
    } catch (error) {
      console.error('❌ Error initializing payment system:', error);
    }
  }

  // Load Stripe
  async loadStripe() {
    try {
      // In production, use your actual Stripe publishable key
      const stripeKey = 'pk_test_51234567890abcdef'; // Replace with actual key
      this.stripe = Stripe(stripeKey);
      console.log('✅ Stripe loaded');
    } catch (error) {
      console.error('Error loading Stripe:', error);
    }
  }

  // Load PayPal
  async loadPayPal() {
    try {
      // PayPal SDK would be loaded here
      // For now, simulate PayPal availability
      this.paypal = {
        available: true,
        clientId: 'your-paypal-client-id' // Replace with actual client ID
      };
      console.log('✅ PayPal loaded');
    } catch (error) {
      console.error('Error loading PayPal:', error);
    }
  }

  // Setup payment UI
  setupPaymentUI() {
    const paymentHTML = `
      <div id="payment-modal" class="modal payment-modal">
        <div class="modal-content payment-content">
          <button class="modal-close" onclick="paymentSystem.closePayment()">×</button>
          
          <div class="payment-header">
            <h2 class="gold-accent">Complete Your Booking</h2>
            <div class="booking-info">
              <h3 id="payment-item-name"></h3>
              <p id="payment-booking-details"></p>
            </div>
          </div>

          <div class="payment-body">
            <div class="booking-summary-payment">
              <h3 class="gold-accent">Booking Summary</h3>
              
              <div class="summary-details">
                <div class="summary-row">
                  <span>Item:</span>
                  <span id="summary-item"></span>
                </div>
                <div class="summary-row">
                  <span>Dates:</span>
                  <span id="summary-dates"></span>
                </div>
                <div class="summary-row">
                  <span>Location:</span>
                  <span id="summary-location"></span>
                </div>
                <div class="summary-row">
                  <span>Duration:</span>
                  <span id="summary-duration"></span>
                </div>
              </div>

              <div class="pricing-summary">
                <div class="price-row">
                  <span>Subtotal:</span>
                  <span id="payment-subtotal"></span>
                </div>
                <div class="price-row">
                  <span>Taxes & Fees:</span>
                  <span id="payment-taxes"></span>
                </div>
                <div class="price-row">
                  <span>Security Deposit:</span>
                  <span id="payment-deposit"></span>
                </div>
                <div class="price-row total">
                  <span>Total Amount:</span>
                  <span id="payment-total"></span>
                </div>
              </div>
            </div>

            <div class="payment-options">
              <h3 class="gold-accent">Payment Method</h3>
              
              <div class="payment-method-selector">
                <label class="payment-method-option">
                  <input type="radio" name="payment-method" value="stripe" checked>
                  <div class="method-card">
                    <div class="method-icon">💳</div>
                    <div class="method-info">
                      <h4>Credit/Debit Card</h4>
                      <p>Secure payment via Stripe</p>
                    </div>
                  </div>
                </label>
                
                <label class="payment-method-option">
                  <input type="radio" name="payment-method" value="paypal">
                  <div class="method-card">
                    <div class="method-icon">🅿️</div>
                    <div class="method-info">
                      <h4>PayPal</h4>
                      <p>Pay with your PayPal account</p>
                    </div>
                  </div>
                </label>
              </div>

              <div class="payment-form">
                <div id="stripe-payment-form" class="payment-form-section active">
                  <h4>Card Information</h4>
                  <div class="form-group">
                    <label>Cardholder Name</label>
                    <input type="text" id="cardholder-name" placeholder="John Doe" required>
                  </div>
                  <div class="form-group">
                    <label>Card Details</label>
                    <div id="stripe-card-element" class="stripe-element">
                      <!-- Stripe Elements will create form elements here -->
                    </div>
                  </div>
                  <div id="stripe-card-errors" class="error-message"></div>
                </div>

                <div id="paypal-payment-form" class="payment-form-section">
                  <div id="paypal-button-container">
                    <!-- PayPal button will be rendered here -->
                  </div>
                </div>
              </div>

              <div class="payment-actions">
                <button id="back-to-calendar" class="btn-secondary">Back to Calendar</button>
                <button id="process-payment" class="btn-primary">
                  <span class="payment-amount">Pay Now</span>
                  <div class="payment-spinner" style="display: none;">
                    <div class="spinner"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="payment-security">
            <div class="security-badges">
              <span class="security-badge">🔒 SSL Encrypted</span>
              <span class="security-badge">🛡️ PCI Compliant</span>
              <span class="security-badge">✅ Secure Payment</span>
            </div>
            <p class="security-text">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>
    `;

    // Add payment modal to DOM if it doesn't exist
    if (!document.getElementById('payment-modal')) {
      document.body.insertAdjacentHTML('beforeend', paymentHTML);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Payment method selection
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.paymentMethod = e.target.value;
        this.togglePaymentForms();
      });
    });

    // Action buttons
    document.getElementById('back-to-calendar')?.addEventListener('click', () => {
      this.closePayment();
      if (window.bookingCalendar) {
        window.bookingCalendar.openCalendar(this.bookingData.item.id);
      }
    });

    document.getElementById('process-payment')?.addEventListener('click', () => {
      this.processPayment();
    });
  }

  // Initialize payment with booking data
  initializePayment(bookingData) {
    this.bookingData = bookingData;
    this.populateBookingInfo();
    this.setupStripeElements();
    this.setupPayPalButton();
    
    // Show payment modal
    document.getElementById('payment-modal').classList.add('active');
  }

  // Populate booking information
  populateBookingInfo() {
    const { item, startDate, endDate, location, pricing, currency } = this.bookingData;
    const currencySymbol = currency === 'aed' ? 'AED' : '$';

    // Header info
    document.getElementById('payment-item-name').textContent = item.name;
    document.getElementById('payment-booking-details').textContent = 
      `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;

    // Summary details
    document.getElementById('summary-item').textContent = item.name;
    document.getElementById('summary-dates').textContent = 
      `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    document.getElementById('summary-location').textContent = location;
    document.getElementById('summary-duration').textContent = 
      `${pricing.totalDays} day${pricing.totalDays !== 1 ? 's' : ''}`;

    // Pricing summary
    document.getElementById('payment-subtotal').textContent = 
      `${currencySymbol} ${pricing.subtotal.toLocaleString()}`;
    document.getElementById('payment-taxes').textContent = 
      `${currencySymbol} ${pricing.taxes.toLocaleString()}`;
    document.getElementById('payment-deposit').textContent = 
      `${currencySymbol} ${pricing.deposit.toLocaleString()}`;
    document.getElementById('payment-total').textContent = 
      `${currencySymbol} ${pricing.total.toLocaleString()}`;

    // Update payment button
    document.querySelector('.payment-amount').textContent = 
      `Pay ${currencySymbol} ${pricing.total.toLocaleString()}`;
  }

  // Setup Stripe Elements
  setupStripeElements() {
    if (!this.stripe) return;

    const elements = this.stripe.elements();
    const cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#fff',
          backgroundColor: '#333',
          '::placeholder': {
            color: '#888',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    cardElement.mount('#stripe-card-element');

    // Handle real-time validation errors from the card Element
    cardElement.on('change', ({error}) => {
      const displayError = document.getElementById('stripe-card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
    });

    this.cardElement = cardElement;
  }

  // Setup PayPal button
  setupPayPalButton() {
    if (!this.paypal?.available) return;

    // In production, use actual PayPal SDK
    const paypalContainer = document.getElementById('paypal-button-container');
    paypalContainer.innerHTML = `
      <div class="paypal-placeholder">
        <button class="paypal-btn" onclick="paymentSystem.processPayPalPayment()">
          <span>Pay with PayPal</span>
        </button>
      </div>
    `;
  }

  // Toggle payment forms
  togglePaymentForms() {
    const stripeForms = document.querySelectorAll('#stripe-payment-form');
    const paypalForms = document.querySelectorAll('#paypal-payment-form');
    const processButton = document.getElementById('process-payment');

    if (this.paymentMethod === 'stripe') {
      stripeForms.forEach(form => form.classList.add('active'));
      paypalForms.forEach(form => form.classList.remove('active'));
      processButton.style.display = 'block';
    } else {
      stripeForms.forEach(form => form.classList.remove('active'));
      paypalForms.forEach(form => form.classList.add('active'));
      processButton.style.display = 'none';
    }
  }

  // Process payment
  async processPayment() {
    if (this.paymentMethod === 'stripe') {
      await this.processStripePayment();
    } else if (this.paymentMethod === 'paypal') {
      await this.processPayPalPayment();
    }
  }

  // Process Stripe payment
  async processStripePayment() {
    if (!this.stripe || !this.cardElement) {
      alert('Payment system not ready. Please try again.');
      return;
    }

    const button = document.getElementById('process-payment');
    const spinner = button.querySelector('.payment-spinner');
    const amount = button.querySelector('.payment-amount');

    // Show loading state
    button.disabled = true;
    spinner.style.display = 'block';
    amount.style.display = 'none';

    try {
      // Create payment intent on server
      const paymentIntent = await this.createPaymentIntent();
      
      // Confirm payment with Stripe
      const {error, paymentIntent: confirmedPayment} = await this.stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: this.cardElement,
            billing_details: {
              name: document.getElementById('cardholder-name').value,
            },
          }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (confirmedPayment.status === 'succeeded') {
        await this.handlePaymentSuccess(confirmedPayment);
      }

    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      // Reset button state
      button.disabled = false;
      spinner.style.display = 'none';
      amount.style.display = 'block';
    }
  }

  // Create payment intent on server
  async createPaymentIntent() {
    // In production, this would call your backend
    // For now, simulate the response
    return {
      client_secret: 'pi_test_1234567890_secret_test',
      amount: this.bookingData.pricing.total * 100, // Stripe uses cents
      currency: this.bookingData.currency.toLowerCase()
    };
  }

  // Process PayPal payment
  async processPayPalPayment() {
    try {
      // In production, integrate with actual PayPal SDK
      // For now, simulate PayPal payment
      const paymentResult = {
        id: 'PAYPAL_' + Date.now(),
        status: 'COMPLETED',
        amount: this.bookingData.pricing.total
      };

      await this.handlePaymentSuccess(paymentResult);
    } catch (error) {
      console.error('PayPal payment failed:', error);
      alert(`PayPal payment failed: ${error.message}`);
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentResult) {
    try {
      // Create booking record
      const booking = await this.createBooking(paymentResult);
      
      // Send confirmation emails
      await this.sendConfirmationEmails(booking);
      
      // Show success message
      this.showPaymentSuccess(booking);
      
      // Close payment modal
      this.closePayment();

    } catch (error) {
      console.error('Error handling payment success:', error);
      alert('Payment successful, but there was an error processing your booking. Please contact support.');
    }
  }

  // Create booking record
  async createBooking(paymentResult) {
    const booking = {
      id: 'BOOKING_' + Date.now(),
      itemId: this.bookingData.item.id,
      itemName: this.bookingData.item.name,
      startDate: this.bookingData.startDate,
      endDate: this.bookingData.endDate,
      location: this.bookingData.location,
      pricing: this.bookingData.pricing,
      currency: this.bookingData.currency,
      paymentId: paymentResult.id,
      paymentMethod: this.paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // In production, save to database
    console.log('Booking created:', booking);
    
    return booking;
  }

  // Send confirmation emails
  async sendConfirmationEmails(booking) {
    try {
      // Send to customer and concierge team
      const response = await fetch('/.netlify/functions/booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        throw new Error('Failed to send confirmation emails');
      }

      console.log('Confirmation emails sent');
    } catch (error) {
      console.error('Error sending confirmation emails:', error);
    }
  }

  // Show payment success
  showPaymentSuccess(booking) {
    const successHTML = `
      <div id="payment-success-modal" class="modal payment-success-modal active">
        <div class="modal-content success-content">
          <div class="success-header">
            <div class="success-icon">✅</div>
            <h2 class="gold-accent">Booking Confirmed!</h2>
            <p>Your luxury experience has been reserved</p>
          </div>
          
          <div class="success-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
              <span>Booking ID:</span>
              <span class="gold-accent">${booking.id}</span>
            </div>
            <div class="detail-row">
              <span>Item:</span>
              <span>${booking.itemName}</span>
            </div>
            <div class="detail-row">
              <span>Dates:</span>
              <span>${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span>Location:</span>
              <span>${booking.location}</span>
            </div>
          </div>
          
          <div class="success-actions">
            <button onclick="this.closest('.modal').remove()" class="btn-primary">
              Continue Browsing
            </button>
          </div>
          
          <div class="success-note">
            <p>A confirmation email has been sent to your email address. Our VVIP concierge team will contact you within 2 hours to finalize the details.</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);
  }

  // Close payment modal
  closePayment() {
    document.getElementById('payment-modal').classList.remove('active');
    this.bookingData = null;
  }
}

// Initialize payment system
const paymentSystem = new PaymentSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentSystem;
} else {
  window.PaymentSystem = PaymentSystem;
  window.paymentSystem = paymentSystem;
}
