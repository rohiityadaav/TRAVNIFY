const Sentry = require('@sentry/node');

// Initialize Sentry before importing express to ensure auto-instrumentation works
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0
  });
} else {
  console.warn('WARNING: SENTRY_DSN environment variable is missing. Sentry error monitoring is disabled.');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Initialize database data structures
const db = require('./db');

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
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // dev
  'http://localhost:5000', // dev alt (if needed)
  'https://travnify.vercel.app' // production frontend (replace if your domain is different)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf ? buf.toString() : '';
  }
}));

// Resource-level middleware: allow if user owns the trip OR is admin
function tripOwnerOrAdmin(req, res, next) {
  const tripId = req.params.id || req.params.tripId;
  if (!tripId) return next(); // no id param, let controller handle
  const trip = db.trips.findById(tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found.' });
  const isOwner = trip.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (isOwner || isAdmin) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Authentication
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/firebase-sync', authController.firebaseSync);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authController.logout);
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
app.delete('/api/trips/:id', authController.authenticateToken, tripOwnerOrAdmin, tripController.deleteTrip);
app.post('/api/trips/pdf', authController.authenticateToken, tripController.downloadTripPDF);
app.post('/api/trips/:id/pdf', authController.authenticateToken, tripOwnerOrAdmin, tripController.downloadTripPDF);
app.get('/api/trip/:tripId/pdf', authController.authenticateToken, tripOwnerOrAdmin, tripController.downloadTripPDF);
app.get('/api/trips/:tripId/pdf', authController.authenticateToken, tripOwnerOrAdmin, tripController.downloadTripPDF);

// Admin Routes — require login + admin role
app.get('/api/admin/stats',      authController.authenticateToken, authController.requireRole('admin'), authController.getAdminStats);
app.get('/api/admin/users',      authController.authenticateToken, authController.requireRole('admin'), authController.getAllUsers);
app.patch('/api/admin/users/:id/role', authController.authenticateToken, authController.requireRole('admin'), authController.updateUserRole);

// Discovery & Real Nearby Locations
app.get('/api/nearbyPlaces', placesController.getNearbyPlaces);
// Premium discovery endpoints
app.post('/api/discover/hidden-gems', authController.authenticateToken, validation.validateDiscoverQuery, aiRateLimiter, discoverController.getHiddenGems);
app.post('/api/discover/best-for-activity', authController.authenticateToken, validation.validateDiscoverQuery, aiRateLimiter, discoverController.getBestForActivity);

// Payments & Premium Subscriptions
app.post('/api/subscribe/order', authController.authenticateToken, paymentController.createOrder);
app.post('/api/subscribe/verify', authController.authenticateToken, paymentController.verifyPayment);
app.post('/api/payments/create-order', authController.authenticateToken, paymentController.createOrder);

// Subscription & Autopay Billing
app.post('/api/billing/create-subscription', authController.authenticateToken, paymentController.createSubscription);
app.post('/api/billing/verify-subscription', authController.authenticateToken, paymentController.verifySubscription);
app.post('/api/billing/cancel-subscription', authController.authenticateToken, paymentController.cancelSubscription);
app.post('/api/billing/razorpay-webhook', paymentController.razorpayWebhook);
// Diagnostic Endpoint for Sentry error capturing (only public in development, requires admin in production)
app.get('/api/debug-sentry-error', (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  authController.authenticateToken(req, res, () => {
    authController.requireRole('admin')(req, res, next);
  });
}, (req, res) => {
  throw new Error('Sentry Test Error from Travnify Express Backend!');
});

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

// Diagnostic Endpoint for Supabase connectivity (public — remove after debugging)
app.get('/api/debug-supabase', async (req, res) => {
  const { supabase, isConfigured } = require('./supabaseClient');
  const url = process.env.SUPABASE_URL;
  const keySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyLen = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0;

  const report = {
    env: {
      SUPABASE_URL_set: !!url,
      SUPABASE_URL_host: url ? (() => { try { return new URL(url).hostname; } catch(_) { return 'MALFORMED_URL'; } })() : null,
      SUPABASE_SERVICE_ROLE_KEY_set: keySet,
      SUPABASE_SERVICE_ROLE_KEY_length: keyLen,
      SUPABASE_SERVICE_ROLE_KEY_prefix: keySet ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : null,
      isConfigured
    },
    probe: null
  };

  if (!isConfigured) {
    report.probe = { status: 'skipped', reason: 'env vars not set' };
    return res.json(report);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      report.probe = {
        status: 'FAILED',
        supabase_error_message: error.message,
        supabase_error_code: error.code,
        supabase_error_hint: error.hint,
        supabase_error_details: error.details
      };
    } else {
      report.probe = {
        status: 'PASSED',
        rows_returned: (data || []).length
      };
    }
  } catch (err) {
    report.probe = {
      status: 'EXCEPTION',
      message: err.message
    };
  }

  return res.json(report);
});

// Sentry Error Handler MUST be before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

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
