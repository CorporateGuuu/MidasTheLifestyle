// User Model for Midas The Lifestyle
// Comprehensive user management with luxury service tiers and preferences

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User schema with luxury service features
const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required if not Google OAuth user
    },
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  
  // Personal Details
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        return date < new Date() && date > new Date('1900-01-01');
      },
      message: 'Please enter a valid date of birth'
    }
  },
  
  // Address Information
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  
  // Luxury Service Profile
  serviceProfile: {
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vvip'],
      default: 'standard'
    },
    preferredLocations: [{
      type: String,
      enum: ['dubai', 'washington-dc', 'houston', 'atlanta', 'maryland', 'northern-virginia']
    }],
    preferredVehicleTypes: [{
      type: String,
      enum: ['cars', 'yachts', 'jets', 'properties']
    }],
    specialRequests: [{
      category: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    conciergeNotes: String,
    vipPreferences: {
      chauffeurService: { type: Boolean, default: false },
      airportPickup: { type: Boolean, default: false },
      customDelivery: { type: Boolean, default: false },
      personalConcierge: { type: Boolean, default: false }
    }
  },
  
  // Authentication & Security
  googleId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  
  // Account Status
  role: {
    type: String,
    enum: ['customer', 'concierge', 'admin', 'super-admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending-verification'],
    default: 'pending-verification'
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Business Metrics
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageBookingValue: {
    type: Number,
    default: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  
  // Communication Preferences
  notifications: {
    email: {
      bookingConfirmations: { type: Boolean, default: true },
      paymentReceipts: { type: Boolean, default: true },
      promotionalOffers: { type: Boolean, default: true },
      serviceUpdates: { type: Boolean, default: true }
    },
    sms: {
      bookingReminders: { type: Boolean, default: false },
      emergencyAlerts: { type: Boolean, default: true }
    },
    push: {
      enabled: { type: Boolean, default: false },
      deviceTokens: [String]
    }
  },
  
  // Privacy & Compliance
  gdprConsent: {
    given: { type: Boolean, default: false },
    date: Date,
    ipAddress: String
  },
  marketingConsent: {
    given: { type: Boolean, default: false },
    date: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'serviceProfile.tier': 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to update service tier based on spending
userSchema.methods.updateServiceTier = function() {
  if (this.totalSpent >= 100000) { // $100K+ = VVIP
    this.serviceProfile.tier = 'vvip';
  } else if (this.totalSpent >= 25000) { // $25K+ = Premium
    this.serviceProfile.tier = 'premium';
  } else {
    this.serviceProfile.tier = 'standard';
  }
};

// Method to calculate loyalty points
userSchema.methods.addLoyaltyPoints = function(bookingAmount) {
  const pointsMultiplier = {
    'standard': 1,
    'premium': 1.5,
    'vvip': 2
  };
  
  const points = Math.floor(bookingAmount * pointsMultiplier[this.serviceProfile.tier]);
  this.loyaltyPoints += points;
  return points;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find VIP users
userSchema.statics.findVIP = function() {
  return this.find({ 
    'serviceProfile.tier': { $in: ['premium', 'vvip'] },
    status: 'active'
  });
};

module.exports = mongoose.model('User', userSchema);
