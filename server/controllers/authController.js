const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

// Helper to parse refresh token from cookies
function getRefreshTokenCookie(req) {
  if (!req.headers.cookie) return null;
  const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}

// Helper to set HTTP-only refresh token cookie
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// Mock email service for verification
function sendVerificationEmail(email, token) {
  const backendPort = config.PORT || 5000;
  const verifyUrl = `http://localhost:${backendPort}/api/auth/verify-email?token=${token}`;
  
  console.log(`\n====================================================`);
  console.log(`✉️  [MOCK EMAIL SERVICE] SENDING VERIFICATION EMAIL`);
  console.log(`👉 To: ${email}`);
  console.log(`🔗 Verification Link: ${verifyUrl}`);
  console.log(`====================================================\n`);
  return true;
}

// Helper to generate unique ID
function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// Helper to map country code to currency code (200+ countries)
function getCurrencyForCountry(country) {
  const map = {
    // Asia-Pacific
    IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
    BT: 'BTN', MV: 'MVR', MM: 'MMK', TH: 'THB', VN: 'VND',
    KH: 'KHR', LA: 'LAK', MY: 'MYR', SG: 'SGD', ID: 'IDR',
    PH: 'PHP', BN: 'BND', TL: 'USD', CN: 'CNY', HK: 'HKD',
    MO: 'MOP', TW: 'TWD', JP: 'JPY', KR: 'KRW', KP: 'KPW',
    MN: 'MNT', AF: 'AFN', PG: 'PGK', FJ: 'FJD', SB: 'SBD',
    VU: 'VUV', WS: 'WST', TO: 'TOP', AU: 'AUD', NZ: 'NZD',
    // Middle East
    AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD',
    OM: 'OMR', JO: 'JOD', IL: 'ILS', IR: 'IRR', IQ: 'IQD',
    SY: 'SYP', LB: 'LBP', YE: 'YER', TR: 'TRY',
    // Europe
    GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR',
    FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LV: 'EUR',
    LT: 'EUR', EE: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR',
    CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
    PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
    HR: 'HRK', RS: 'RSD', BA: 'BAM', MK: 'MKD', AL: 'ALL',
    ME: 'EUR', XK: 'EUR', MD: 'MDL', UA: 'UAH', BY: 'BYN',
    RU: 'RUB', GE: 'GEL', AM: 'AMD', AZ: 'AZN',
    // Americas
    US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS',
    CO: 'COP', CL: 'CLP', PE: 'PEN', VE: 'VEF', EC: 'USD',
    BO: 'BOB', PY: 'PYG', UY: 'UYU', GY: 'GYD', SR: 'SRD',
    GT: 'GTQ', BZ: 'BZD', HN: 'HNL', SV: 'USD', NI: 'NIO',
    CR: 'CRC', PA: 'PAB', CU: 'CUP', DO: 'DOP', HT: 'HTG',
    JM: 'JMD', TT: 'TTD', BB: 'BBD', LC: 'XCD', VC: 'XCD',
    GD: 'XCD', AG: 'XCD', DM: 'XCD', KN: 'XCD', BS: 'BSD',
    TC: 'USD', KY: 'KYD', AW: 'AWG', CW: 'ANG', PR: 'USD',
    // Africa
    ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', TZ: 'TZS',
    UG: 'UGX', ET: 'ETB', EG: 'EGP', MA: 'MAD', DZ: 'DZD',
    TN: 'TND', LY: 'LYD', SD: 'SDG', SO: 'SOS', DJ: 'DJF',
    ER: 'ERN', MZ: 'MZN', ZM: 'ZMW', ZW: 'ZWL', BW: 'BWP',
    NA: 'NAD', SZ: 'SZL', LS: 'LSL', MW: 'MWK', RW: 'RWF',
    BI: 'BIF', CD: 'CDF', CG: 'XAF', CM: 'XAF', CF: 'XAF',
    GA: 'XAF', GQ: 'XAF', TD: 'XAF', SN: 'XOF', ML: 'XOF',
    BF: 'XOF', GN: 'GNF', CI: 'XOF', TG: 'XOF', BJ: 'XOF',
    NE: 'XOF', GM: 'GMD', GW: 'XOF', SL: 'SLL', LR: 'LRD',
    CV: 'CVE', ST: 'STD', MU: 'MUR', SC: 'SCR', MG: 'MGA',
    KM: 'KMF', AO: 'AOA',
    // Central Asia
    KZ: 'KZT', UZ: 'UZS', TM: 'TMT', TJ: 'TJS', KG: 'KGS',
  };
  return map[country] || 'USD';
}

