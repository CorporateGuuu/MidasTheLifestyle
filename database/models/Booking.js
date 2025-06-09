// Booking Model for Midas The Lifestyle
// Comprehensive booking management with luxury service features

const mongoose = require('mongoose');

// Booking schema with luxury rental features
const bookingSchema = new mongoose.Schema({
  // Booking Identification
  bookingId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `MIDAS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guestDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    // For bookings made by guests (non-registered users)
    isGuest: { type: Boolean, default: false }
  },
  
  // Item Information
  item: {
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemType: {
      type: String,
      enum: ['cars', 'yachts', 'jets', 'properties'],
      required: true
    },
    category: String, // e.g., 'supercar', 'luxury-sedan', 'superyacht'
    brand: String,
    model: String,
    year: Number,
    specifications: {
      engine: String,
      horsepower: Number,
      capacity: Number, // passengers for vehicles, guests for properties
      features: [String]
    },
    images: [String],
    description: String
  },
  
  // Booking Dates & Duration
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  duration: {
    days: { type: Number, required: true },
    hours: { type: Number, default: 0 }
  },
  
  // Location & Delivery
  location: {
    pickup: {
      type: {
        type: String,
        enum: ['address', 'airport', 'hotel', 'marina', 'custom'],
        default: 'address'
      },
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      specialInstructions: String
    },
    dropoff: {
      type: {
        type: String,
        enum: ['same-as-pickup', 'address', 'airport', 'hotel', 'marina', 'custom'],
        default: 'same-as-pickup'
      },
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      specialInstructions: String
    }
  },
  
  // Pricing & Payment
  pricing: {
    basePrice: { type: Number, required: true },
    serviceTier: {
      type: String,
      enum: ['standard', 'premium', 'vvip'],
      default: 'premium'
    },
    serviceTierMultiplier: { type: Number, default: 1.3 },
    seasonalMultiplier: { type: Number, default: 1.0 },
    subtotal: { type: Number, required: true },
    
    // Additional Services
    addOns: [{
      name: String,
      description: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }],
    addOnsTotal: { type: Number, default: 0 },
    
    // Fees & Taxes
    serviceFee: { type: Number, required: true },
    insurance: { type: Number, required: true },
    taxes: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    
    // Totals
    total: { type: Number, required: true },
    currency: {
      type: String,
      enum: ['USD', 'AED', 'EUR', 'GBP'],
      default: 'USD'
    }
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'bank-transfer', 'cryptocurrency'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially-refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentIntentId: String, // Stripe payment intent ID
    paidAmount: { type: Number, default: 0 },
    refundedAmount: { type: Number, default: 0 },
    paymentDate: Date,
    refundDate: Date,
    refundReason: String
  },
  
  // Booking Status & Workflow
  status: {
    type: String,
    enum: [
      'pending-payment',
      'payment-processing',
      'confirmed',
      'preparing',
      'ready-for-pickup',
      'in-progress',
      'completed',
      'cancelled',
      'no-show',
      'refunded'
    ],
    default: 'pending-payment'
  },
  
  // Service Management
  serviceDetails: {
    conciergeAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    chauffeurAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    preparationNotes: String,
    deliveryInstructions: String,
    specialRequests: [String],
    vipServices: {
      redCarpetService: { type: Boolean, default: false },
      personalConcierge: { type: Boolean, default: false },
      airportMeet: { type: Boolean, default: false },
      customDelivery: { type: Boolean, default: false }
    }
  },
  
  // Communication & Updates
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'whatsapp', 'in-person']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    subject: String,
    message: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    }
  }],
  
  // Reviews & Feedback
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    serviceRating: {
      vehicle: Number,
      delivery: Number,
      concierge: Number,
      overall: Number
    },
    reviewDate: Date,
    response: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: Date
    }
  },
  
  // Cancellation & Modifications
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundPolicy: String,
    refundAmount: Number,
    refundProcessed: { type: Boolean, default: false }
  },
  
  modifications: [{
    modifiedAt: { type: Date, default: Date.now },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    },
    reason: String
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['website', 'mobile-app', 'phone', 'email', 'concierge'],
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1, startDate: 1 });
bookingSchema.index({ 'item.itemType': 1, startDate: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Virtual for booking duration in days
bookingSchema.virtual('totalDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for booking status display
bookingSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending-payment': 'Pending Payment',
    'payment-processing': 'Processing Payment',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing Your Experience',
    'ready-for-pickup': 'Ready for Pickup',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'no-show': 'No Show',
    'refunded': 'Refunded'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for days until booking
bookingSchema.virtual('daysUntilBooking').get(function() {
  const now = new Date();
  const days = Math.ceil((this.startDate - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Pre-save middleware to calculate duration
bookingSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const diffTime = this.endDate - this.startDate;
    this.duration.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.duration.hours = Math.ceil((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  }
  
  this.updatedAt = new Date();
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60);
  
  // Different cancellation policies by item type
  const cancellationPolicies = {
    'cars': 24,      // 24 hours
    'yachts': 72,    // 72 hours
    'jets': 72,      // 72 hours
    'properties': 168 // 168 hours (7 days)
  };
  
  const requiredHours = cancellationPolicies[this.item.itemType] || 24;
  return hoursUntilStart >= requiredHours && 
         ['confirmed', 'preparing', 'ready-for-pickup'].includes(this.status);
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function() {
  const now = new Date();
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60);
  
  // Refund policies by item type and timing
  const refundPolicies = {
    'cars': {
      '72h+': 1.0,    // 100% refund
      '48h+': 0.75,   // 75% refund
      '24h+': 0.50,   // 50% refund
      '24h-': 0.25    // 25% refund
    },
    'yachts': {
      '168h+': 1.0,   // 100% refund
      '72h+': 0.80,   // 80% refund
      '48h+': 0.60,   // 60% refund
      '24h+': 0.40,   // 40% refund
      '24h-': 0.20    // 20% refund
    },
    'jets': {
      '168h+': 1.0,   // 100% refund
      '72h+': 0.75,   // 75% refund
      '48h+': 0.50,   // 50% refund
      '24h+': 0.30,   // 30% refund
      '24h-': 0.15    // 15% refund
    },
    'properties': {
      '336h+': 1.0,   // 100% refund (14+ days)
      '168h+': 0.85,  // 85% refund (7-14 days)
      '72h+': 0.70,   // 70% refund (3-7 days)
      '48h+': 0.50,   // 50% refund (2-3 days)
      '24h-': 0.25    // 25% refund (<48 hours)
    }
  };
  
  const policy = refundPolicies[this.item.itemType] || refundPolicies.cars;
  let refundPercentage = 0;
  
  if (hoursUntilStart >= 336) {
    refundPercentage = policy['336h+'] || policy['168h+'] || policy['72h+'] || 1.0;
  } else if (hoursUntilStart >= 168) {
    refundPercentage = policy['168h+'] || policy['72h+'] || 1.0;
  } else if (hoursUntilStart >= 72) {
    refundPercentage = policy['72h+'] || 0.75;
  } else if (hoursUntilStart >= 48) {
    refundPercentage = policy['48h+'] || 0.50;
  } else if (hoursUntilStart >= 24) {
    refundPercentage = policy['24h+'] || 0.25;
  } else {
    refundPercentage = policy['24h-'] || 0.25;
  }
  
  // Calculate refund amount (excluding non-refundable fees)
  const refundableAmount = this.pricing.total - this.pricing.securityDeposit;
  const processingFee = refundableAmount * 0.05; // 5% processing fee
  const refundAmount = (refundableAmount * refundPercentage) - processingFee;
  
  return Math.max(0, refundAmount);
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate, itemType = null) {
  const query = {
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  };
  
  if (itemType) {
    query['item.itemType'] = itemType;
  }
  
  return this.find(query);
};

// Static method to find active bookings
bookingSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['confirmed', 'preparing', 'ready-for-pickup', 'in-progress'] }
  });
};

module.exports = mongoose.model('Booking', bookingSchema);
