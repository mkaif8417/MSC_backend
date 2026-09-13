const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Setup test database connection
 */
async function setupTestDB() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.AUTH_COOKIE_NAME = 'masjid_center_token';

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  } catch (err) {
    // Fallback to local test database if MemoryServer fails/downloads slow
    const fallbackUri = 'mongodb://127.0.0.1:27017/masjid_study_center_test';
    process.env.MONGODB_URI = fallbackUri;
    await mongoose.connect(fallbackUri);
  }
}

/**
 * Clear all collections between test cases
 */
async function clearTestDB() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

/**
 * Teardown test database connection
 */
async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  setupTestDB,
  clearTestDB,
  teardownTestDB
};