// Signup Controller
async function signup(req, res) {
  try {
    const { name, email, password, country, preferredCurrency } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (password.length > 64) {
      return res.status(400).json({ error: "Password must be at most 64 characters." });
    }

    // Check if user already exists
    const existingUser = db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const userCountry = country || 'IN';
    const userCurrency = getCurrencyForCountry(userCountry);
    // Use explicitly chosen preferredCurrency, or fall back to country-based default
    const userPreferredCurrency = preferredCurrency || userCurrency || 'INR';
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expires

    // Create user object
    const newUser = {
      id: generateId('usr'),
      name,
      email: email.toLowerCase(),
      passwordHash,
      country: userCountry,
      currency: userCurrency,
      preferredCurrency: userPreferredCurrency,
      isPremium: false,
      subscriptionType: null,
      subscriptionStart: null,
      subscriptionEnd: null,
      freeTripsGenerated: 0,
      dailyCreditsUsed: 0,
      creditsWindowStartedAt: null,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiry
    };

    // Save to DB
    const savedUser = db.users.create(newUser);

    // Send verification email
    sendVerificationEmail(savedUser.email, verificationToken);

    // Generate short-lived JWT access token
    const token = jwt.sign({ userId: savedUser.id }, config.JWT_SECRET, { expiresIn: '15m' });

    // Generate long-lived refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Save refresh token to user DB record
    db.users.update(savedUser.id, {
      refreshToken,
      refreshTokenExpiresAt
    });

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      token,
      user: formatUserProfile({ ...savedUser, refreshToken, refreshTokenExpiresAt })
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'An error occurred during registration.' });
  }
}



// Helper to format user profile consistently
function formatUserProfile(user) {
  if (!user) return null;
  const { passwordHash: _, ...userWithoutHash } = user;
  
  // Explicitly requested fields
  userWithoutHash.isPremium = user.isPremium || false;
  userWithoutHash.premiumPlanType = user.subscriptionType === 'yearly' ? 'yearly' : (user.subscriptionType === 'monthly' ? 'monthly' : null);
  userWithoutHash.premiumExpiresAt = user.subscriptionEnd || null;
  
  // Ensure preferredCurrency is always present (default to INR)
  userWithoutHash.preferredCurrency = user.preferredCurrency || user.currency || 'INR';

  // Calculate remaining minutes in 24h credits reset window
  let freeCreditsResetInMinutes = 0;
  if (!user.isPremium && user.creditsWindowStartedAt) {
    const nowMs = Date.now();
    const windowStartMs = new Date(user.creditsWindowStartedAt).getTime();
    const expiryMs = windowStartMs + 24 * 60 * 60 * 1000;
    const remainingMs = expiryMs - nowMs;
    if (remainingMs > 0) {
      freeCreditsResetInMinutes = Math.ceil(remainingMs / (1000 * 60));
    }
  }
  userWithoutHash.freeCreditsResetInMinutes = freeCreditsResetInMinutes;
  
  return userWithoutHash;
}

