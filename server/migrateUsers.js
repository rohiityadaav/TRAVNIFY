require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase Service Role client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dbFile = path.join(__dirname, 'data', 'db.json');

// Check if UUID is valid
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function runMigration() {
  console.log('🔄 Starting user migration to Supabase Postgres...');
  
  if (!fs.existsSync(dbFile)) {
    console.error(`❌ db.json file not found at ${dbFile}`);
    process.exit(1);
  }

  let dbData;
  try {
    const rawData = fs.readFileSync(dbFile, 'utf8');
    dbData = JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Failed to read or parse db.json:', error);
    process.exit(1);
  }

  const localUsers = dbData.users || [];
  const localTrips = dbData.trips || [];
  const localTransactions = dbData.transactions || [];

  console.log(`ℹ️ Found ${localUsers.length} users, ${localTrips.length} trips, and ${localTransactions.length} transactions in db.json`);

  const idMap = {}; // Maps old legacy ID to new Supabase UUID

  for (const user of localUsers) {
    console.log(`\n👤 Migrating user: ${user.email}...`);

    try {
      // Check if user already exists in Supabase
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      if (fetchError) {
        console.error(`❌ Error checking user ${user.email} in Supabase:`, fetchError.message);
        continue;
      }

      let targetUuid;

      if (existingProfile) {
        console.log(`⚠️ User ${user.email} already exists in Supabase with ID: ${existingProfile.id}. Skipping insert.`);
        targetUuid = existingProfile.id;
      } else {
        // Generate a new UUID if local ID is not already a valid UUID
        targetUuid = isValidUUID(user.id) ? user.id : crypto.randomUUID();

        // Map keys to DB format (snake_case)
        const dbProfile = {
          id: targetUuid,
          email: user.email.toLowerCase(),
          name: user.name || null,
          password_hash: user.passwordHash || null,
          role: user.role || 'user',
          is_premium: user.isPremium || false,
          country: user.country || 'IN',
          currency: user.currency || 'INR',
          preferred_currency: user.preferredCurrency || user.currency || 'INR',
          subscription_type: user.subscriptionType || null,
          subscription_start: user.subscriptionStart || null,
          subscription_end: user.subscriptionEnd || null,
          free_trips_generated: user.freeTripsGenerated || 0,
          daily_credits_used: user.dailyCreditsUsed || 0,
          credits_window_started_at: user.creditsWindowStartedAt || null,
          email_verified: user.emailVerified || false,
          email_verification_token: user.emailVerificationToken || null,
          email_verification_expires_at: user.emailVerificationExpiresAt || null,
          refresh_token: user.refreshToken || null,
          refresh_token_expires_at: user.refreshTokenExpiresAt || null
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([dbProfile]);

        if (insertError) {
          console.error(`❌ Error inserting user ${user.email} into Supabase:`, insertError.message);
          continue;
        }

        console.log(`✅ User ${user.email} successfully inserted with UUID: ${targetUuid}`);
      }

      // Record ID mapping if they differ
      if (user.id !== targetUuid) {
        idMap[user.id] = targetUuid;
        console.log(`🔗 Map legacy ID "${user.id}" to UUID "${targetUuid}"`);
      }

    } catch (err) {
      console.error(`❌ Unexpected error migrating user ${user.email}:`, err);
    }
  }

  // Update foreign key references in trips and transactions
  let referencesUpdated = 0;

  if (Object.keys(idMap).length > 0) {
    console.log('\n🔗 Updating user ID references in trips and transactions...');

    dbData.trips = localTrips.map(trip => {
      if (idMap[trip.userId]) {
        referencesUpdated++;
        return { ...trip, userId: idMap[trip.userId] };
      }
      return trip;
    });

    dbData.transactions = localTransactions.map(tx => {
      if (idMap[tx.userId]) {
        referencesUpdated++;
        return { ...tx, userId: idMap[tx.userId] };
      }
      return tx;
    });
  }

  // Save the updated db.json
  try {
    fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`\n💾 Saved updated db.json to disk. Updated ${referencesUpdated} foreign key references.`);
  } catch (writeError) {
    console.error('❌ Error saving updated db.json:', writeError);
  }

  console.log('\n🏁 User migration script completed!');
}

runMigration().catch(err => {
  console.error('❌ Migration process failed:', err);
});
