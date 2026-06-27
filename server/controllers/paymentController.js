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

    const user = await db.users.findById(req.userId);
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

    const user = await db.users.findById(req.userId);
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
      const updatedUser = await db.users.update(user.id, {
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
    const updatedUser = await db.users.update(user.id, {
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
  verifyPayment,
  createSubscription,
  verifySubscription,
  cancelSubscription,
  razorpayWebhook
};

// ----------------------------------------------------
// EMAIL NOTIFICATION SENDER (MOCKED)
// ----------------------------------------------------
function sendPremiumEmailNotification(user, type, details) {
  let subject = '';
  let body = '';

  if (type === 'activation') {
    subject = 'Welcome to TRAVNIFY Premium! 🚀';
    body = `Hi ${user.name || 'Traveler'},\n\nThank you for choosing TRAVNIFY Premium! Your monthly/yearly plan has been successfully activated.\n\nHere are your subscription details:\n- Plan: Premium Pass (${user.subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'})\n- Status: Active\n- Renewal Date: ${details.endDate}\n\nYou now have unlimited AI trip planning, access to the hidden gems dashboard, and high-fidelity PDF exports.\n\nHappy travels,\nThe TRAVNIFY Team`;
  } else if (type === 'renewal') {
    subject = 'Your TRAVNIFY Premium subscription has been renewed! 🔄';
    body = `Hi ${user.name || 'Traveler'},\n\nWe successfully processed your renewal payment. Your subscription is active for another billing cycle.\n\nNext Billing Date: ${details.endDate}\n\nThank you for exploring the world with us!\n\nThe TRAVNIFY Team`;
  } else if (type === 'cancellation') {
    subject = 'TRAVNIFY Premium Cancellation Confirmed 🛑';
    body = `Hi ${user.name || 'Traveler'},\n\nYour subscription has been cancelled and scheduled to terminate on ${details.endDate}.\n\nYou will continue to enjoy Premium access until then. Once terminated, you will return to the free plan.\n\nWe hope to welcome you back soon!\n\nThe TRAVNIFY Team`;
  }

  console.log(`\n====================================================`);
  console.log(`✉️  [MOCK EMAIL SERVICE] SENDING SUBSCRIPTION NOTIFICATION`);
  console.log(`👉 To: ${user.email}`);
  console.log(`👉 Subject: ${subject}`);
  console.log(`👉 Body:\n${body}`);
  console.log(`====================================================\n`);
  return true;
}

// ----------------------------------------------------
// CREATE SUBSCRIPTION
// ----------------------------------------------------
async function createSubscription(req, res) {
  try {
    const { plan } = req.body;
    if (plan !== 'monthly' && plan !== 'yearly') {
      return res.status(400).json({ error: 'Invalid plan. Must be monthly or yearly.' });
    }

    const user = await db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Map plan to Razorpay plan ID from env variables strictly
    const planId = plan === 'yearly'
      ? process.env.RAZORPAY_PLAN_YEARLY
      : process.env.RAZORPAY_PLAN_MONTHLY;

    if (!planId) {
      console.error(`[Razorpay Subscription] Plan ID missing in environment variables for plan style: ${plan}`);
      return res.status(500).json({ error: 'Subscription plan is not configured in the server environment.' });
    }

    let subscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 11)}`;
    let isSandbox = true;

    if (razorpayInstance) {
      try {
        const sub = await razorpayInstance.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          total_count: plan === 'yearly' ? 10 : 120, // number of cycles (10 years)
          quantity: 1,
          notes: {
            userId: user.id
          }
        });
        subscriptionId = sub.id;
        isSandbox = false;
      } catch (err) {
        console.error('Razorpay SDK subscription creation failed, falling back to Sandbox simulation:', err.message);
      }
    }

    // Save initial details in user profile
    await db.users.update(user.id, {
      subscriptionType: plan,
      razorpaySubscriptionId: subscriptionId,
      subscriptionStatus: 'created',
      isPremium: false // Set false initially, verification or webhook will activate
    });

    // Also store a transaction in our local DB for tracking
    const planPrices = PLAN_PRICES[plan === 'yearly' ? 'premiumYearly' : 'premiumMonthly'];
    const currency = user.preferredCurrency || 'INR';
    const amount = planPrices[currency] ?? planPrices['INR'];

    let amountInMinorUnits;
    if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
      amountInMinorUnits = Math.round(amount);
    } else {
      amountInMinorUnits = Math.round(amount * 100);
    }

    const transaction = {
      id: generateId('tx'),
      userId: user.id,
      orderId: subscriptionId,
      paymentId: '',
      amount: amount,
      currency: currency,
      status: 'created',
      createdAt: new Date().toISOString()
    };
    db.transactions.create(transaction);

    return res.json({
      success: true,
      sandbox: isSandbox,
      subscription_id: subscriptionId,
      keyId: config.RAZORPAY_KEY_ID || 'rzp_test_mock_id_travnify',
      amount: amountInMinorUnits,
      currency: currency,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: 'An error occurred creating subscription.' });
  }
}

// ----------------------------------------------------
// VERIFY SUBSCRIPTION
// ----------------------------------------------------
async function verifySubscription(req, res) {
  try {
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_subscription_id) {
      return res.status(400).json({ error: 'Subscription ID is required.' });
    }

    const user = await db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 1. Sandbox simulation check
    if (razorpay_subscription_id.startsWith('sub_mock_') || !razorpay_signature) {
      console.log(`Verifying subscription in Sandbox Mode for user: ${user.email}`);

      const startDate = new Date();
      const endDate = new Date();
      if (plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user premium privileges
      const updatedUser = await db.users.update(user.id, {
        isPremium: true,
        subscriptionType: plan || 'monthly',
        subscriptionStart: startDate.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        razorpaySubscriptionId: razorpay_subscription_id,
        subscriptionStatus: 'active'
      });

      // Update associated transaction
      const txList = db.transactions.findAll();
      const tx = txList.find(t => t.orderId === razorpay_subscription_id);
      if (tx) {
        db.transactions.update(tx.id, {
          paymentId: razorpay_payment_id || `pay_sandbox_${Math.random().toString(36).substring(2, 10)}`,
          status: 'paid'
        });
      }

      sendPremiumEmailNotification(updatedUser, 'activation', { endDate: endDate.toLocaleDateString() });

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

    // 2. Production Signature Verification
    let isVerified = false;
    if (config.RAZORPAY_KEY_SECRET) {
      try {
        const generated_signature = crypto
          .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
          .update(razorpay_payment_id + '|' + razorpay_subscription_id)
          .digest('hex');
        isVerified = (generated_signature === razorpay_signature);
      } catch (sdkError) {
        console.error('Signature calculation failed:', sdkError.message);
      }
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'Subscription payment signature verification failed.' });
    }

    const startDate = new Date();
    const endDate = new Date();
    if (plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updatedUser = await db.users.update(user.id, {
      isPremium: true,
      subscriptionType: plan || 'monthly',
      subscriptionStart: startDate.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      razorpaySubscriptionId: razorpay_subscription_id,
      subscriptionStatus: 'active'
    });

    const txList = db.transactions.findAll();
    const tx = txList.find(t => t.orderId === razorpay_subscription_id);
    if (tx) {
      db.transactions.update(tx.id, {
        paymentId: razorpay_payment_id,
        status: 'paid'
      });
    }

    sendPremiumEmailNotification(updatedUser, 'activation', { endDate: endDate.toLocaleDateString() });

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
    console.error('Verify subscription error:', error);
    return res.status(500).json({ error: 'An error occurred during subscription verification.' });
  }
}

// ----------------------------------------------------
// CANCEL SUBSCRIPTION
// ----------------------------------------------------
async function cancelSubscription(req, res) {
  try {
    const user = await db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const subId = user.razorpaySubscriptionId;
    if (!subId) {
      return res.status(400).json({ error: 'No active subscription found.' });
    }

    // 1. Sandbox simulation cancellation
    if (subId.startsWith('sub_mock_')) {
      console.log(`Cancelling subscription in Sandbox Mode for user: ${user.email}`);
      const updatedUser = await db.users.update(user.id, {
        subscriptionStatus: 'cancelled'
        // Premium access stays active until period end (handled by db.js users.findById self-healing check)
      });

      sendPremiumEmailNotification(updatedUser, 'cancellation', { endDate: new Date(user.subscriptionEnd).toLocaleDateString() });

      const userWithoutHash = {
        ...updatedUser,
        premiumPlanType: updatedUser.subscriptionType === 'yearly' ? 'yearly' : (updatedUser.subscriptionType === 'monthly' ? 'monthly' : null),
        premiumExpiresAt: updatedUser.subscriptionEnd || null,
        freeCreditsResetInMinutes: 0
      };
      delete userWithoutHash.passwordHash;

      return res.json({
        success: true,
        message: 'Subscription successfully scheduled to cancel at billing cycle end.',
        user: userWithoutHash
      });
    }

    // 2. Production cancellation call
    if (razorpayInstance) {
      try {
        await razorpayInstance.subscriptions.cancel(subId, {
          cancel_at_cycle_end: 1
        });
      } catch (err) {
        console.error('Razorpay SDK subscription cancel failed:', err.message);
        return res.status(500).json({ error: `Razorpay cancellation failed: ${err.message}` });
      }
    }

    const updatedUser = await db.users.update(user.id, {
      subscriptionStatus: 'cancelled'
    });

    sendPremiumEmailNotification(updatedUser, 'cancellation', { endDate: new Date(user.subscriptionEnd).toLocaleDateString() });

    const userWithoutHash = {
      ...updatedUser,
      premiumPlanType: updatedUser.subscriptionType === 'yearly' ? 'yearly' : (updatedUser.subscriptionType === 'monthly' ? 'monthly' : null),
      premiumExpiresAt: updatedUser.subscriptionEnd || null,
      freeCreditsResetInMinutes: 0
    };
    delete userWithoutHash.passwordHash;

    return res.json({
      success: true,
      message: 'Subscription successfully scheduled to cancel at billing cycle end.',
      user: userWithoutHash
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({ error: 'An error occurred during subscription cancellation.' });
  }
}

// ----------------------------------------------------
// RAZORPAY SUBSCRIPTIONS WEBHOOK HANDLER
// ----------------------------------------------------
async function razorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'travnify_webhook_secret_2026';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody || '')
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Webhook] Webhook signature validation failed.');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const payload = req.body;
    console.log(`[Webhook] Processing event: ${payload.event}`);

    const subEntity = payload.payload?.subscription?.entity;
    if (!subEntity) {
      return res.status(200).json({ message: 'Event acknowledged, no subscription entity.' });
    }

    const subId = subEntity.id;
    let userId = subEntity.notes?.userId;
    let user = null;

    if (userId) {
      user = await db.users.findById(userId);
    }
    if (!user) {
      user = await db.users.findBySubscriptionId(subId);
    }

    if (!user) {
      console.warn(`[Webhook] User not found for subscription ID: ${subId}`);
      return res.status(200).json({ message: 'Event acknowledged, but user profile was not located.' });
    }

    const event = payload.event;

    if (event === 'subscription.activated') {
      const startAt = subEntity.current_start ? new Date(subEntity.current_start * 1000) : new Date();
      const endAt = subEntity.current_end ? new Date(subEntity.current_end * 1000) : new Date();

      await db.users.update(user.id, {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionStart: startAt.toISOString(),
        subscriptionEnd: endAt.toISOString(),
        razorpaySubscriptionId: subId
      });

      console.log(`[Webhook] Activated Premium status for ${user.email} (sub: ${subId})`);
      sendPremiumEmailNotification(user, 'activation', { endDate: endAt.toLocaleDateString() });

    } else if (event === 'subscription.charged') {
      const startAt = subEntity.current_start ? new Date(subEntity.current_start * 1000) : new Date();
      const endAt = subEntity.current_end ? new Date(subEntity.current_end * 1000) : new Date();

      await db.users.update(user.id, {
        isPremium: true,
        subscriptionStatus: 'active',
        subscriptionStart: startAt.toISOString(),
        subscriptionEnd: endAt.toISOString()
      });

      // Log renewal payment transaction
      const paymentEntity = payload.payload?.payment?.entity;
      const amount = paymentEntity ? paymentEntity.amount / 100 : (subEntity.plan_amount || 0);
      const currency = paymentEntity ? paymentEntity.currency : (subEntity.currency || 'INR');

      const transaction = {
        id: generateId('tx'),
        userId: user.id,
        orderId: subId,
        paymentId: paymentEntity?.id || `pay_renewal_${generateId()}`,
        amount: amount,
        currency: currency,
        status: 'paid',
        createdAt: new Date().toISOString()
      };
      db.transactions.create(transaction);

      console.log(`[Webhook] Processed renewal payment for ${user.email} (sub: ${subId})`);
      sendPremiumEmailNotification(user, 'renewal', { endDate: endAt.toLocaleDateString() });

    } else if (['subscription.paused', 'subscription.cancelled', 'subscription.halted'].includes(event)) {
      const endAt = subEntity.current_end ? new Date(subEntity.current_end * 1000) : new Date();
      const now = new Date();
      const statusType = event.replace('subscription.', ''); // 'paused', 'cancelled', 'halted'

      // Check if paid cycle end date has passed to deactivate immediately
      const isExpired = now > endAt;

      await db.users.update(user.id, {
        isPremium: !isExpired,
        subscriptionStatus: statusType
      });

      console.log(`[Webhook] Subscription ${subId} status updated to ${statusType} (Expired: ${isExpired})`);

      if (event === 'subscription.cancelled') {
        sendPremiumEmailNotification(user, 'cancellation', { endDate: endAt.toLocaleDateString() });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook endpoint error:', error);
    return res.status(500).json({ error: 'An error occurred processing webhook.' });
  }
}
