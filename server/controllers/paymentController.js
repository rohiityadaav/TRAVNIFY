const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const config = require('../config');

// Initialize Razorpay SDK if keys are provided
let razorpayInstance = null;
if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay SDK Initialized Successfully.');
  } catch (err) {
    console.error('Failed to initialize Razorpay SDK:', err.message);
  }
} else {
  console.log('Razorpay credentials missing. Sandbox simulated mode is active.');
}

// Helper to generate unique ID
function generateId(prefix = 'tx') {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// Razorpay-supported currencies for international charging
const RAZORPAY_SUPPORTED_CURRENCIES = new Set([
  'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED',
  'SAR', 'QAR', 'BHD', 'KWD', 'OMR', 'MYR', 'HKD', 'JPY',
  'CHF', 'NZD', 'THB', 'SEK', 'NOK', 'DKK', 'ZAR', 'MXN',
  'BRL', 'NGN', 'EGP', 'KES', 'TRY', 'ILS', 'IDR', 'PHP',
  'TWD', 'KRW', 'PKR', 'BDT', 'LKR', 'NPR', 'MAD', 'RUB',
  'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'IQD', 'JOD',
]);

// Plan prices per currency (major unit — e.g. dollars, not cents)
const PLAN_PRICES = {
  premiumMonthly: {
    INR: 199,    USD: 2.39,   EUR: 2.19,   GBP: 1.89,   AUD: 3.69,
    CAD: 3.29,   SGD: 3.25,   AED: 8.79,   SAR: 8.99,   QAR: 8.70,
    BHD: 0.90,   KWD: 0.74,   OMR: 0.92,   MYR: 11.19,  HKD: 18.69,
    JPY: 370,    CHF: 2.12,   NZD: 3.97,   THB: 85.7,   SEK: 25.2,
    NOK: 25.8,   DKK: 16.4,   ZAR: 44.0,   MXN: 41.9,   BRL: 12.6,
    NGN: 3900,   EGP: 118,    KES: 312,    TRY: 82.0,   ILS: 8.78,
    IDR: 38600,  PHP: 138,    TWD: 77.8,   KRW: 3300,   PKR: 676,
    BDT: 264,    LKR: 770,    NPR: 320,    MAD: 23.9,   RUB: 219,
    UAH: 99.0,   PLN: 9.59,   CZK: 56.0,   HUF: 875,    RON: 10.98,
    BGN: 4.27,   IQD: 3124,   JOD: 1.70,
  },
  premiumYearly: {
    INR: 999,    USD: 11.99,  EUR: 10.99,  GBP: 9.49,   AUD: 18.49,
    CAD: 16.49,  SGD: 16.25,  AED: 44.0,   SAR: 45.0,   QAR: 43.5,
    BHD: 4.50,   KWD: 3.70,   OMR: 4.60,   MYR: 55.99,  HKD: 93.5,
    JPY: 1850,   CHF: 10.60,  NZD: 19.85,  THB: 428,    SEK: 126,
    NOK: 129,    DKK: 82.0,   ZAR: 220,    MXN: 210,    BRL: 63.0,
    NGN: 19500,  EGP: 590,    KES: 1560,   TRY: 410,    ILS: 43.9,
    IDR: 193000, PHP: 690,    TWD: 389,    KRW: 16500,  PKR: 3380,
    BDT: 1320,   LKR: 3850,   NPR: 1600,   MAD: 119.5,  RUB: 1095,
    UAH: 495,    PLN: 47.95,  CZK: 280,    HUF: 4375,   RON: 54.9,
    BGN: 21.35,  IQD: 15620,  JOD: 8.50,
  },
};

// Currencies where amount must be integer (no decimals allowed)
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'TWD', 'NGN', 'KES', 'CLP', 'IQD', 'RWF', 'BIF', 'GNF', 'XOF', 'XAF', 'CDF', 'TZS', 'UGX']);

