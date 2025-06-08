// Booking Calendar System for Mida Luxury Rentals
// Real-time availability checking and booking management

class BookingCalendar {
  constructor() {
    this.bookings = new Map(); // Store bookings in memory (in production, use database)
    this.inventory = null;
    this.selectedItem = null;
    this.selectedDates = {
      start: null,
      end: null
    };
    this.pricing = {
      basePrice: 0,
      totalDays: 0,
      subtotal: 0,
      taxes: 0,
      deposit: 0,
      total: 0
    };
    this.currency = 'aed';
    this.init();
  }

  // Initialize calendar system
  async init() {
    try {
      await this.loadInventory();
      await this.loadExistingBookings();
      this.setupCalendarUI();
      this.setupEventListeners();
      console.log('📅 Booking Calendar System initialized');
    } catch (error) {
      console.error('❌ Error initializing booking calendar:', error);
    }
  }

  // Load inventory data
  async loadInventory() {
    try {
      const response = await fetch('/data/inventory.json');
      this.inventory = await response.json();
    } catch (error) {
      console.error('Error loading inventory:', error);
      throw error;
    }
  }

  // Load existing bookings (simulate database)
  async loadExistingBookings() {
    // In production, this would fetch from a database
    // For now, simulate some existing bookings
    const sampleBookings = [
      {
        id: 'booking-001',
        itemId: 'bugatti-chiron-001',
        startDate: '2025-06-15',
        endDate: '2025-06-17',
        location: 'Dubai',
        status: 'confirmed'
      },
      {
        id: 'booking-002',
        itemId: 'gulfstream-g700-001',
        startDate: '2025-06-20',
        endDate: '2025-06-22',
        location: 'Washington DC',
        status: 'confirmed'
      }
    ];

    sampleBookings.forEach(booking => {
      if (!this.bookings.has(booking.itemId)) {
        this.bookings.set(booking.itemId, []);
      }
      this.bookings.get(booking.itemId).push(booking);
    });
  }

  // Setup calendar UI
  setupCalendarUI() {
    const calendarHTML = `
      <div id="booking-calendar-modal" class="modal booking-calendar-modal">
        <div class="modal-content calendar-content">
          <button class="modal-close" onclick="bookingCalendar.closeCalendar()">×</button>
          
          <div class="calendar-header">
            <h2 class="gold-accent">Select Your Dates</h2>
            <div class="item-info">
              <h3 id="calendar-item-name"></h3>
              <p id="calendar-item-location"></p>
            </div>
          </div>

          <div class="calendar-body">
            <div class="calendar-grid">
              <div class="calendar-navigation">
                <button id="prev-month" class="nav-btn">‹</button>
                <h3 id="current-month"></h3>
                <button id="next-month" class="nav-btn">›</button>
              </div>
              
              <div class="calendar-dates" id="calendar-dates">
                <!-- Calendar dates will be generated here -->
              </div>
            </div>

            <div class="booking-summary">
              <h3 class="gold-accent">Booking Summary</h3>
              
              <div class="date-selection">
                <div class="date-input">
                  <label>Check-in Date:</label>
                  <span id="selected-start-date">Select date</span>
                </div>
                <div class="date-input">
                  <label>Check-out Date:</label>
                  <span id="selected-end-date">Select date</span>
                </div>
                <div class="duration">
                  <label>Duration:</label>
                  <span id="booking-duration">0 days</span>
                </div>
              </div>

              <div class="pricing-breakdown">
                <div class="price-row">
                  <span>Base Price per Day:</span>
                  <span id="base-price">-</span>
                </div>
                <div class="price-row">
                  <span>Subtotal (<span id="total-days">0</span> days):</span>
                  <span id="subtotal">-</span>
                </div>
                <div class="price-row">
                  <span>Taxes & Fees:</span>
                  <span id="taxes">-</span>
                </div>
                <div class="price-row">
                  <span>Security Deposit:</span>
                  <span id="deposit">-</span>
                </div>
                <div class="price-row total">
                  <span>Total Amount:</span>
                  <span id="total-amount">-</span>
                </div>
              </div>

              <div class="location-selection">
                <label for="booking-location">Pickup Location:</label>
                <select id="booking-location" class="location-select">
                  <!-- Options will be populated based on item availability -->
                </select>
              </div>

              <div class="calendar-actions">
                <button id="clear-dates" class="btn-secondary">Clear Dates</button>
                <button id="proceed-booking" class="btn-primary" disabled>Proceed to Payment</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add calendar to DOM if it doesn't exist
    if (!document.getElementById('booking-calendar-modal')) {
      document.body.insertAdjacentHTML('beforeend', calendarHTML);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Navigation buttons
    document.getElementById('prev-month')?.addEventListener('click', () => this.previousMonth());
    document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());
    
    // Action buttons
    document.getElementById('clear-dates')?.addEventListener('click', () => this.clearDates());
    document.getElementById('proceed-booking')?.addEventListener('click', () => this.proceedToPayment());
    
    // Location selection
    document.getElementById('booking-location')?.addEventListener('change', (e) => {
      this.updatePricing();
    });

    // Currency change listener
    document.addEventListener('currencyChanged', (e) => {
      this.currency = e.detail.currency;
      this.updatePricing();
    });
  }

  // Open calendar for specific item
  openCalendar(itemId) {
    this.selectedItem = this.getItemById(itemId);
    if (!this.selectedItem) {
      console.error('Item not found:', itemId);
      return;
    }

    // Update item info
    document.getElementById('calendar-item-name').textContent = this.selectedItem.name;
    document.getElementById('calendar-item-location').textContent = 
      `Available in: ${this.selectedItem.availability.locations.join(', ')}`;

    // Populate location options
    this.populateLocationOptions();

    // Initialize calendar view
    this.currentDate = new Date();
    this.renderCalendar();

    // Show modal
    document.getElementById('booking-calendar-modal').classList.add('active');
  }

  // Close calendar
  closeCalendar() {
    document.getElementById('booking-calendar-modal').classList.remove('active');
    this.clearDates();
    this.selectedItem = null;
  }

  // Get item by ID
  getItemById(itemId) {
    for (const category of Object.values(this.inventory.categories)) {
      const item = category.items.find(item => item.id === itemId);
      if (item) return item;
    }
    return null;
  }

  // Populate location options
  populateLocationOptions() {
    const locationSelect = document.getElementById('booking-location');
    locationSelect.innerHTML = '';
    
    this.selectedItem.availability.locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationSelect.appendChild(option);
    });
  }

  // Render calendar for current month
  renderCalendar() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Update month header
    document.getElementById('current-month').textContent = 
      `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

    // Generate calendar dates
    this.generateCalendarDates();
  }

