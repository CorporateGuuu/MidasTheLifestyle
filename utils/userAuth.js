// User Authentication System for Mida Luxury Rentals
// Customer account management and authentication

class UserAuth {
  constructor() {
    this.currentUser = null;
    this.users = new Map(); // In production, use proper database
    this.bookingHistory = new Map();
    this.favorites = new Map();
    this.init();
  }

  // Initialize authentication system
  init() {
    this.loadStoredUser();
    this.setupAuthUI();
    this.setupEventListeners();
    this.loadSampleData();
    console.log('👤 User Authentication System initialized');
  }

  // Load stored user from localStorage
  loadStoredUser() {
    try {
      const storedUser = localStorage.getItem('mida_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.updateUIForLoggedInUser();
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
  }

  // Setup authentication UI
  setupAuthUI() {
    const authHTML = `
      <!-- Login Modal -->
      <div id="login-modal" class="modal auth-modal">
        <div class="modal-content auth-content">
          <button class="modal-close" onclick="userAuth.closeAuthModal()">×</button>
          
          <div class="auth-header">
            <h2 class="gold-accent">Welcome Back</h2>
            <p>Sign in to your Mida account</p>
          </div>

          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login-email">Email Address</label>
              <input type="email" id="login-email" required>
            </div>
            
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" required>
            </div>
            
            <button type="submit" class="btn-primary auth-btn">Sign In</button>
            
            <div class="auth-links">
              <a href="#" onclick="userAuth.showRegister()">Don't have an account? Sign up</a>
              <a href="#" onclick="userAuth.showForgotPassword()">Forgot password?</a>
            </div>
          </form>
        </div>
      </div>

      <!-- Register Modal -->
      <div id="register-modal" class="modal auth-modal">
        <div class="modal-content auth-content">
          <button class="modal-close" onclick="userAuth.closeAuthModal()">×</button>
          
          <div class="auth-header">
            <h2 class="gold-accent">Join Mida</h2>
            <p>Create your luxury account</p>
          </div>

          <form id="register-form" class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label for="register-first-name">First Name</label>
                <input type="text" id="register-first-name" required>
              </div>
              <div class="form-group">
                <label for="register-last-name">Last Name</label>
                <input type="text" id="register-last-name" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="register-email">Email Address</label>
              <input type="email" id="register-email" required>
            </div>
            
            <div class="form-group">
              <label for="register-phone">Phone Number</label>
              <input type="tel" id="register-phone" required>
            </div>
            
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" required>
            </div>
            
            <div class="form-group">
              <label for="register-confirm-password">Confirm Password</label>
              <input type="password" id="register-confirm-password" required>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" id="register-terms" required>
                <span class="checkmark"></span>
                I agree to the <a href="#" class="gold-accent">Terms of Service</a> and <a href="#" class="gold-accent">Privacy Policy</a>
              </label>
            </div>
            
            <button type="submit" class="btn-primary auth-btn">Create Account</button>
            
            <div class="auth-links">
              <a href="#" onclick="userAuth.showLogin()">Already have an account? Sign in</a>
            </div>
          </form>
        </div>
      </div>

      <!-- User Dashboard Modal -->
      <div id="dashboard-modal" class="modal dashboard-modal">
        <div class="modal-content dashboard-content">
          <button class="modal-close" onclick="userAuth.closeDashboard()">×</button>
          
          <div class="dashboard-header">
            <h2 class="gold-accent">My Account</h2>
            <div class="user-info">
              <h3 id="dashboard-user-name"></h3>
              <p id="dashboard-user-email"></p>
            </div>
          </div>

          <div class="dashboard-tabs">
            <button class="tab-btn active" data-tab="bookings">My Bookings</button>
            <button class="tab-btn" data-tab="favorites">Favorites</button>
            <button class="tab-btn" data-tab="profile">Profile</button>
          </div>

          <div class="dashboard-content-area">
            <div id="bookings-tab" class="tab-content active">
              <h3>Booking History</h3>
              <div id="booking-history-list">
                <!-- Booking history will be populated here -->
              </div>
            </div>

            <div id="favorites-tab" class="tab-content">
              <h3>Favorite Items</h3>
              <div id="favorites-list">
                <!-- Favorites will be populated here -->
              </div>
            </div>

            <div id="profile-tab" class="tab-content">
              <h3>Profile Settings</h3>
              <form id="profile-form" class="profile-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="profile-first-name">First Name</label>
                    <input type="text" id="profile-first-name">
                  </div>
                  <div class="form-group">
                    <label for="profile-last-name">Last Name</label>
                    <input type="text" id="profile-last-name">
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="profile-email">Email Address</label>
                  <input type="email" id="profile-email">
                </div>
                
                <div class="form-group">
                  <label for="profile-phone">Phone Number</label>
                  <input type="tel" id="profile-phone">
                </div>
                
                <div class="form-group">
                  <label for="profile-preferences">Preferred Locations</label>
                  <select id="profile-preferences" multiple>
                    <option value="dubai">Dubai</option>
                    <option value="washington-dc">Washington DC</option>
                    <option value="maryland">Maryland</option>
                    <option value="northern-virginia">Northern Virginia</option>
                    <option value="atlanta">Atlanta, GA</option>
                  </select>
                </div>
                
                <button type="submit" class="btn-primary">Update Profile</button>
              </form>
              
              <div class="danger-zone">
                <h4>Account Actions</h4>
                <button onclick="userAuth.logout()" class="btn-secondary">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Menu in Navigation -->
      <div id="user-menu" class="user-menu" style="display: none;">
        <button id="user-menu-btn" class="user-menu-btn">
          <span id="user-name-display"></span>
          <span class="user-avatar">👤</span>
        </button>
        <div id="user-dropdown" class="user-dropdown">
          <a href="#" onclick="userAuth.showDashboard()">My Account</a>
          <a href="#" onclick="userAuth.showBookings()">My Bookings</a>
          <a href="#" onclick="userAuth.showFavorites()">Favorites</a>
          <a href="#" onclick="userAuth.logout()">Sign Out</a>
        </div>
      </div>

      <!-- Login Button for Navigation -->
      <button id="login-btn" class="login-btn" onclick="userAuth.showLogin()">
        Sign In
      </button>
    `;

    // Add auth UI to DOM if it doesn't exist
    if (!document.getElementById('login-modal')) {
      document.body.insertAdjacentHTML('beforeend', authHTML);
      
      // Add user menu to navigation
      const nav = document.querySelector('nav .container');
      if (nav) {
        const userMenu = document.getElementById('user-menu');
        const loginBtn = document.getElementById('login-btn');
        nav.appendChild(userMenu);
        nav.appendChild(loginBtn);
      }
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProfileUpdate();
    });

    // Dashboard tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // User menu dropdown
    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      this.toggleUserDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#user-menu')) {
        this.closeUserDropdown();
      }
    });
  }

  // Load sample data for demonstration
  loadSampleData() {
    // Sample user
    const sampleUser = {
      id: 'user_001',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 555 123 4567',
      preferences: ['dubai', 'washington-dc'],
      createdAt: '2025-01-01T00:00:00Z'
    };

    this.users.set(sampleUser.email, {
      ...sampleUser,
      password: 'hashed_password_123' // In production, properly hash passwords
    });

    // Sample booking history
    this.bookingHistory.set(sampleUser.id, [
      {
        id: 'booking_001',
        itemId: 'bugatti-chiron-001',
        itemName: 'Bugatti Chiron',
        startDate: '2025-05-15',
        endDate: '2025-05-17',
        location: 'Dubai',
        status: 'completed',
        total: 40000
      }
    ]);

    // Sample favorites
    this.favorites.set(sampleUser.id, [
      'bugatti-chiron-001',
      'gulfstream-g700-001'
    ]);
  }

  // Show login modal
  showLogin() {
    this.closeAuthModal();
    document.getElementById('login-modal').classList.add('active');
  }

  // Show register modal
  showRegister() {
    this.closeAuthModal();
    document.getElementById('register-modal').classList.add('active');
  }

  // Show forgot password modal
  showForgotPassword() {
    this.closeAuthModal();

    // Create forgot password modal if it doesn't exist
    if (!document.getElementById('forgot-password-modal')) {
      const forgotPasswordHTML = `
        <div id="forgot-password-modal" class="modal auth-modal">
          <div class="modal-content auth-content">
            <button class="modal-close" onclick="userAuth.closeAuthModal()">×</button>

            <div class="auth-header">
              <h2 class="gold-accent">Reset Password</h2>
              <p>Enter your email address and we'll send you a reset link</p>
            </div>

            <form id="forgot-password-form" class="auth-form">
              <div class="form-group">
                <label for="forgot-email">Email Address</label>
                <input type="email" id="forgot-email" required>
              </div>

              <button type="submit" class="btn-primary auth-btn">Send Reset Link</button>

              <div class="auth-links">
                <a href="#" onclick="userAuth.showLogin()">Back to Sign In</a>
              </div>
            </form>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', forgotPasswordHTML);

      // Add event listener for forgot password form
      document.getElementById('forgot-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }

    document.getElementById('forgot-password-modal').classList.add('active');
  }

  // Handle forgot password
  async handleForgotPassword() {
    const email = document.getElementById('forgot-email').value;

    try {
      // Check if user exists
      if (!this.users.has(email)) {
        throw new Error('No account found with this email address');
      }

      // Generate reset token (in production, this would be done securely on the server)
      const resetToken = this.generateResetToken();
      const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour expiry

      // Store reset token (in production, store in secure database)
      const resetData = {
        email: email,
        token: resetToken,
        expiry: resetExpiry,
        used: false
      };

      // Store in localStorage for demo (use secure server storage in production)
      localStorage.setItem(`reset_${resetToken}`, JSON.stringify(resetData));

      // Send reset email (simulate for demo)
      await this.sendPasswordResetEmail(email, resetToken);

      // Show success message
      this.showPasswordResetSuccess(email);

    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Generate reset token
  generateResetToken() {
    return 'reset_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Send password reset email (simulated)
  async sendPasswordResetEmail(email, resetToken) {
    // In production, this would call your backend to send actual email
    console.log(`Password reset email would be sent to: ${email}`);
    console.log(`Reset link: ${window.location.origin}/reset-password?token=${resetToken}`);

    // Simulate API call
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show password reset success
  showPasswordResetSuccess(email) {
    this.closeAuthModal();

    const successHTML = `
      <div id="reset-success-modal" class="modal auth-modal active">
        <div class="modal-content auth-content">
          <div class="auth-header">
            <div class="text-6xl mb-4">📧</div>
            <h2 class="gold-accent">Check Your Email</h2>
            <p>We've sent a password reset link to:</p>
            <p class="text-[#D4AF37] font-semibold">${email}</p>
          </div>

          <div class="reset-instructions">
            <h3 class="gold-accent mb-4">Next Steps:</h3>
            <ol class="text-left text-gray-300 space-y-2">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the reset link in the email</li>
              <li>3. Create a new password</li>
              <li>4. Sign in with your new password</li>
            </ol>
          </div>

          <div class="auth-links mt-6">
            <a href="#" onclick="this.closest('.modal').remove(); userAuth.showLogin()">Back to Sign In</a>
            <a href="#" onclick="userAuth.resendResetEmail('${email}')">Didn't receive email? Resend</a>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);
  }

  // Close auth modals
  closeAuthModal() {
    document.querySelectorAll('.auth-modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  // Handle login
  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      // In production, validate against secure backend
      const user = this.users.get(email);
      if (!user || user.password !== 'hashed_password_123') {
        throw new Error('Invalid email or password');
      }

      // Set current user
      this.currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        preferences: user.preferences
      };

      // Store in localStorage
      localStorage.setItem('mida_user', JSON.stringify(this.currentUser));

      // Update UI
      this.updateUIForLoggedInUser();
      this.closeAuthModal();

      // Show success message
      this.showNotification('Welcome back! You are now signed in.', 'success');

    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Handle registration
  async handleRegister() {
    const firstName = document.getElementById('register-first-name').value;
    const lastName = document.getElementById('register-last-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const termsAccepted = document.getElementById('register-terms').checked;

    try {
      // Validation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!termsAccepted) {
        throw new Error('Please accept the Terms of Service');
      }

      if (this.users.has(email)) {
        throw new Error('An account with this email already exists');
      }

      // Create new user
      const newUser = {
        id: 'user_' + Date.now(),
        email,
        firstName,
        lastName,
        phone,
        preferences: [],
        createdAt: new Date().toISOString()
      };

      // Store user (in production, hash password and save to database)
      this.users.set(email, {
        ...newUser,
        password: 'hashed_' + password // Properly hash in production
      });

      // Set as current user
      this.currentUser = newUser;
      localStorage.setItem('mida_user', JSON.stringify(this.currentUser));

      // Initialize empty history and favorites
      this.bookingHistory.set(newUser.id, []);
      this.favorites.set(newUser.id, []);

      // Update UI
      this.updateUIForLoggedInUser();
      this.closeAuthModal();

      // Show success message
      this.showNotification('Account created successfully! Welcome to Mida.', 'success');

    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Update UI for logged in user
  updateUIForLoggedInUser() {
    if (!this.currentUser) return;

    // Hide login button, show user menu
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('user-menu').style.display = 'block';

    // Update user name display
    document.getElementById('user-name-display').textContent = 
      `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  // Update UI for logged out user
  updateUIForLoggedOutUser() {
    // Show login button, hide user menu
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('user-menu').style.display = 'none';
  }

  // Show user dashboard
  showDashboard() {
    if (!this.currentUser) {
      this.showLogin();
      return;
    }

    this.populateDashboard();
    document.getElementById('dashboard-modal').classList.add('active');
    this.closeUserDropdown();
  }

  // Populate dashboard with user data
  populateDashboard() {
    // User info
    document.getElementById('dashboard-user-name').textContent = 
      `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    document.getElementById('dashboard-user-email').textContent = this.currentUser.email;

    // Populate profile form
    document.getElementById('profile-first-name').value = this.currentUser.firstName;
    document.getElementById('profile-last-name').value = this.currentUser.lastName;
    document.getElementById('profile-email').value = this.currentUser.email;
    document.getElementById('profile-phone').value = this.currentUser.phone || '';

    // Load booking history
    this.loadBookingHistory();

    // Load favorites
    this.loadFavorites();
  }

  // Load booking history
  loadBookingHistory() {
    const bookingsList = document.getElementById('booking-history-list');
    const bookings = this.bookingHistory.get(this.currentUser.id) || [];

    if (bookings.length === 0) {
      bookingsList.innerHTML = '<p class="empty-state">No bookings yet. Start exploring our luxury collection!</p>';
      return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
      <div class="booking-card">
        <div class="booking-info">
          <h4>${booking.itemName}</h4>
          <p>${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</p>
          <p>Location: ${booking.location}</p>
        </div>
        <div class="booking-status">
          <span class="status-badge ${booking.status}">${booking.status}</span>
          <span class="booking-total">AED ${booking.total.toLocaleString()}</span>
        </div>
      </div>
    `).join('');
  }

  // Load favorites
  loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const userFavorites = this.favorites.get(this.currentUser.id) || [];

    if (userFavorites.length === 0) {
      favoritesList.innerHTML = '<p class="empty-state">No favorites yet. Heart items you love to save them here!</p>';
      return;
    }

    // In production, fetch item details from inventory
    favoritesList.innerHTML = userFavorites.map(itemId => `
      <div class="favorite-card">
        <div class="favorite-info">
          <h4>Luxury Item</h4>
          <p>Item ID: ${itemId}</p>
        </div>
        <button onclick="userAuth.removeFavorite('${itemId}')" class="remove-favorite">❤️</button>
      </div>
    `).join('');
  }

  // Switch dashboard tabs
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
  }

  // Toggle user dropdown
  toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('active');
  }

  // Close user dropdown
  closeUserDropdown() {
    document.getElementById('user-dropdown').classList.remove('active');
  }

  // Close dashboard
  closeDashboard() {
    document.getElementById('dashboard-modal').classList.remove('active');
  }

  // Handle profile update
  handleProfileUpdate() {
    if (!this.currentUser) return;

    try {
      // Update current user data
      this.currentUser.firstName = document.getElementById('profile-first-name').value;
      this.currentUser.lastName = document.getElementById('profile-last-name').value;
      this.currentUser.phone = document.getElementById('profile-phone').value;

      // Update stored user
      localStorage.setItem('mida_user', JSON.stringify(this.currentUser));

      // Update UI
      this.updateUIForLoggedInUser();
      this.populateDashboard();

      this.showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      this.showNotification('Error updating profile: ' + error.message, 'error');
    }
  }

  // Add to favorites
  addToFavorites(itemId) {
    if (!this.currentUser) {
      this.showLogin();
      return;
    }

    const userFavorites = this.favorites.get(this.currentUser.id) || [];
    if (!userFavorites.includes(itemId)) {
      userFavorites.push(itemId);
      this.favorites.set(this.currentUser.id, userFavorites);
      this.showNotification('Added to favorites!', 'success');
    }
  }

  // Remove from favorites
  removeFavorite(itemId) {
    if (!this.currentUser) return;

    const userFavorites = this.favorites.get(this.currentUser.id) || [];
    const index = userFavorites.indexOf(itemId);
    if (index > -1) {
      userFavorites.splice(index, 1);
      this.favorites.set(this.currentUser.id, userFavorites);
      this.loadFavorites(); // Refresh favorites display
      this.showNotification('Removed from favorites', 'info');
    }
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('mida_user');
    this.updateUIForLoggedOutUser();
    this.closeDashboard();
    this.closeUserDropdown();
    this.showNotification('You have been signed out', 'info');
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Initialize user authentication
const userAuth = new UserAuth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserAuth;
} else {
  window.UserAuth = UserAuth;
  window.userAuth = userAuth;
}
