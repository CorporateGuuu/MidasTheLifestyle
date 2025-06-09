// User Authentication System for Mida Luxury Rentals
// Customer account management and authentication

class UserAuth {
  constructor() {
    this.currentUser = null;
    this.users = new Map(); // In production, use proper database
    this.bookingHistory = new Map();
    this.favorites = new Map();
    this.googleAuth = null;
    this.googleClientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // Replace with actual Google Client ID
    this.init();
  }

  // Initialize authentication system
  init() {
    this.loadStoredUser();
    this.setupAuthUI();
    this.setupEventListeners();
    this.loadSampleData();
    this.initializeGoogleAuth();
    console.log('👤 User Authentication System with Google OAuth initialized');
  }

  // Initialize Google Authentication
  initializeGoogleAuth() {
    // Wait for Google API to load
    if (typeof google !== 'undefined' && google.accounts) {
      this.setupGoogleSignIn();
    } else {
      // Retry after a short delay if Google API isn't loaded yet
      setTimeout(() => {
        this.initializeGoogleAuth();
      }, 1000);
    }
  }

  // Setup Google Sign-In
  setupGoogleSignIn() {
    try {
      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response) => this.handleGoogleSignIn(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Setup Google Sign-In buttons
      this.setupGoogleButtons();
      console.log('🔐 Google Authentication initialized');
    } catch (error) {
      console.warn('Google Authentication setup failed:', error);
      this.showGoogleAuthError();
    }
  }

