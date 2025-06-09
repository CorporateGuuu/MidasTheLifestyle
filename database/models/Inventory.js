// Inventory Model for Midas The Lifestyle
// Comprehensive inventory management for luxury rental items

const mongoose = require('mongoose');

// Inventory schema for luxury rental items
const inventorySchema = new mongoose.Schema({
  // Item Identification
  itemId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['cars', 'yachts', 'jets', 'properties'],
    required: true
  },
  
  // Basic Information
  category: {
    type: String,
    required: true
  }, // e.g., 'supercar', 'luxury-sedan', 'superyacht', 'private-jet'
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1990,
    max: new Date().getFullYear() + 2
  },
  
  // Detailed Specifications
  specifications: {
    // Vehicle Specifications
    engine: String,
    horsepower: Number,
    torque: Number,
    acceleration: String, // 0-60 mph time
    topSpeed: Number,
    transmission: String,
    drivetrain: String,
    fuelType: String,
    
    // Capacity & Dimensions
    passengers: Number,
    doors: Number,
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    
    // Yacht/Jet Specific
    crew: Number,
    range: Number, // nautical miles or flight range
    cruisingSpeed: Number,
    maxSpeed: Number,
    
    // Property Specific
    bedrooms: Number,
    bathrooms: Number,
    squareFootage: Number,
    lotSize: Number,
    
    // Features & Amenities
    features: [String],
    luxuryFeatures: [String],
    safetyFeatures: [String],
    entertainmentFeatures: [String]
  },
  
  // Visual Assets
  media: {
    primaryImage: {
      type: String,
      required: true
    },
    images: [{
      url: String,
      caption: String,
      category: {
        type: String,
        enum: ['exterior', 'interior', 'engine', 'features', 'lifestyle']
      }
    }],
    videos: [{
      url: String,
      title: String,
      duration: Number,
      thumbnail: String
    }],
    virtualTour: String,
    brochure: String
  },
  
  // Pricing & Availability
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'AED', 'EUR', 'GBP'],
      default: 'USD'
    },
    pricingTiers: {
      standard: { type: Number, default: 1.0 },
      premium: { type: Number, default: 1.3 },
      vvip: { type: Number, default: 1.8 }
    },
    seasonalPricing: {
      peak: { type: Number, default: 1.5 },
      high: { type: Number, default: 1.25 },
      standard: { type: Number, default: 1.0 },
      low: { type: Number, default: 0.85 }
    },
    minimumRental: {
      days: { type: Number, default: 1 },
      hours: { type: Number, default: 0 }
    },
    securityDeposit: {
      type: Number,
      required: true
    },
    insurance: {
      rate: { type: Number, default: 0.15 }, // Percentage of rental cost
      required: { type: Boolean, default: true }
    }
  },
  
  // Location & Availability
  location: {
    primaryLocation: {
      type: String,
      enum: ['dubai', 'washington-dc', 'houston', 'atlanta', 'maryland', 'northern-virginia'],
      required: true
    },
    availableLocations: [{
      type: String,
      enum: ['dubai', 'washington-dc', 'houston', 'atlanta', 'maryland', 'northern-virginia']
    }],
    currentLocation: {
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    deliveryRadius: {
      type: Number,
      default: 50 // miles
    }
  },
  
  // Status & Condition
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'reserved', 'retired', 'damaged'],
    default: 'available'
  },
  condition: {
    overall: {
      type: String,
      enum: ['excellent', 'very-good', 'good', 'fair'],
      default: 'excellent'
    },
    lastInspection: Date,
    nextInspection: Date,
    maintenanceNotes: String,
    issues: [{
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'critical']
      },
      reportedDate: { type: Date, default: Date.now },
      resolvedDate: Date,
      cost: Number
    }]
  },
  
  // Booking Management
  availability: {
    isActive: {
      type: Boolean,
      default: true
    },
    blackoutDates: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }],
    advanceBookingDays: {
      type: Number,
      default: 365 // How far in advance bookings can be made
    },
    minimumNotice: {
      type: Number,
      default: 24 // Hours of minimum notice required
    }
  },
  
  // Service Requirements
  serviceRequirements: {
    chauffeurRequired: {
      type: Boolean,
      default: false
    },
    pilotRequired: {
      type: Boolean,
      default: false
    },
    captainRequired: {
      type: Boolean,
      default: false
    },
    conciergeIncluded: {
      type: Boolean,
      default: false
    },
    specialLicenseRequired: String,
    ageRestriction: {
      minimum: { type: Number, default: 21 },
      maximum: Number
    },
    experienceRequired: String
  },
  
  // Business Metrics
  metrics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    utilizationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastBookedDate: Date,
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  
  // SEO & Marketing
  seo: {
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    featured: {
      type: Boolean,
      default: false
    },
    featuredOrder: Number
  },
  
  // Compliance & Documentation
  documentation: {
    registration: String,
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      coverage: Number
    },
    certifications: [{
      type: String,
      number: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date
    }],
    permits: [{
      type: String,
      number: String,
      jurisdiction: String,
      expiryDate: Date
    }]
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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
inventorySchema.index({ itemId: 1 });
inventorySchema.index({ itemType: 1, status: 1 });
inventorySchema.index({ 'location.primaryLocation': 1, status: 1 });
inventorySchema.index({ 'pricing.basePrice': 1 });
inventorySchema.index({ 'seo.featured': 1, 'seo.featuredOrder': 1 });
inventorySchema.index({ 'metrics.popularityScore': -1 });
inventorySchema.index({ brand: 1, model: 1 });