// Get Profile Info
async function getMe(req, res) {
  try {
    const user = db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let activeUser = user;
    const updates = {};
    if (!activeUser.country || !activeUser.currency) {
      updates.country = activeUser.country || 'IN';
      updates.currency = activeUser.currency || getCurrencyForCountry(updates.country);
    }
    
    // Check for rolling 24h window reset on getMe
    if (!activeUser.isPremium && activeUser.creditsWindowStartedAt) {
      const nowMs = Date.now();
      const windowStartMs = new Date(activeUser.creditsWindowStartedAt).getTime();
      const expiryMs = windowStartMs + 24 * 60 * 60 * 1000;
      const remainingMs = expiryMs - nowMs;
      
      if (remainingMs <= 0) {
        updates.dailyCreditsUsed = 0;
        updates.creditsWindowStartedAt = null;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      activeUser = db.users.update(activeUser.id, updates);
    }

    return res.json(formatUserProfile(activeUser));
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'An error occurred fetching user profile.' });
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Optional Authentication Middleware (populates req.userId if token is present, does not fail if not)
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (error) {
    // Ignore invalid token, proceed as guest
  }
  next();
}

// Firebase Synchronization Controller
async function firebaseSync(req, res) {
  try {
    const { email, name, country, emailVerified, preferredCurrency } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for synchronization.' });
    }

    const userCountry = country || 'IN';
    const userCurrency = getCurrencyForCountry(userCountry);
    // Use explicitly chosen preferredCurrency, or fall back to country-based default
    const userPreferredCurrency = preferredCurrency || userCurrency || 'INR';

    // Check if user already exists in local database
    let user = db.users.findByEmail(email);
    
    // Determine verification status: if sent, use it; otherwise default to false for new users
    const isVerified = emailVerified !== undefined ? emailVerified : false;

    if (!user) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Create user record locally if they don't exist
      const newUser = {
        id: generateId('usr'),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash: 'FIREBASE_MANAGED_AUTH', // Managed externally by Firebase Auth
        country: userCountry,
        currency: userCurrency,
        preferredCurrency: userPreferredCurrency,
        isPremium: false,
        subscriptionType: null,
        subscriptionStart: null,
        subscriptionEnd: null,
        freeTripsGenerated: 0,
        dailyCreditsUsed: 0,
        creditsWindowStartedAt: null,
        emailVerified: isVerified,
        emailVerificationToken: isVerified ? '' : verificationToken,
        emailVerificationExpiresAt: isVerified ? 0 : verificationExpiry
      };
      user = db.users.create(newUser);

      if (!isVerified) {
        // Send verification email
        sendVerificationEmail(user.email, verificationToken);
      }
    } else {
      // Update country and currency if provided or if they are missing
      const updates = {};
      if (country && user.country !== country) {
        updates.country = country;
        updates.currency = getCurrencyForCountry(country);
      } else if (!user.currency) {
        updates.currency = getCurrencyForCountry(user.country || 'IN');
      }

      // Update preferredCurrency if explicitly provided in this sync call
      if (preferredCurrency && user.preferredCurrency !== preferredCurrency) {
        updates.preferredCurrency = preferredCurrency;
      } else if (!user.preferredCurrency) {
        // Back-fill preferredCurrency for existing users who don't have it
        updates.preferredCurrency = user.currency || userPreferredCurrency;
      }

      // Sync verified state from frontend if they verified via Firebase SSO (Google, etc)
      if (isVerified && !user.emailVerified) {
        updates.emailVerified = true;
        updates.emailVerificationToken = '';
        updates.emailVerificationExpiresAt = 0;
      }

      if (Object.keys(updates).length > 0) {
        user = db.users.update(user.id, updates);
      }
    }

    // Generate short-lived JWT access token
    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '15m' });

    // Generate long-lived refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Save refresh token to user DB record
    db.users.update(user.id, {
      refreshToken,
      refreshTokenExpiresAt
    });

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      token,
      user: formatUserProfile({ ...user, refreshToken, refreshTokenExpiresAt })
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    return res.status(500).json({ error: 'An error occurred during synchronization.' });
  }
}