  // Setup Google Sign-In buttons
  setupGoogleButtons() {
    const googleButtons = document.querySelectorAll('.google-btn');
    googleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.initiateGoogleSignIn();
      });
    });
  }

  // Initiate Google Sign-In
  initiateGoogleSignIn() {
    try {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to renderButton if prompt fails
          this.renderGoogleButton();
        }
      });
    } catch (error) {
      console.error('Google Sign-In initiation failed:', error);
      this.showGoogleAuthError();
    }
  }

  // Render Google Sign-In button as fallback
  renderGoogleButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'google-signin-button';

    google.accounts.id.renderButton(buttonContainer, {
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    });

    // Replace existing Google button with rendered one
    const existingButton = document.querySelector('.google-btn');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.replaceChild(buttonContainer, existingButton);
    }
  }

  // Handle Google Sign-In response
  handleGoogleSignIn(response) {
    try {
      // Decode the JWT token
      const payload = this.decodeJWT(response.credential);

      if (payload) {
        const googleUser = {
          id: payload.sub,
          email: payload.email,
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
          fullName: payload.name || '',
          picture: payload.picture || '',
          provider: 'google',
          verified: payload.email_verified || false
        };

        this.processGoogleUser(googleUser);
      }
    } catch (error) {
      console.error('Google Sign-In processing failed:', error);
      this.showAuthError('Google authentication failed. Please try again.');
    }
  }

  // Decode JWT token
  decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  // Process Google user data
  processGoogleUser(googleUser) {
    // Check if user already exists
    let existingUser = this.users.get(googleUser.email);

    if (existingUser) {
      // Update existing user with Google data
      existingUser = {
        ...existingUser,
        picture: googleUser.picture,
        provider: 'google',
        lastLogin: new Date().toISOString()
      };
      this.users.set(googleUser.email, existingUser);
    } else {
      // Create new user from Google data
      const newUser = {
        id: `google_${googleUser.id}`,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        fullName: googleUser.fullName,
        picture: googleUser.picture,
        phone: '',
        preferences: [],
        provider: 'google',
        verified: googleUser.verified,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      this.users.set(googleUser.email, newUser);

      // Initialize empty booking history and favorites for new user
      this.bookingHistory.set(newUser.id, []);
      this.favorites.set(newUser.id, []);
    }

    // Set as current user and update UI
    this.currentUser = this.users.get(googleUser.email);
    this.saveUserToStorage();
    this.updateUIForLoggedInUser();
    this.closeAuthModal();

    this.showSuccessMessage(`Welcome ${this.currentUser.firstName || this.currentUser.fullName}! You're now signed in.`);
  }

  // Show Google Auth error
  showGoogleAuthError() {
    const googleButtons = document.querySelectorAll('.google-btn');
    googleButtons.forEach(button => {
      button.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        Google Sign-In Unavailable
      `;
      button.disabled = true;
      button.style.opacity = '0.6';
      button.style.cursor = 'not-allowed';
    });
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
      <!-- Enhanced Login Modal -->
      <div id="login-modal" class="modal auth-modal">
        <div class="modal-content auth-content enhanced-auth">
          <button class="modal-close luxury-close" onclick="userAuth.closeAuthModal()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="auth-header luxury-header">
            <div class="auth-logo">
              <div class="crown-icon">♔</div>
              <h1 class="brand-name">Midas The Lifestyle</h1>
            </div>
            <h2 class="auth-title">Welcome Back</h2>
            <p class="auth-subtitle">Sign in to your exclusive account</p>
          </div>

          <form id="login-form" class="auth-form luxury-form">
            <div class="form-group luxury-input-group">
              <label for="login-email" class="luxury-label">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
                Email Address
              </label>
              <input type="email" id="login-email" class="luxury-input" placeholder="Enter your email" required>
            </div>

            <div class="form-group luxury-input-group">
              <label for="login-password" class="luxury-label">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Password
              </label>
              <input type="password" id="login-password" class="luxury-input" placeholder="Enter your password" required>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" id="remember-me">
                <span class="checkmark-luxury"></span>
                Remember me
              </label>
              <a href="#" onclick="userAuth.showForgotPassword()" class="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" class="luxury-btn primary-btn">
              <span class="btn-text">Sign In</span>
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
            </button>

            <div class="auth-divider">
              <span>or</span>
            </div>

            <div class="social-login">
              <button type="button" class="social-btn google-btn">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div class="auth-links luxury-links">
              <p class="signup-prompt">
                Don't have an account?
                <a href="#" onclick="userAuth.showRegister()" class="signup-link">Create Account</a>
              </p>
            </div>
          </form>

          <div class="auth-footer">
            <p class="security-note">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>
      </div>

      <!-- Enhanced Register Modal -->
      <div id="register-modal" class="modal auth-modal">
        <div class="modal-content auth-content enhanced-auth">
          <button class="modal-close luxury-close" onclick="userAuth.closeAuthModal()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="auth-header luxury-header">
            <div class="auth-logo">
              <div class="crown-icon">♔</div>
              <h1 class="brand-name">Midas The Lifestyle</h1>
            </div>
            <h2 class="auth-title">Join Our Elite</h2>
            <p class="auth-subtitle">Create your exclusive luxury account</p>
          </div>

          <form id="register-form" class="auth-form luxury-form">
            <div class="form-row luxury-row">
              <div class="form-group luxury-input-group">
                <label for="register-first-name" class="luxury-label">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  First Name
                </label>
                <input type="text" id="register-first-name" class="luxury-input" placeholder="Enter first name" required>
              </div>
              <div class="form-group luxury-input-group">
                <label for="register-last-name" class="luxury-label">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Last Name
                </label>
                <input type="text" id="register-last-name" class="luxury-input" placeholder="Enter last name" required>
              </div>
            </div>

            <div class="form-group luxury-input-group">
              <label for="register-email" class="luxury-label">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
                Email Address
              </label>
              <input type="email" id="register-email" class="luxury-input" placeholder="Enter your email" required>
            </div>

            <div class="form-group luxury-input-group">
              <label for="register-phone" class="luxury-label">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                Phone Number
              </label>
              <input type="tel" id="register-phone" class="luxury-input" placeholder="Enter your phone" required>
            </div>

            <div class="form-row luxury-row">
              <div class="form-group luxury-input-group">
                <label for="register-password" class="luxury-label">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Password
                </label>
                <input type="password" id="register-password" class="luxury-input" placeholder="Create password" required>
              </div>
              <div class="form-group luxury-input-group">
                <label for="register-confirm-password" class="luxury-label">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Confirm Password
                </label>
                <input type="password" id="register-confirm-password" class="luxury-input" placeholder="Confirm password" required>
              </div>
            </div>

            <div class="form-group luxury-checkbox-group">
              <label class="luxury-checkbox-label">
                <input type="checkbox" id="register-terms" required>
                <span class="luxury-checkmark"></span>
                <span class="checkbox-text">
                  I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>
                </span>
              </label>
            </div>

            <div class="form-group luxury-checkbox-group">
              <label class="luxury-checkbox-label">
                <input type="checkbox" id="register-marketing">
                <span class="luxury-checkmark"></span>
                <span class="checkbox-text">
                  I would like to receive exclusive offers and luxury lifestyle updates
                </span>
              </label>
            </div>

            <button type="submit" class="luxury-btn primary-btn">
              <span class="btn-text">Create Account</span>
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </button>

            <div class="auth-divider">
              <span>or</span>
            </div>

            <div class="social-login">
              <button type="button" class="social-btn google-btn">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>
            </div>

            <div class="auth-links luxury-links">
              <p class="signup-prompt">
                Already have an account?
                <a href="#" onclick="userAuth.showLogin()" class="signup-link">Sign In</a>
              </p>
            </div>
          </form>

          <div class="auth-footer">
            <p class="security-note">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Join thousands of elite members worldwide
            </p>
          </div>
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
