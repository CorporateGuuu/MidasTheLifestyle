// Comprehensive Luxury Booking System
// Multi-step booking flow with payment integration

class LuxuryBookingSystem {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.bookingData = {};
    this.availabilityCache = new Map();
    this.stripe = null;
    this.paypal = null;
    this.selectedVehicle = null;
    this.selectedDates = null;
    this.init();
  }

  // Initialize booking system
  init() {
    this.initializePaymentGateways();
    this.setupBookingModal();
    this.setupEventListeners();
    this.loadAvailabilityData();
    console.log('🚗 Luxury Booking System initialized');
  }

  // Initialize payment gateways
  initializePaymentGateways() {
    // Initialize Stripe
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'); // Replace with actual key
    }

    // Initialize PayPal
    if (typeof paypal !== 'undefined') {
      this.initializePayPal();
    }
  }

  // Setup booking modal
  setupBookingModal() {
    const modalHTML = `
      <div id="booking-modal" class="modal booking-modal">
        <div class="modal-content booking-content">
          <button class="modal-close luxury-close" onclick="bookingSystem.closeBookingModal()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Booking Progress Indicator -->
          <div class="booking-progress">
            <div class="progress-steps">
              <div class="step active" data-step="1">
                <div class="step-number">1</div>
                <div class="step-label">Vehicle</div>
              </div>
              <div class="step" data-step="2">
                <div class="step-number">2</div>
                <div class="step-label">Dates</div>
              </div>
              <div class="step" data-step="3">
                <div class="step-number">3</div>
                <div class="step-label">Details</div>
              </div>
              <div class="step" data-step="4">
                <div class="step-number">4</div>
                <div class="step-label">Payment</div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>

          <!-- Step 1: Vehicle Selection -->
          <div id="step-1" class="booking-step active">
            <h2 class="booking-title">Select Your Luxury Vehicle</h2>
            <div class="vehicle-selection-grid">
              <!-- Vehicle cards will be populated dynamically -->
            </div>
          </div>

          <!-- Step 2: Date Selection -->
          <div id="step-2" class="booking-step">
            <h2 class="booking-title">Choose Your Dates</h2>
            <div class="date-selection-container">
              <div class="calendar-container">
                <div id="booking-calendar"></div>
              </div>
              <div class="time-selection">
                <h3>Pickup Time</h3>
                <select id="pickup-time" class="luxury-select">
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                </select>
                <h3>Return Time</h3>
                <select id="return-time" class="luxury-select">
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 3: Customer Information -->
          <div id="step-3" class="booking-step">
            <h2 class="booking-title">Your Information</h2>
            <form id="customer-info-form" class="luxury-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="first-name">First Name *</label>
                  <input type="text" id="first-name" required class="luxury-input">
                </div>
                <div class="form-group">
                  <label for="last-name">Last Name *</label>
                  <input type="text" id="last-name" required class="luxury-input">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="email">Email Address *</label>
                  <input type="email" id="email" required class="luxury-input">
                </div>
                <div class="form-group">
                  <label for="phone">Phone Number *</label>
                  <input type="tel" id="phone" required class="luxury-input">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="pickup-location">Pickup Location *</label>
                  <select id="pickup-location" required class="luxury-select">
                    <option value="">Select Location</option>
                    <option value="dubai-marina">Dubai Marina</option>
                    <option value="downtown-dubai">Downtown Dubai</option>
                    <option value="palm-jumeirah">Palm Jumeirah</option>
                    <option value="difc">DIFC</option>
                    <option value="jbr">JBR</option>
                    <option value="washington-dc">Washington DC</option>
                    <option value="houston-tx">Houston, TX</option>
                    <option value="atlanta-ga">Atlanta, GA</option>
                    <option value="maryland">Maryland</option>
                    <option value="northern-virginia">Northern Virginia</option>
                    <option value="custom">Custom Location</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="dropoff-location">Drop-off Location *</label>
                  <select id="dropoff-location" required class="luxury-select">
                    <option value="">Select Location</option>
                    <option value="same">Same as Pickup</option>
                    <option value="dubai-marina">Dubai Marina</option>
                    <option value="downtown-dubai">Downtown Dubai</option>
                    <option value="palm-jumeirah">Palm Jumeirah</option>
                    <option value="difc">DIFC</option>
                    <option value="jbr">JBR</option>
                    <option value="washington-dc">Washington DC</option>
                    <option value="houston-tx">Houston, TX</option>
                    <option value="atlanta-ga">Atlanta, GA</option>
                    <option value="maryland">Maryland</option>
                    <option value="northern-virginia">Northern Virginia</option>
                    <option value="custom">Custom Location</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="license-number">Driver's License Number *</label>
                <input type="text" id="license-number" required class="luxury-input">
              </div>
              <div class="form-group">
                <label for="special-requests">Special Requests</label>
                <textarea id="special-requests" class="luxury-textarea" rows="3" placeholder="Any special requirements or requests..."></textarea>
              </div>
              <div class="form-group checkbox-group">
                <label class="luxury-checkbox-label">
                  <input type="checkbox" id="concierge-services">
                  <span class="luxury-checkmark"></span>
                  <span>Add concierge services (+AED 500/day)</span>
                </label>
              </div>
              <div class="form-group checkbox-group">
                <label class="luxury-checkbox-label">
                  <input type="checkbox" id="terms-acceptance" required>
                  <span class="luxury-checkmark"></span>
                  <span>I agree to the <a href="#" class="terms-link">Terms & Conditions</a> and <a href="#" class="terms-link">Rental Policies</a></span>
                </label>
              </div>
            </form>
          </div>

          <!-- Step 4: Payment -->
          <div id="step-4" class="booking-step">
            <h2 class="booking-title">Complete Your Booking</h2>
            <div class="booking-summary">
              <h3>Booking Summary</h3>
              <div id="summary-details"></div>
            </div>
            <div class="payment-methods">
              <h3>Payment Method</h3>
              <div class="payment-options">
                <button class="payment-btn stripe-btn" onclick="bookingSystem.processStripePayment()">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                  Pay with Card
                </button>
                <button class="payment-btn paypal-btn" onclick="bookingSystem.processPayPalPayment()">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.564.564 0 0 0-.556.479l-1.187 7.527h-.506l1.12-7.106c.082-.518.526-.9 1.05-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.291-1.867-.002-3.137-1.012-4.287C19.654.543 17.646 0 15.076 0H7.616c-.524 0-.972.382-1.054.901L3.455 21.238a.641.641 0 0 0 .633.74h4.606l1.187-7.527a.564.564 0 0 1 .556-.479h2.19c5.133 0 8.208-2.423 9.138-7.201.015-.079.028-.178.041-.254z"/>
                  </svg>
                  PayPal
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="booking-navigation">
            <button id="prev-btn" class="nav-btn secondary" onclick="bookingSystem.previousStep()" style="display: none;">
              Previous
            </button>
            <button id="next-btn" class="nav-btn primary" onclick="bookingSystem.nextStep()">
              Next
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Setup event listeners
  setupEventListeners() {
    // Vehicle selection listeners will be added when vehicles are loaded
    document.addEventListener('click', (e) => {
      if (e.target.matches('.vehicle-card')) {
        this.selectVehicle(e.target.dataset.vehicleId);
      }
    });

    // Form validation listeners
    const form = document.getElementById('customer-info-form');
    if (form) {
      form.addEventListener('input', (e) => {
        this.validateField(e.target);
      });
    }
  }

  // Load availability data
  loadAvailabilityData() {
    // In production, this would fetch from a real API
    const mockAvailability = {
      'bugatti-chiron': {
        unavailable: ['2024-01-15', '2024-01-20', '2024-01-25'],
        price: 20000
      },
      'koenigsegg-jesko': {
        unavailable: ['2024-01-18', '2024-01-22'],
        price: 22000
      },
      'rolls-royce-phantom': {
        unavailable: ['2024-01-16', '2024-01-21'],
        price: 9000
      }
    };

    this.availabilityCache = new Map(Object.entries(mockAvailability));
  }

  // Open booking modal
  openBookingModal(vehicleId = null) {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      if (vehicleId) {
        this.selectVehicle(vehicleId);
        this.goToStep(2); // Skip vehicle selection if already selected
      } else {
        this.loadVehicleSelection();
        this.goToStep(1);
      }
    }
  }

  // Close booking modal
  closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.resetBooking();
    }
  }

  // Load vehicle selection
  loadVehicleSelection() {
    const container = document.querySelector('.vehicle-selection-grid');
    if (!container) return;

    const vehicles = [
      {
        id: 'bugatti-chiron',
        name: 'Bugatti Chiron',
        price: 'AED 20,000/day',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
        specs: '1,479 HP • 420 km/h'
      },
      {
        id: 'koenigsegg-jesko',
        name: 'Koenigsegg Jesko',
        price: 'AED 22,000/day',
        image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
        specs: '1,600 HP • 480+ km/h'
      },
      {
        id: 'rolls-royce-phantom',
        name: 'Rolls-Royce Phantom',
        price: 'AED 9,000/day',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3',
        specs: '563 HP • Luxury Sedan'
      }
    ];

    container.innerHTML = vehicles.map(vehicle => `
      <div class="vehicle-card" data-vehicle-id="${vehicle.id}">
        <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
        <div class="vehicle-info">
          <h3>${vehicle.name}</h3>
          <p class="vehicle-price">${vehicle.price}</p>
          <p class="vehicle-specs">${vehicle.specs}</p>
        </div>
      </div>
    `).join('');
  }

  // Select vehicle
  selectVehicle(vehicleId) {
    this.selectedVehicle = vehicleId;
    this.bookingData.vehicleId = vehicleId;
    
    // Update UI to show selection
    document.querySelectorAll('.vehicle-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-vehicle-id="${vehicleId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
  }

  // Navigation methods
  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.goToStep(this.currentStep + 1);
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step) {
    // Hide current step
    document.querySelectorAll('.booking-step').forEach(stepEl => {
      stepEl.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
      targetStep.classList.add('active');
    }

    // Update progress
    this.updateProgress(step);
    this.currentStep = step;

    // Update navigation buttons
    this.updateNavigationButtons();

    // Initialize step-specific functionality
    if (step === 2) {
      this.initializeCalendar();
    } else if (step === 4) {
      this.generateBookingSummary();
    }
  }

  // Update progress indicator
  updateProgress(step) {
    const progressFill = document.querySelector('.progress-fill');
    const progressSteps = document.querySelectorAll('.progress-steps .step');
    
    if (progressFill) {
      progressFill.style.width = `${(step / this.totalSteps) * 100}%`;
    }

    progressSteps.forEach((stepEl, index) => {
      if (index < step) {
        stepEl.classList.add('completed');
        stepEl.classList.remove('active');
      } else if (index === step - 1) {
        stepEl.classList.add('active');
        stepEl.classList.remove('completed');
      } else {
        stepEl.classList.remove('active', 'completed');
      }
    });
  }

  // Update navigation buttons
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
      prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
    }

    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.textContent = 'Complete Booking';
        nextBtn.onclick = () => this.completeBooking();
      } else {
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => this.nextStep();
      }
    }
  }

  // Validate current step
  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.selectedVehicle !== null;
      case 2:
        return this.selectedDates !== null;
      case 3:
        return this.validateCustomerInfo();
      case 4:
        return true;
      default:
        return false;
    }
  }

  // Validate customer information
  validateCustomerInfo() {
    const requiredFields = ['first-name', 'last-name', 'email', 'phone', 'pickup-location', 'dropoff-location', 'license-number'];
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));

    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && !field.value.trim()) {
        this.showFieldError(field, 'This field is required');
        isValid = false;
      } else if (field) {
        // Validate specific field types
        if (fieldId === 'email' && !this.validateEmail(field.value)) {
          this.showFieldError(field, 'Please enter a valid email address');
          isValid = false;
        } else if (fieldId === 'phone' && !this.validatePhone(field.value)) {
          this.showFieldError(field, 'Please enter a valid phone number');
          isValid = false;
        }
      }
    });

    const termsCheckbox = document.getElementById('terms-acceptance');
    if (termsCheckbox && !termsCheckbox.checked) {
      this.showFieldError(termsCheckbox, 'You must accept the terms and conditions');
      isValid = false;
    }

    return isValid;
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate phone format
  validatePhone(phone) {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Check if it's a valid international format
    if (cleanPhone.startsWith('+')) {
      return cleanPhone.length >= 8 && cleanPhone.length <= 16;
    }

    // Check if it's a valid domestic format
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }

  // Show field error
  showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);

    // Remove error on input
    field.addEventListener('input', () => {
      field.classList.remove('error');
      const errorMsg = field.parentNode.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    }, { once: true });
  }

  // Initialize calendar
  initializeCalendar() {
    const calendarContainer = document.getElementById('booking-calendar');
    if (!calendarContainer) return;

    // Simple calendar implementation
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    this.renderCalendar(calendarContainer, currentYear, currentMonth);
  }

  // Render calendar
  renderCalendar(container, year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    let calendarHTML = `
      <div class="calendar-header">
        <button class="calendar-nav prev" onclick="bookingSystem.previousMonth()">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="calendar-nav next" onclick="bookingSystem.nextMonth()">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-header">Sun</div>
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
    `;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isUnavailable = this.isDateUnavailable(dateString);

      let dayClass = 'calendar-day';
      if (isToday) dayClass += ' today';
      if (isPast) dayClass += ' past';
      if (isUnavailable) dayClass += ' unavailable';

      calendarHTML += `
        <div class="${dayClass}" data-date="${dateString}" onclick="bookingSystem.selectDate('${dateString}')">
          ${day}
        </div>
      `;
    }

    calendarHTML += '</div>';
    container.innerHTML = calendarHTML;
  }

  // Check if date is unavailable
  isDateUnavailable(dateString) {
    if (!this.selectedVehicle) return false;
    const vehicleAvailability = this.availabilityCache.get(this.selectedVehicle);
    return vehicleAvailability && vehicleAvailability.unavailable.includes(dateString);
  }

  // Select date
  selectDate(dateString) {
    const dateElement = document.querySelector(`[data-date="${dateString}"]`);
    if (!dateElement || dateElement.classList.contains('past') || dateElement.classList.contains('unavailable')) {
      return;
    }

    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });

    // Add selection to clicked date
    dateElement.classList.add('selected');
    this.selectedDates = { pickup: dateString };
    this.bookingData.dates = this.selectedDates;
  }

  // Generate booking summary
  generateBookingSummary() {
    const summaryContainer = document.getElementById('summary-details');
    if (!summaryContainer) return;

    const vehicleData = this.getVehicleData(this.selectedVehicle);
    const conciergeServices = document.getElementById('concierge-services')?.checked;

    let totalPrice = vehicleData.price;
    if (conciergeServices) {
      totalPrice += 500;
    }

    summaryContainer.innerHTML = `
      <div class="summary-item">
        <span>Vehicle:</span>
        <span>${vehicleData.name}</span>
      </div>
      <div class="summary-item">
        <span>Date:</span>
        <span>${this.selectedDates?.pickup || 'Not selected'}</span>
      </div>
      <div class="summary-item">
        <span>Base Price:</span>
        <span>AED ${vehicleData.price.toLocaleString()}</span>
      </div>
      ${conciergeServices ? `
        <div class="summary-item">
          <span>Concierge Services:</span>
          <span>AED 500</span>
        </div>
      ` : ''}
      <div class="summary-item total">
        <span>Total:</span>
        <span>AED ${totalPrice.toLocaleString()}</span>
      </div>
    `;
  }

  // Get vehicle data
  getVehicleData(vehicleId) {
    const vehicles = {
      'bugatti-chiron': { name: 'Bugatti Chiron', price: 20000 },
      'koenigsegg-jesko': { name: 'Koenigsegg Jesko', price: 22000 },
      'rolls-royce-phantom': { name: 'Rolls-Royce Phantom', price: 9000 }
    };
    return vehicles[vehicleId] || { name: 'Unknown Vehicle', price: 0 };
  }

  // Process Stripe payment
  async processStripePayment() {
    if (!this.stripe) {
      this.showPaymentError('Stripe is not available');
      return;
    }

    try {
      this.showLoadingState('Processing payment...');

      // In production, create payment intent on server
      const { error } = await this.stripe.confirmCardPayment('pi_test_payment_intent', {
        payment_method: {
          card: {
            // Card element would be created here
          }
        }
      });

      if (error) {
        this.showPaymentError(error.message);
      } else {
        this.completeBooking();
      }
    } catch (error) {
      this.showPaymentError('Payment processing failed');
    }
  }

  // Process PayPal payment
  processPayPalPayment() {
    // PayPal integration would be implemented here
    this.showLoadingState('Redirecting to PayPal...');

    setTimeout(() => {
      this.completeBooking();
    }, 2000);
  }

  // Complete booking
  async completeBooking() {
    this.showLoadingState('Completing your booking...');

    try {
      // Collect all booking data
      const bookingData = this.collectBookingData();

      // Validate booking data
      if (!this.validateBookingData(bookingData)) {
        throw new Error('Invalid booking data. Please check all fields.');
      }

      // Submit booking to backend
      const response = await fetch('/.netlify/functions/reservation-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          service: 'Luxury Vehicle Rental',
          bookingType: 'vehicle-rental',
          timestamp: new Date().toISOString(),
          bookingReference: `MTL-${Date.now()}`
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showBookingConfirmation(result.bookingReference || `MTL-${Date.now()}`);
        this.sendConfirmationNotifications(bookingData);
      } else {
        throw new Error(result.error || 'Booking submission failed');
      }
    } catch (error) {
      console.error('Booking completion error:', error);
      this.showBookingError(error.message);
    }
  }

  // Collect all booking data
  collectBookingData() {
    return {
      // Vehicle information
      vehicleId: this.selectedVehicle,
      vehicleName: this.getVehicleData(this.selectedVehicle)?.name || 'Unknown Vehicle',

      // Date information
      pickupDate: this.selectedDates?.pickup || '',
      returnDate: this.selectedDates?.return || '',
      pickupTime: document.getElementById('pickup-time')?.value || '',
      returnTime: document.getElementById('return-time')?.value || '',

      // Customer information
      firstName: document.getElementById('first-name')?.value || '',
      lastName: document.getElementById('last-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',

      // Location information
      pickupLocation: document.getElementById('pickup-location')?.value || '',
      dropoffLocation: document.getElementById('dropoff-location')?.value || '',

      // Additional information
      licenseNumber: document.getElementById('license-number')?.value || '',
      specialRequests: document.getElementById('special-requests')?.value || '',
      conciergeServices: document.getElementById('concierge-services')?.checked || false,

      // Pricing information
      totalPrice: this.calculateTotalPrice(),
      currency: 'AED'
    };
  }

  // Validate booking data
  validateBookingData(data) {
    const requiredFields = ['vehicleId', 'pickupDate', 'returnDate', 'firstName', 'lastName', 'email', 'phone', 'pickupLocation', 'dropoffLocation', 'licenseNumber'];

    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate email format
    if (!this.validateEmail(data.email)) {
      console.error('Invalid email format');
      return false;
    }

    // Validate phone format
    if (!this.validatePhone(data.phone)) {
      console.error('Invalid phone format');
      return false;
    }

    return true;
  }

  // Show booking confirmation
  showBookingConfirmation(bookingReference) {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content booking-confirmation">
          <div class="confirmation-icon">
            <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 style="color: #D4AF37; margin: 20px 0;">Booking Confirmed!</h2>
          <p style="color: #fff; margin-bottom: 20px;">Your luxury vehicle has been reserved. You will receive confirmation details via email and SMS within 15 minutes.</p>
          <div class="confirmation-details" style="background: rgba(212, 175, 55, 0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">Booking Reference:</strong> ${bookingReference}</p>
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">Vehicle:</strong> ${this.getVehicleData(this.selectedVehicle)?.name || 'Luxury Vehicle'}</p>
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">Pickup Date:</strong> ${this.selectedDates?.pickup || 'TBD'}</p>
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">Contact:</strong> Our concierge team will contact you within 2 hours</p>
          </div>
          <button class="luxury-btn primary-btn" onclick="bookingSystem.closeBookingModal()"
                  style="background: linear-gradient(135deg, #D4AF37, #E8C96A); color: #000; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px;">
            Close
          </button>
        </div>
      `;
    }
  }

  // Show booking error
  showBookingError(message) {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content booking-error">
          <div class="error-icon">
            <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 style="color: #ff6b6b; margin: 20px 0;">Booking Error</h2>
          <p style="color: #fff; margin-bottom: 20px;">${message}</p>
          <p style="color: #ccc; margin-bottom: 20px;">Please try again or contact our concierge team directly:</p>
          <div style="background: rgba(255, 107, 107, 0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">UAE:</strong> +971 58 553 1029</p>
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">USA:</strong> +1 240 351 0511</p>
            <p style="color: #fff; margin: 10px 0;"><strong style="color: #D4AF37;">Email:</strong> concierge@midasthelifestyle.com</p>
          </div>
          <div style="display: flex; gap: 15px; justify-content: center;">
            <button onclick="bookingSystem.goToStep(1)"
                    style="background: linear-gradient(135deg, #D4AF37, #E8C96A); color: #000; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
              Try Again
            </button>
            <button onclick="bookingSystem.closeBookingModal()"
                    style="background: #333; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
      `;
    }
  }

  // Send confirmation notifications
  sendConfirmationNotifications(bookingData) {
    // This would integrate with email and SMS services
    console.log('📧 Sending confirmation email to:', bookingData.email);
    console.log('📱 Sending confirmation SMS to:', bookingData.phone);

    // In production, this would call the email service
    this.sendConfirmationEmail(bookingData);
    this.sendConfirmationSMS(bookingData);
  }

  // Calculate total price
  calculateTotalPrice() {
    if (!this.selectedVehicle || !this.selectedDates) {
      return 0;
    }

    const vehicleData = this.getVehicleData(this.selectedVehicle);
    const basePrice = vehicleData?.price || 0;

    // Calculate number of days
    const pickup = new Date(this.selectedDates.pickup);
    const returnDate = new Date(this.selectedDates.return);
    const days = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24)) || 1;

    let total = basePrice * days;

    // Add concierge services if selected
    const conciergeServices = document.getElementById('concierge-services')?.checked;
    if (conciergeServices) {
      total += 500 * days; // AED 500 per day for concierge
    }

    return total;
  }

  // Get vehicle data
  getVehicleData(vehicleId) {
    const vehicles = {
      'bugatti-chiron': { name: 'Bugatti Chiron', price: 20000 },
      'koenigsegg-jesko': { name: 'Koenigsegg Jesko', price: 22000 },
      'rolls-royce-phantom': { name: 'Rolls-Royce Phantom', price: 9000 },
      'ferrari-sf90-stradale': { name: 'Ferrari SF90 Stradale', price: 18000 },
      'lamborghini-huracan-evo': { name: 'Lamborghini Huracán EVO', price: 15000 },
      'mclaren-720s': { name: 'McLaren 720S', price: 16000 }
    };

    return vehicles[vehicleId] || { name: 'Luxury Vehicle', price: 10000 };
  }

  // Send confirmation email
  sendConfirmationEmail() {
    // Email sending would be implemented here
    console.log('Confirmation email sent');
  }

  // Send confirmation SMS
  sendConfirmationSMS() {
    // SMS sending would be implemented here
    console.log('Confirmation SMS sent');
  }

  // Show loading state
  showLoadingState(message) {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content loading-state">
          <div class="luxury-loader"></div>
          <p>${message}</p>
        </div>
      `;
    }
  }

  // Show payment error
  showPaymentError(message) {
    alert(`Payment Error: ${message}`);
  }

  // Validate field
  validateField(field) {
    if (field.required && !field.value.trim()) {
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
  }

  // Reset booking
  resetBooking() {
    this.currentStep = 1;
    this.bookingData = {};
    this.selectedVehicle = null;
    this.selectedDates = null;
  }
}

// Initialize booking system
const bookingSystem = new LuxuryBookingSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LuxuryBookingSystem;
} else {
  window.LuxuryBookingSystem = LuxuryBookingSystem;
  window.bookingSystem = bookingSystem;
}