// ----------------------------------------------------
// CREATE SUBSCRIPTION ORDER
// ----------------------------------------------------
async function createOrder(req, res) {
  try {
    let planId = req.body.planId || 'premiumMonthly';
    // Normalize legacy names to the new ones
    if (planId === 'premium_monthly') planId = 'premiumMonthly';
    if (planId === 'premium_yearly') planId = 'premiumYearly';

    const user = db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Determine which currency to charge in:
    // Use user's preferredCurrency if Razorpay supports it, else fall back to INR
    const requestedCurrency = (req.body.currency || user.preferredCurrency || 'INR').toUpperCase();
    const currency = RAZORPAY_SUPPORTED_CURRENCIES.has(requestedCurrency) ? requestedCurrency : 'INR';

    const planPrices = PLAN_PRICES[planId];
    if (!planPrices) {
      return res.status(400).json({ error: `Invalid planId: ${planId}` });
    }

    // Get price in selected currency; fall back to INR if not mapped
    const baseAmount = planPrices[currency] ?? planPrices['INR'];

    // Convert to smallest currency unit
    // Zero-decimal currencies: amount itself (e.g. 370 for JPY ¥370)
    // All others: amount * 100 (e.g. 239 for USD $2.39)
    let amountInMinorUnits;
    if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
      amountInMinorUnits = Math.round(baseAmount);
    } else {
      amountInMinorUnits = Math.round(baseAmount * 100);
    }

    let orderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
    let isSandbox = true;

    // Use Razorpay SDK if active
    if (razorpayInstance) {
      try {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInMinorUnits,
          currency: currency,
          receipt: `rcpt_${Date.now()}`
        });
        orderId = razorpayOrder.id;
        isSandbox = false;
      } catch (err) {
        console.error('Razorpay SDK order creation failed, falling back to Sandbox simulation:', err.message);
      }
    }

    // Save transaction in database as 'created'
    const transaction = {
      id: generateId('tx'),
      userId: user.id,
      orderId: orderId,
      paymentId: '',
      amount: baseAmount,
      currency: currency,
      status: 'created',
      createdAt: new Date().toISOString()
    };
    db.transactions.create(transaction);

    // Return detailed order data for Checkout
    return res.json({
      success: true,
      sandbox: isSandbox,
      orderId: orderId,
      amount: amountInMinorUnits,
      currency: currency,
      keyId: config.RAZORPAY_KEY_ID || 'rzp_test_mock_id_travnify',
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    return res.status(500).json({ error: 'An error occurred creating subscription order.' });
  }
}

// ----------------------------------------------------
// VERIFY SUBSCRIPTION PAYMENT (SANDBOX & PRODUCTION)
// ----------------------------------------------------
async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const billingPeriod = req.body.billingPeriod || (planId === 'premium_yearly' || planId === 'premiumYearly' ? 'yearly' : 'monthly');

    if (!razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const user = db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Lookup transaction record
    const txList = db.transactions.findAll();
    const tx = txList.find(t => t.orderId === razorpay_order_id);

    if (!tx) {
      return res.status(404).json({ error: 'Associated transaction record not found.' });
    }

    // 1. SANDBOX MODE SIMULATION CHECK
    if (razorpay_order_id.startsWith('order_mock_') || !razorpay_signature) {
      console.log(`Verifying payment in Sandbox Mode for user: ${user.email}`);

      // Calculate start and end date for license duration
      const startDate = new Date();
      const endDate = new Date();
      if (billingPeriod === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update Transaction in db
      db.transactions.update(tx.id, {
        paymentId: razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 12)}`,
        status: 'paid'
      });

      // Unlock Premium features for local profile
      const updatedUser = db.users.update(user.id, {
        isPremium: true,
        subscriptionType: billingPeriod || 'monthly',
        subscriptionStart: startDate.toISOString(),
        subscriptionEnd: endDate.toISOString()
      });

      const userWithoutHash = {
        ...updatedUser,
        premiumPlanType: updatedUser.subscriptionType === 'yearly' ? 'yearly' : (updatedUser.subscriptionType === 'monthly' ? 'monthly' : null),
        premiumExpiresAt: updatedUser.subscriptionEnd || null,
        freeCreditsResetInMinutes: 0
      };
      delete userWithoutHash.passwordHash;

      return res.json({
        success: true,
        message: 'Subscription successfully activated via Sandbox Simulator!',
        user: userWithoutHash
      });
    }

    // 2. PRODUCTION SIGNATURE VERIFICATION
    let isVerified = false;
    if (config.RAZORPAY_KEY_SECRET) {
      try {
        const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');
        isVerified = validatePaymentVerification({
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id
        }, razorpay_signature, config.RAZORPAY_KEY_SECRET);
      } catch (sdkError) {
        // Hmac fallback verify loop
        const generated_signature = crypto
          .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');
        isVerified = (generated_signature === razorpay_signature);
      }
    }

    if (!isVerified) {
      db.transactions.update(tx.id, { status: 'failed' });
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update Transaction
    db.transactions.update(tx.id, {
      paymentId: razorpay_payment_id,
      status: 'paid'
    });

    // Update User premium privileges
    const updatedUser = db.users.update(user.id, {
      isPremium: true,
      subscriptionType: billingPeriod || 'monthly',
      subscriptionStart: startDate.toISOString(),
      subscriptionEnd: endDate.toISOString()
    });

    const userWithoutHash = {
      ...updatedUser,
      premiumPlanType: updatedUser.subscriptionType === 'yearly' ? 'yearly' : (updatedUser.subscriptionType === 'monthly' ? 'monthly' : null),
      premiumExpiresAt: updatedUser.subscriptionEnd || null,
      freeCreditsResetInMinutes: 0
    };
    delete userWithoutHash.passwordHash;

    return res.json({
      success: true,
      message: 'Subscription successfully verified and activated!',
      user: userWithoutHash
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'An error occurred during payment verification.' });
  }
}

module.exports = {
  createOrder,
  verifyPayment
};
