// Production Database Configuration for Midas The Lifestyle
// Optimized MongoDB configuration for high-performance luxury platform

const mongoose = require('mongoose');

/**
 * Production MongoDB Configuration
 * Optimized for performance, security, and reliability
 */

// Connection configuration
const productionConfig = {
  // Connection URI with optimizations
  uri: process.env.MONGODB_URI || 'mongodb+srv://production-user:password@midas-production.mongodb.net/midas_production?retryWrites=true&w=majority',
  
  // Connection options for production
  options: {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections
    minPoolSize: 2,  // Minimum number of connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    
    // Timeout settings
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take
    connectTimeoutMS: 10000, // How long to wait for a connection to be established
    
    // Buffering settings
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    
    // Write concern for data consistency
    w: 'majority', // Wait for majority of replica set members
    wtimeoutMS: 5000, // Timeout for write operations
    j: true, // Wait for journal acknowledgment
    
    // Read preference
    readPreference: 'primary', // Read from primary for consistency
    readConcern: { level: 'majority' }, // Read concern level
    
    // Compression
    compressors: ['zstd', 'zlib'], // Enable compression
    
    // SSL/TLS settings
    ssl: true,
    sslValidate: true,
    
    // Authentication
    authSource: 'admin',
    
    // Monitoring and logging
    monitorCommands: true,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Application name for monitoring
    appName: 'MidasTheLifestyle-Production',
  },
  
  // Mongoose-specific options
  mongooseOptions: {
    // Strict mode for schema validation
    strict: true,
    strictQuery: true,
    
    // Automatic index creation
    autoIndex: false, // Disable in production for performance
    autoCreate: false, // Disable automatic collection creation
    
    // Validation
    runValidators: true,
    
    // Timestamps
    timestamps: true,
    
    // Version key
    versionKey: '__v',
    
    // Transform options
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
  },
};

// Staging configuration (similar but with different settings)
const stagingConfig = {
  uri: process.env.MONGODB_URI_STAGING || 'mongodb+srv://staging-user:password@midas-staging.mongodb.net/midas_staging?retryWrites=true&w=majority',
  
  options: {
    ...productionConfig.options,
    maxPoolSize: 5, // Smaller pool for staging
    minPoolSize: 1,
    appName: 'MidasTheLifestyle-Staging',
  },
  
  mongooseOptions: {
    ...productionConfig.mongooseOptions,
    autoIndex: true, // Enable in staging for development
    autoCreate: true,
  },
};

// Development configuration
const developmentConfig = {
  uri: process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/midas_development',
  
  options: {
    maxPoolSize: 3,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    bufferMaxEntries: 0,
    bufferCommands: false,
    appName: 'MidasTheLifestyle-Development',
  },
  
  mongooseOptions: {
    ...productionConfig.mongooseOptions,
    autoIndex: true,
    autoCreate: true,
    strict: false, // More lenient in development
  },
};

// Connection management
class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  // Get configuration based on environment
  getConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return productionConfig;
      case 'staging':
        return stagingConfig;
      default:
        return developmentConfig;
    }
  }

  // Connect to database with retry logic
  async connect() {
    if (this.isConnected) {
      return this.connection;
    }

    const config = this.getConfig();
    
    try {
      // Set mongoose options
      mongoose.set('strictQuery', config.mongooseOptions.strictQuery);
      
      // Connect to MongoDB
      this.connection = await mongoose.connect(config.uri, config.options);
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV || 'development'})`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return this.connection;
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ MongoDB connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.connect();
      } else {
        throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
      }
    }
  }

  // Set up connection event listeners
  setupEventListeners() {
    const db = mongoose.connection;

    db.on('connected', () => {
      console.log('📡 MongoDB connected');
      this.isConnected = true;
    });

    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      console.log('📡 MongoDB disconnected');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      console.log('📡 MongoDB reconnected');
      this.isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  // Disconnect from database
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📡 MongoDB disconnected gracefully');
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
      };
    }
  }

  // Get connection statistics
  getStats() {
    const db = mongoose.connection;
    
    return {
      readyState: db.readyState,
      host: db.host,
      port: db.port,
      name: db.name,
      collections: Object.keys(db.collections),
      models: Object.keys(mongoose.models),
    };
  }
}

// Index optimization for production
const optimizeIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      
      // Get existing indexes
      const indexes = await coll.indexes();
      console.log(`📊 Indexes for ${collectionName}:`, indexes.length);
      
      // Analyze index usage (if available)
      try {
        const stats = await coll.aggregate([
          { $indexStats: {} }
        ]).toArray();
        
        console.log(`📈 Index usage stats for ${collectionName}:`, stats.length);
      } catch (error) {
        // Index stats not available in all MongoDB versions
      }
    }
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error.message);
  }
};

// Performance monitoring
const setupPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    // Monitor slow queries
    mongoose.set('debug', false); // Disable debug in production
    
    // Set up performance monitoring
    mongoose.connection.on('connected', () => {
      // Enable profiling for slow operations
      mongoose.connection.db.admin().command({
        profile: 2,
        slowms: 100, // Log operations slower than 100ms
        sampleRate: 0.1 // Sample 10% of operations
      });
    });
  }
};

// Export singleton instance
const dbManager = new DatabaseManager();

module.exports = {
  DatabaseManager,
  dbManager,
  productionConfig,
  stagingConfig,
  developmentConfig,
  optimizeIndexes,
  setupPerformanceMonitoring,
};