  // Generate calendar dates
  generateCalendarDates() {
    const calendarDates = document.getElementById('calendar-dates');
    calendarDates.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.textContent = day;
      calendarDates.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateElement = this.createDateElement(date);
      calendarDates.appendChild(dateElement);
    }
  }

  // Create individual date element
  createDateElement(date) {
    const dateElement = document.createElement('div');
    dateElement.className = 'calendar-date';
    dateElement.textContent = date.getDate();
    
    const dateString = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Add classes based on date status
    if (date.getMonth() !== this.currentDate.getMonth()) {
      dateElement.classList.add('other-month');
    }
    
    if (dateString < today) {
      dateElement.classList.add('past-date');
    } else {
      dateElement.classList.add('available');
      dateElement.addEventListener('click', () => this.selectDate(dateString));
    }
    
    // Check if date is booked
    if (this.isDateBooked(dateString)) {
      dateElement.classList.add('booked');
      dateElement.classList.remove('available');
    }
    
    // Highlight selected dates
    if (this.selectedDates.start === dateString || this.selectedDates.end === dateString) {
      dateElement.classList.add('selected');
    }
    
    // Highlight dates in range
    if (this.isDateInRange(dateString)) {
      dateElement.classList.add('in-range');
    }
    
    return dateElement;
  }

  // Check if date is booked
  isDateBooked(dateString) {
    if (!this.selectedItem || !this.bookings.has(this.selectedItem.id)) {
      return false;
    }
    
    const itemBookings = this.bookings.get(this.selectedItem.id);
    return itemBookings.some(booking => {
      return dateString >= booking.startDate && dateString <= booking.endDate;
    });
  }

  // Check if date is in selected range
  isDateInRange(dateString) {
    if (!this.selectedDates.start || !this.selectedDates.end) {
      return false;
    }
    
    return dateString > this.selectedDates.start && dateString < this.selectedDates.end;
  }

  // Select date
  selectDate(dateString) {
    if (this.isDateBooked(dateString)) {
      return; // Can't select booked dates
    }
    
    if (!this.selectedDates.start || (this.selectedDates.start && this.selectedDates.end)) {
      // Start new selection
      this.selectedDates.start = dateString;
      this.selectedDates.end = null;
    } else {
      // Complete selection
      if (dateString > this.selectedDates.start) {
        this.selectedDates.end = dateString;
      } else {
        this.selectedDates.end = this.selectedDates.start;
        this.selectedDates.start = dateString;
      }
    }
    
    this.updateDateSelection();
    this.renderCalendar(); // Re-render to update highlights
  }

  // Update date selection display
  updateDateSelection() {
    const startElement = document.getElementById('selected-start-date');
    const endElement = document.getElementById('selected-end-date');
    const durationElement = document.getElementById('booking-duration');
    const proceedButton = document.getElementById('proceed-booking');
    
    if (this.selectedDates.start) {
      startElement.textContent = new Date(this.selectedDates.start).toLocaleDateString();
    } else {
      startElement.textContent = 'Select date';
    }
    
    if (this.selectedDates.end) {
      endElement.textContent = new Date(this.selectedDates.end).toLocaleDateString();
      
      // Calculate duration
      const start = new Date(this.selectedDates.start);
      const end = new Date(this.selectedDates.end);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      durationElement.textContent = `${days} day${days !== 1 ? 's' : ''}`;
      this.pricing.totalDays = days;
      
      // Enable proceed button
      proceedButton.disabled = false;
      
      // Update pricing
      this.updatePricing();
    } else {
      endElement.textContent = 'Select date';
      durationElement.textContent = '0 days';
      proceedButton.disabled = true;
      this.pricing.totalDays = 0;
    }
  }

  // Update pricing calculation
  updatePricing() {
    if (!this.selectedItem || this.pricing.totalDays === 0) {
      this.clearPricing();
      return;
    }

    const category = this.getCategoryByItem(this.selectedItem);
    const pricingPeriod = this.getPricingPeriod(category);
    const basePrice = this.selectedItem.pricing[pricingPeriod][this.currency];
    
    this.pricing.basePrice = basePrice;
    this.pricing.subtotal = basePrice * this.pricing.totalDays;
    this.pricing.taxes = Math.round(this.pricing.subtotal * 0.15); // 15% taxes
    this.pricing.deposit = this.selectedItem.pricing.deposit ? 
      this.selectedItem.pricing.deposit[this.currency] : 
      Math.round(this.pricing.subtotal * 0.3); // 30% deposit if not specified
    this.pricing.total = this.pricing.subtotal + this.pricing.taxes;

    this.displayPricing();
  }

  // Display pricing
  displayPricing() {
    const currencySymbol = this.currency === 'aed' ? 'AED' : '$';
    
    document.getElementById('base-price').textContent = 
      `${currencySymbol} ${this.pricing.basePrice.toLocaleString()}`;
    document.getElementById('total-days').textContent = this.pricing.totalDays;
    document.getElementById('subtotal').textContent = 
      `${currencySymbol} ${this.pricing.subtotal.toLocaleString()}`;
    document.getElementById('taxes').textContent = 
      `${currencySymbol} ${this.pricing.taxes.toLocaleString()}`;
    document.getElementById('deposit').textContent = 
      `${currencySymbol} ${this.pricing.deposit.toLocaleString()}`;
    document.getElementById('total-amount').textContent = 
      `${currencySymbol} ${this.pricing.total.toLocaleString()}`;
  }

  // Clear pricing display
  clearPricing() {
    ['base-price', 'subtotal', 'taxes', 'deposit', 'total-amount'].forEach(id => {
      document.getElementById(id).textContent = '-';
    });
    document.getElementById('total-days').textContent = '0';
  }

  // Get category by item
  getCategoryByItem(item) {
    for (const [categoryKey, category] of Object.entries(this.inventory.categories)) {
      if (category.items.some(i => i.id === item.id)) {
        return categoryKey;
      }
    }
    return null;
  }

  // Get pricing period based on category
  getPricingPeriod(category) {
    switch (category) {
      case 'cars': return 'daily';
      case 'yachts': return 'daily';
      case 'jets': return 'trip';
      case 'properties': return 'nightly';
      default: return 'daily';
    }
  }

  // Clear selected dates
  clearDates() {
    this.selectedDates.start = null;
    this.selectedDates.end = null;
    this.pricing.totalDays = 0;
    this.updateDateSelection();
    this.clearPricing();
    this.renderCalendar();
  }

  // Navigate to previous month
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  // Navigate to next month
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  // Proceed to payment
  proceedToPayment() {
    if (!this.selectedDates.start || !this.selectedDates.end) {
      alert('Please select both check-in and check-out dates.');
      return;
    }

    const bookingData = {
      item: this.selectedItem,
      startDate: this.selectedDates.start,
      endDate: this.selectedDates.end,
      location: document.getElementById('booking-location').value,
      pricing: this.pricing,
      currency: this.currency
    };

    // Close calendar and open payment modal
    this.closeCalendar();
    
    // Initialize payment system with booking data
    if (window.paymentSystem) {
      window.paymentSystem.initializePayment(bookingData);
    } else {
      console.error('Payment system not available');
      alert('Payment system is being initialized. Please try again in a moment.');
    }
  }
}

// Initialize booking calendar
const bookingCalendar = new BookingCalendar();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookingCalendar;
} else {
  window.BookingCalendar = BookingCalendar;
  window.bookingCalendar = bookingCalendar;
}
