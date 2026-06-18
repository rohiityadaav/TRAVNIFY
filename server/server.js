const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Initialize database data structures
require('./db');

const authController = require('./controllers/authController');
const tripController = require('./controllers/tripController');
const placesController = require('./controllers/placesController');
const discoverController = require('./controllers/discoverController');
const paymentController = require('./controllers/paymentController');
const rateLimit = require('express-rate-limit');
const validation = require('./controllers/validation');

// Configure AI rate limiter: 30 requests per 15 minutes per user/IP
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user ID / IP to 30 requests per window
  keyGenerator: (req) => {
    return req.userId || req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  },
  validate: { 
    trustProxy: false,
    keyGeneratorIpFallback: false // Disable keyGenerator IP code-analysis warnings
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many AI requests. Please wait a few minutes and try again."
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Midlewares
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Authentication
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/firebase-sync', authController.firebaseSync);
app.get('/api/auth/me', authController.authenticateToken, authController.getMe);
app.patch('/api/auth/profile', authController.authenticateToken, authController.updateProfile);
app.get('/api/auth/verify-email', authController.verifyEmail);
app.post('/api/auth/resend-verification', authController.resendVerification);

// Trip Planning & Refinements
app.post('/api/generateTrip', authController.authenticateToken, validation.validateGenerateTrip, aiRateLimiter, tripController.generateTrip);
app.post('/api/refineTrip', authController.authenticateToken, validation.validateRefineTrip, aiRateLimiter, tripController.refineTrip);

// Saved Trips Management
app.get('/api/trips', authController.authenticateToken, tripController.getSavedTrips);
app.post('/api/trips', authController.authenticateToken, tripController.saveTrip);
app.delete('/api/trips/:id', authController.authenticateToken, tripController.deleteTrip);
app.post('/api/trips/pdf', authController.authenticateToken, tripController.downloadTripPDF);
app.post('/api/trips/:id/pdf', authController.authenticateToken, tripController.downloadTripPDF);

// Discovery & Real Nearby Locations
app.get('/api/nearbyPlaces', placesController.getNearbyPlaces);
// Premium discovery endpoints
app.post('/api/discover/hidden-gems', authController.authenticateToken, validation.validateDiscoverQuery, aiRateLimiter, discoverController.getHiddenGems);
app.post('/api/discover/best-for-activity', authController.authenticateToken, validation.validateDiscoverQuery, aiRateLimiter, discoverController.getBestForActivity);

// Payments & Premium Subscriptions
app.post('/api/subscribe/order', authController.authenticateToken, paymentController.createOrder);
app.post('/api/subscribe/verify', authController.authenticateToken, paymentController.verifyPayment);
app.post('/api/payments/create-order', authController.authenticateToken, paymentController.createOrder);
app.post('/api/payments/verify', authController.authenticateToken, paymentController.verifyPayment);

// Diagnostic Endpoint for Gemini connectivity
app.get('/api/debug-gemini', async (req, res) => {
  const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ status: 'error', message: 'GEMINI_API_KEY is missing or empty in config and process.env' });
  }
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const tempAI = new GoogleGenerativeAI(apiKey);
    const model = tempAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say word: PONG');
    return res.json({
      status: 'success',
      message: 'Gemini connectivity verified successfully',
      apiKeyPreview: apiKey.substring(0, 8) + '...',
      response: result.response.text().trim()
    });
  } catch (err) {
    return res.json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
});

// ----------------------------------------------------
// PRODUCTION STATIC FILE SERVING
// ----------------------------------------------------
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback to React app router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In development if dist folder is missing, provide simple API indicator
      res.status(200).json({
        name: 'TRAVNIFY Full-Stack API Engine',
        status: 'Operational',
        message: 'React client build is missing. Run development concurrently with "npm run dev"'
      });
    }
  });
});

// Start Server
app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(`   🚀 TRAVNIFY Full-Stack Server Running on Port ${config.PORT}`);
  console.log(`   💡 Sandbox Simulation Payment: ENABLED`);
  console.log(`====================================================`);
});
