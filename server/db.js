const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
const dbFile = path.join(dbDir, 'db.json');

// Ensure db directory and file exist
function initializeDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbFile)) {
    const initialData = {
      users: [],
      trips: [],
      transactions: []
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Read database
function readDb() {
  initializeDb();
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { users: [], trips: [], transactions: [] };
  }
}

// Write database safely
function writeDb(data) {
  initializeDb();
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to JSON database:', error);
    return false;
  }
}

const { supabase } = require('./supabaseClient');

function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function mapToJS(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    passwordHash: profile.password_hash,
    country: profile.country,
    currency: profile.currency,
    preferredCurrency: profile.preferred_currency,
    role: profile.role,
    isPremium: profile.is_premium,
    subscriptionType: profile.subscription_type,
    subscriptionStart: profile.subscription_start,
    subscriptionEnd: profile.subscription_end,
    freeTripsGenerated: profile.free_trips_generated,
    dailyCreditsUsed: profile.daily_credits_used,
    creditsWindowStartedAt: profile.credits_window_started_at,
    emailVerified: profile.email_verified,
    emailVerificationToken: profile.email_verification_token,
    emailVerificationExpiresAt: profile.email_verification_expires_at ? Number(profile.email_verification_expires_at) : null,
    refreshToken: profile.refresh_token,
    refreshTokenExpiresAt: profile.refresh_token_expires_at ? Number(profile.refresh_token_expires_at) : null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  };
}

function mapToDB(user) {
  if (!user) return null;
  const profile = {};
  if (user.id !== undefined) profile.id = user.id;
  if (user.name !== undefined) profile.name = user.name;
  if (user.email !== undefined) profile.email = user.email;
  if (user.passwordHash !== undefined) profile.password_hash = user.passwordHash;
  if (user.country !== undefined) profile.country = user.country;
  if (user.currency !== undefined) profile.currency = user.currency;
  if (user.preferredCurrency !== undefined) profile.preferred_currency = user.preferredCurrency;
  if (user.role !== undefined) profile.role = user.role;
  if (user.isPremium !== undefined) profile.is_premium = user.isPremium;
  if (user.subscriptionType !== undefined) profile.subscription_type = user.subscriptionType;
  if (user.subscriptionStart !== undefined) profile.subscription_start = user.subscriptionStart;
  if (user.subscriptionEnd !== undefined) profile.subscription_end = user.subscriptionEnd;
  if (user.freeTripsGenerated !== undefined) profile.free_trips_generated = user.freeTripsGenerated;
  if (user.dailyCreditsUsed !== undefined) profile.daily_credits_used = user.dailyCreditsUsed;
  if (user.creditsWindowStartedAt !== undefined) profile.credits_window_started_at = user.creditsWindowStartedAt;
  if (user.emailVerified !== undefined) profile.email_verified = user.emailVerified;
  if (user.emailVerificationToken !== undefined) profile.email_verification_token = user.emailVerificationToken;
  if (user.emailVerificationExpiresAt !== undefined) profile.email_verification_expires_at = user.emailVerificationExpiresAt;
  if (user.refreshToken !== undefined) profile.refresh_token = user.refreshToken;
  if (user.refreshTokenExpiresAt !== undefined) profile.refresh_token_expires_at = user.refreshTokenExpiresAt;
  return profile;
}

// User Helpers
const users = {
  findAll: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) {
      console.error('Supabase findAll error:', error);
      throw error;
    }
    return (data || []).map(mapToJS);
  },
  findById: async (id) => {
    if (!id || !isValidUUID(id)) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Supabase findById error:', error);
      throw error;
    }
    return mapToJS(data);
  },
  findByEmail: async (email) => {
    if (!email) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) {
      console.error('Supabase findByEmail error:', error);
      throw error;
    }
    return mapToJS(data);
  },
  create: async (user) => {
    const dbProfile = mapToDB(user);
    const crypto = require('crypto');
    if (!dbProfile.id || !isValidUUID(dbProfile.id)) {
      dbProfile.id = crypto.randomUUID();
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert([dbProfile])
      .select()
      .single();
    if (error) {
      console.error('Supabase create error:', error);
      throw error;
    }
    return mapToJS(data);
  },
  update: async (id, updates) => {
    if (!id || !isValidUUID(id)) return null;
    const dbUpdates = mapToDB(updates);
    delete dbUpdates.id;
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    return mapToJS(data);
  },
  consumeCredit: async (id) => {
    if (!id || !isValidUUID(id)) return { allowed: false, error: 'Invalid or missing user ID.' };
    
    const user = await users.findById(id);
    if (!user) return { allowed: false, error: 'User not found.' };
    
    if (user.isPremium) {
      return { allowed: true, dailyCreditsUsed: user.dailyCreditsUsed || 0 };
    }
    
    const now = new Date().toISOString();
    const nowMs = Date.now();
    
    let creditsWindowStartedAt = user.creditsWindowStartedAt || null;
    let dailyCreditsUsed = user.dailyCreditsUsed || 0;
    
    if (!creditsWindowStartedAt) {
      creditsWindowStartedAt = now;
      dailyCreditsUsed = 1;
      await users.update(id, { dailyCreditsUsed, creditsWindowStartedAt });
      return { allowed: true, dailyCreditsUsed };
    }
    
    const windowStartMs = new Date(creditsWindowStartedAt).getTime();
    const diffMs = nowMs - windowStartMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      if (dailyCreditsUsed < 5) {
        dailyCreditsUsed += 1;
        await users.update(id, { dailyCreditsUsed });
        return { allowed: true, dailyCreditsUsed };
      } else {
        return { allowed: false, dailyCreditsUsed };
      }
    } else {
      creditsWindowStartedAt = now;
      dailyCreditsUsed = 1;
      await users.update(id, { dailyCreditsUsed, creditsWindowStartedAt });
      return { allowed: true, dailyCreditsUsed };
    }
  }
};

// Trip Helpers
const trips = {
  findAll: () => readDb().trips,
  findById: (id) => readDb().trips.find(t => t.id === id),
  findByUserId: (userId) => readDb().trips.filter(t => t.userId === userId),
  create: (trip) => {
    const db = readDb();
    db.trips.push(trip);
    writeDb(db);
    return trip;
  },
  delete: (id) => {
    const db = readDb();
    const originalLength = db.trips.length;
    db.trips = db.trips.filter(t => t.id !== id);
    writeDb(db);
    return db.trips.length < originalLength;
  }
};

// Transaction Helpers
const transactions = {
  findAll: () => readDb().transactions,
  findById: (id) => readDb().transactions.find(t => t.id === id),
  findByUserId: (userId) => readDb().transactions.filter(t => t.userId === userId),
  create: (tx) => {
    const db = readDb();
    db.transactions.push(tx);
    writeDb(db);
    return tx;
  },
  update: (id, updates) => {
    const db = readDb();
    const idx = db.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.transactions[idx] = { ...db.transactions[idx], ...updates };
      writeDb(db);
      return db.transactions[idx];
    }
    return null;
  }
};

module.exports = {
  users,
  trips,
  transactions
};