// Virtual for full item name
inventorySchema.virtual('fullName').get(function() {
  return `${this.year} ${this.brand} ${this.model}`;
});

// Virtual for availability status
inventorySchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.availability.isActive;
});

// Virtual for current price (with tier multiplier)
inventorySchema.virtual('currentPrice').get(function() {
  // Default to premium tier pricing
  return this.pricing.basePrice * this.pricing.pricingTiers.premium;
});

// Pre-save middleware to generate slug
inventorySchema.pre('save', function(next) {
  if (this.isModified('itemName') || this.isModified('brand') || this.isModified('model')) {
    this.seo.slug = `${this.brand}-${this.model}-${this.year}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  this.updatedAt = new Date();
  next();
});

// Method to check availability for date range
inventorySchema.methods.isAvailableForDates = function(startDate, endDate) {
  if (!this.isAvailable) return false;
  
  // Check blackout dates
  const hasBlackout = this.availability.blackoutDates.some(blackout => {
    return (startDate <= blackout.endDate && endDate >= blackout.startDate);
  });
  
  if (hasBlackout) return false;
  
  // Check minimum notice
  const now = new Date();
  const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
  
  return hoursUntilStart >= this.availability.minimumNotice;
};

// Method to calculate price for date range and tier
inventorySchema.methods.calculatePrice = function(startDate, endDate, serviceTier = 'premium') {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Get seasonal multiplier
  const month = startDate.getMonth() + 1;
  let seasonalMultiplier = this.pricing.seasonalPricing.standard;
  
  if ((month === 12 && startDate.getDate() >= 15) || (month === 1 && startDate.getDate() <= 15)) {
    seasonalMultiplier = this.pricing.seasonalPricing.peak;
  } else if (month >= 6 && month <= 8) {
    seasonalMultiplier = this.pricing.seasonalPricing.high;
  } else if (month >= 1 && month <= 3) {
    seasonalMultiplier = this.pricing.seasonalPricing.low;
  }
  
  // Calculate price
  const tierMultiplier = this.pricing.pricingTiers[serviceTier] || 1.0;
  const basePrice = this.pricing.basePrice * tierMultiplier * seasonalMultiplier;
  const subtotal = basePrice * days;
  
  return {
    basePrice,
    days,
    subtotal,
    tierMultiplier,
    seasonalMultiplier,
    securityDeposit: this.pricing.securityDeposit,
    insurance: subtotal * this.pricing.insurance.rate
  };
};

// Method to update metrics
inventorySchema.methods.updateMetrics = function(bookingAmount, rating = null) {
  this.metrics.totalBookings += 1;
  this.metrics.totalRevenue += bookingAmount;
  this.metrics.lastBookedDate = new Date();
  
  if (rating) {
    const totalRatings = this.metrics.totalBookings;
    const currentAverage = this.metrics.averageRating || 0;
    this.metrics.averageRating = ((currentAverage * (totalRatings - 1)) + rating) / totalRatings;
  }
  
  // Update popularity score based on recent bookings and rating
  this.metrics.popularityScore = (this.metrics.totalBookings * 0.3) + 
                                 (this.metrics.averageRating * 20) + 
                                 (this.metrics.utilizationRate * 0.5);
};

// Static method to find available items
inventorySchema.statics.findAvailable = function(itemType = null, location = null) {
  const query = { 
    status: 'available',
    'availability.isActive': true
  };
  
  if (itemType) query.itemType = itemType;
  if (location) query['location.availableLocations'] = location;
  
  return this.find(query);
};

// Static method to find featured items
inventorySchema.statics.findFeatured = function(itemType = null) {
  const query = { 'seo.featured': true };
  if (itemType) query.itemType = itemType;
  
  return this.find(query).sort({ 'seo.featuredOrder': 1, 'metrics.popularityScore': -1 });
};

// Static method to search items
inventorySchema.statics.search = function(searchTerm, filters = {}) {
  const query = {
    $or: [
      { itemName: { $regex: searchTerm, $options: 'i' } },
      { brand: { $regex: searchTerm, $options: 'i' } },
      { model: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { 'specifications.features': { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  // Apply filters
  if (filters.itemType) query.itemType = filters.itemType;
  if (filters.location) query['location.availableLocations'] = filters.location;
  if (filters.minPrice) query['pricing.basePrice'] = { $gte: filters.minPrice };
  if (filters.maxPrice) {
    query['pricing.basePrice'] = query['pricing.basePrice'] || {};
    query['pricing.basePrice'].$lte = filters.maxPrice;
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Inventory', inventorySchema);
