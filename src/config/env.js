const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate immediately on module load
validateEnv();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'masjid_center_token',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Super Admin',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@masjidcenter.org',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'AdminPass@123456'
};
