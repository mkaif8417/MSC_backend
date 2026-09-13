const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

/**
 * Connect to MongoDB instance
 */
async function connectDB() {
  // If already connected or connecting, return active connection instance
  if (mongoose.connection.readyState !== 0) {
    isConnected = mongoose.connection.readyState === 1;
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true
    });

    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost');
      isConnected = false;
    });

    return conn.connection;
  } catch (error) {
    console.error('[MongoDB] Failed connection error:', error.message);
    isConnected = false;
    throw error;
  }
}

/**
 * Close MongoDB connection gracefully
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[MongoDB] Connection closed gracefully');
  }
}

/**
 * Get current DB health status
 */
function getDBHealth() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[readyState] || 'unknown',
    isConnected: readyState === 1
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBHealth
};
