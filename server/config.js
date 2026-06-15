require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || (isProduction ? process.env.RAZORPAY_LIVE_KEY_ID : process.env.RAZORPAY_TEST_KEY_ID);
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || (isProduction ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET);

const config = {
  port: process.env.PORT || 4000,
  PORT: process.env.PORT || 4000,
  supportEmail: process.env.SUPPORT_EMAIL,
  JWT_SECRET: process.env.JWT_SECRET || 'travnify_secret_jwt_key_2026_super_secure',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: razorpayKeySecret,
  razorpay: {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
  }
};

// Export direct attributes for backward compatibility and config object for strict specifications
module.exports = config;
module.exports.config = config;
