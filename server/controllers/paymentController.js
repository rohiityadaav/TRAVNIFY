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

// ----------------------------------------------------
// CREATE SUBSCRIPTION ORDER
// ----------------------------------------------------
// ----------------------------------------------------
// CREATE SUBSCRIPTION ORDER (INR / USD)
// ----------------------------------------------------
async function createOrder(req, res) {
  try {
    let planId = req.body.planId || 'premiumMonthly';
    // Normalize legacy names to the new ones
    if (planId === 'premium_monthly') planId = 'premiumMonthly';
    if (planId === 'premium_yearly') planId = 'premiumYearly';

    let currency = req.body.currency || 'USD';
    // Ensure only INR or USD are allowed, default to USD if missing or invalid
    if (currency !== 'INR' && currency !== 'USD') {
      currency = 'USD';
    }

    const plans = {
      premiumMonthly: { INR: 199, USD: 5 },
      premiumYearly: { INR: 999, USD: 49 },
    };

    const activePlan = plans[planId];
    if (!activePlan) {
      return res.status(400).json({ error: `Invalid planId: ${planId}` });
    }

    const baseAmount = activePlan[currency];
    const user = db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    const amountInMinorUnits = baseAmount * 100;

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