// HTML rendering function for verify success/error
function renderStatusPage(success, message) {
  const title = success ? 'Email Verified' : 'Verification Failed';
  const icon = success 
    ? `<div style="background: rgba(16, 185, 129, 0.1); color: #10B981; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2)">✓</div>`
    : `<div style="background: rgba(239, 68, 68, 0.1); color: #EF4444; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.2)">✗</div>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TRAVNIFY - ${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Outfit', sans-serif;
          background: #071739;
          color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 1rem;
        }
        .container {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 450px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .logo {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em;
        }
        h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #FFFFFF;
        }
        p {
          color: #94A3B8;
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
          color: #FFFFFF;
          text-decoration: none;
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3);
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(56, 189, 248, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">TRAVNIFY</div>
        ${icon}
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="/" class="btn" id="btn-redirect">Go to App</a>
      </div>
      <script>
        const btn = document.getElementById('btn-redirect');
        if (window.location.port === '5000' || window.location.hostname === 'localhost') {
          btn.href = 'http://' + window.location.hostname + ':5173/';
        }
      </script>
    </body>
    </html>
  `;
}

// Verify Email Endpoint
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(renderStatusPage(false, 'Missing verification token.'));
    }

    const user = db.users.findAll().find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return res.status(400).send(renderStatusPage(false, 'Invalid verification token. The link may be broken or already used.'));
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < Date.now()) {
      return res.status(400).send(renderStatusPage(false, 'Verification link has expired. Please log in and request a new verification link.'));
    }

    db.users.update(user.id, {
      emailVerified: true,
      emailVerificationToken: '',
      emailVerificationExpiresAt: 0
    });

    return res.status(200).send(renderStatusPage(true, 'Your email has been verified successfully! You can now access all features of TRAVNIFY.'));
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).send(renderStatusPage(false, 'An unexpected error occurred during email verification.'));
  }
}

// Resend Verification Endpoint
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.users.findByEmail(email);

    if (!user) {
      return res.status(200).json({ message: 'Verification email sent again. Please check your inbox.' });
    }

    if (user.emailVerified === true) {
      return res.status(200).json({ message: 'Already verified' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 24 * 60 * 60 * 1000;

    db.users.update(user.id, {
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiry
    });

    sendVerificationEmail(user.email, token);

    return res.status(200).json({ message: 'Verification email sent again. Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'An error occurred while resending the verification email.' });
  }
}

// Update Profile Controller (PATCH /api/auth/profile)
async function updateProfile(req, res) {
  try {
    const user = db.users.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const allowedFields = ['preferredCurrency', 'name'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const updatedUser = db.users.update(user.id, updates);
    return res.json(formatUserProfile(updatedUser));
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'An error occurred updating your profile.' });
  }
}

// Refresh Token Controller
async function refresh(req, res) {
  try {
    const tokenFromCookie = getRefreshTokenCookie(req);
    if (!tokenFromCookie) {
      return res.status(401).json({ error: 'Refresh token not found.' });
    }

    // Find user with matching refresh token
    const user = db.users.findAll().find(u => u.refreshToken === tokenFromCookie);
    if (!user) {
      // Clear cookie on mismatch
      res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // Check expiration
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < Date.now()) {
      // Revoke token and clear cookie
      db.users.update(user.id, { refreshToken: null, refreshTokenExpiresAt: 0 });
      res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
      return res.status(401).json({ error: 'Refresh token has expired.' });
    }

    // Generate new tokens (rotation)
    const newAccessToken = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Update DB
    const updatedUser = db.users.update(user.id, {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt
    });

    // Set new cookie
    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      token: newAccessToken,
      user: formatUserProfile(updatedUser)
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'An error occurred during token refresh.' });
  }
}

// Logout Controller
async function logout(req, res) {
  try {
    const tokenFromCookie = getRefreshTokenCookie(req);
    
    if (tokenFromCookie) {
      const user = db.users.findAll().find(u => u.refreshToken === tokenFromCookie);
      if (user) {
        // Revoke token in DB
        db.users.update(user.id, {
          refreshToken: null,
          refreshTokenExpiresAt: 0
        });
      }
    }

    // Clear cookie
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'An error occurred during logout.' });
  }
}

module.exports = {
  signup,
  getMe,
  updateProfile,
  authenticateToken,
  optionalAuthenticateToken,
  firebaseSync,
  verifyEmail,
  resendVerification,
  formatUserProfile,
  refresh,
  logout
};
