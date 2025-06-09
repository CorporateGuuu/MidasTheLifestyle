// Database Connection Manager for Midas The Lifestyle
// MongoDB connection with connection pooling and error handling

const mongoose = require('mongoose');

// Connection configuration
const CONNECTION_CONFIG = {
  // Connection options for production
  production: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections in the pool
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long to wait for a response
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    heartbeatFrequencyMS: 10000, // Heartbeat frequency
    retryWrites: true,
    retryReads: true
  },
  
  // Connection options for development
  development: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 5,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false
  }
};

// Connection state management
let isConnected = false;
let connectionPromise = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Log database events
const logDatabaseEvent = (eventType, data, severity = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'database-connection',
    eventType,
    severity,
    data
  };
  
  console.log(JSON.stringify(logEntry));
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production' && process.env.MONITORING_WEBHOOK_URL) {
    fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => console.error('Monitoring webhook failed:', err));
  }
};

// Connection retry with exponential backoff
const connectWithRetry = async (connectionString, options) => {
  try {
    connectionAttempts++;
    
    logDatabaseEvent('connection_attempt', {
      attempt: connectionAttempts,
      maxAttempts: MAX_RETRY_ATTEMPTS
    }, 'info');
    
    await mongoose.connect(connectionString, options);
    
    isConnected = true;
    connectionAttempts = 0;
    
    logDatabaseEvent('connection_success', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }, 'info');
    
    return mongoose.connection;
    
  } catch (error) {
    logDatabaseEvent('connection_failed', {
      attempt: connectionAttempts,
      error: error.message,
      code: error.code
    }, 'error');
    
    if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
      logDatabaseEvent('connection_max_retries_exceeded', {
        maxAttempts: MAX_RETRY_ATTEMPTS,
        finalError: error.message
      }, 'error');
      throw new Error(`Database connection failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`);
    }
    
    // Exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, connectionAttempts - 1);
    logDatabaseEvent('connection_retry_scheduled', {
      nextAttempt: connectionAttempts + 1,
      delayMs: delay
    }, 'warning');
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(connectionString, options);
  }
};

// Main connection function
const connectToDatabase = async () => {
  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    logDatabaseEvent('connection_reused', {
      readyState: mongoose.connection.readyState
    }, 'info');
    return mongoose.connection;
  }
  
  // Return existing connection promise if connection is in progress
  if (connectionPromise) {
    logDatabaseEvent('connection_awaiting_existing', {}, 'info');
    return connectionPromise;
  }
  
  // Validate environment variables
  const connectionString = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!connectionString) {
    const error = 'DATABASE_URL or MONGODB_URI environment variable is required';
    logDatabaseEvent('connection_config_error', { error }, 'error');
    throw new Error(error);
  }
  
  // Get connection options based on environment
  const environment = process.env.NODE_ENV || 'development';
  const options = CONNECTION_CONFIG[environment] || CONNECTION_CONFIG.development;
  
  logDatabaseEvent('connection_initiated', {
    environment,
    options: {
      ...options,
      // Don't log sensitive connection string
      connectionString: connectionString.replace(/\/\/.*@/, '//***:***@')
    }
  }, 'info');
  
  // Create connection promise
  connectionPromise = connectWithRetry(connectionString, options);
  
  try {
    const connection = await connectionPromise;
    connectionPromise = null;
    return connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};

// Connection event handlers
const setupConnectionEventHandlers = () => {
  // Connection opened
  mongoose.connection.on('connected', () => {
    isConnected = true;
    logDatabaseEvent('connection_opened', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }, 'info');
  });
  
  // Connection error
  mongoose.connection.on('error', (error) => {
    isConnected = false;
    logDatabaseEvent('connection_error', {
      error: error.message,
      code: error.code
    }, 'error');
  });
  
  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logDatabaseEvent('connection_disconnected', {}, 'warning');
  });
  
  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logDatabaseEvent('connection_reconnected', {}, 'info');
  });
  
  // Connection close
  mongoose.connection.on('close', () => {
    isConnected = false;
    logDatabaseEvent('connection_closed', {}, 'info');
  });
  
  // Process termination handlers
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logDatabaseEvent('connection_graceful_shutdown', { signal: 'SIGINT' }, 'info');
      process.exit(0);
    } catch (error) {
      logDatabaseEvent('connection_shutdown_error', { error: error.message }, 'error');
      process.exit(1);
    }
  });
  
  process.on('SIGTERM', async () => {
    try {
      await mongoose.connection.close();
      logDatabaseEvent('connection_graceful_shutdown', { signal: 'SIGTERM' }, 'info');
      process.exit(0);
    } catch (error) {
      logDatabaseEvent('connection_shutdown_error', { error: error.message }, 'error');
      process.exit(1);
    }
  });
};

// Health check function
const checkDatabaseHealth = async () => {
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      };
    }
    
    // Perform a simple ping operation
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length
    };
    
  } catch (error) {
    logDatabaseEvent('health_check_failed', { error: error.message }, 'error');
    return {
      status: 'unhealthy',
      message: error.message,
      readyState: mongoose.connection.readyState
    };
  }
};

// Connection statistics
const getConnectionStats = () => {
  const stats = {
    isConnected,
    readyState: mongoose.connection.readyState,
    connectionAttempts,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    collections: Object.keys(mongoose.connection.collections || {}).length
  };
  
  if (mongoose.connection.host) {
    stats.host = mongoose.connection.host;
    stats.port = mongoose.connection.port;
    stats.name = mongoose.connection.name;
  }
  
  return stats;
};

// Middleware function for Netlify Functions
const withDatabase = (handler) => {
  return async (event, context) => {
    try {
      // Ensure database connection
      await connectToDatabase();
      
      // Call the original handler
      const result = await handler(event, context);
      
      return result;
      
    } catch (error) {
      logDatabaseEvent('middleware_error', {
        error: error.message,
        function: context.functionName || 'unknown'
      }, 'error');
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Database connection failed',
          message: 'We are experiencing technical difficulties. Please try again in a few moments.'
        })
      };
    }
  };
};

// Initialize connection event handlers
setupConnectionEventHandlers();

// Export functions
module.exports = {
  connectToDatabase,
  checkDatabaseHealth,
  getConnectionStats,
  withDatabase,
  
  // Utility functions
  isConnected: () => isConnected,
  getConnection: () => mongoose.connection,
  
  // For testing purposes
  disconnect: async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isConnected = false;
      connectionPromise = null;
      connectionAttempts = 0;
    }
  }
};
