/**
 * Auth Sync Diagnostic Script
 * Run: node server/scratch_diagnose_auth.js
 * This tests the Supabase connection and profiles table directly.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n============================================');
console.log('  TRAVNIFY — Auth Sync Diagnostic Script');
console.log('============================================\n');

console.log('1. Environment Variables:');
console.log('   SUPABASE_URL      :', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : '❌ MISSING');
console.log('   SUPABASE_KEY      :', supabaseKey ? supabaseKey.substring(0, 20) + '... (length=' + supabaseKey.length + ')' : '❌ MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env');
  console.error('   Fix: Add these variables to server/.env or the root .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 2. Test basic Supabase connectivity by querying the profiles table
  console.log('\n2. Testing Supabase connectivity — querying profiles table...');
  const { data: rows, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('\n❌ SELECT failed:', selectError.message);
    console.error('   Code:', selectError.code);
    console.error('   Hint:', selectError.hint);
    console.error('   Details:', selectError.details);
    console.error('\n   Likely causes:');
    console.error('   - "profiles" table does not exist → run the SQL migrations in Supabase SQL editor');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY is wrong → re-copy it from Supabase Project Settings → API');
    console.error('   - RLS enabled with no policies for service role → disable RLS or add a policy');
  } else {
    console.log('   ✅ SELECT succeeded. Row count returned:', rows.length);
    if (rows.length > 0) {
      console.log('   Sample columns:', Object.keys(rows[0]).join(', '));
    }
  }

  // 3. Test INSERT (simulate a new user creation)
  console.log('\n3. Testing INSERT into profiles table (dry-run with test email)...');
  const testEmail = `diag_test_${Date.now()}@travnify-diag.local`;
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert([{
      id: require('crypto').randomUUID(),
      name: 'Diagnostic Test User',
      email: testEmail,
      password_hash: 'FIREBASE_MANAGED_AUTH',
      country: 'IN',
      currency: 'INR',
      preferred_currency: 'INR',
      role: 'user',
      is_premium: false,
      free_trips_generated: 0,
      daily_credits_used: 0,
      email_verified: false,
    }])
    .select()
    .single();

  if (insertError) {
    console.error('\n❌ INSERT failed:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Hint:', insertError.hint);
    console.error('   Details:', insertError.details);
    console.error('\n   Likely causes:');
    console.error('   - Missing column → run latest migration to add any new columns');
    console.error('   - RLS policy blocking INSERT → add a policy or use service role key');
    console.error('   - NOT NULL constraint on an unmapped column');
  } else {
    console.log('   ✅ INSERT succeeded! New row id:', inserted.id);

    // 4. Clean up diagnostic row
    console.log('\n4. Cleaning up diagnostic row...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', inserted.id);

    if (deleteError) {
      console.warn('   ⚠️  Could not clean up test row:', deleteError.message);
    } else {
      console.log('   ✅ Cleanup successful.');
    }
  }

  console.log('\n============================================');
  console.log('  Diagnostic complete.');
  console.log('============================================\n');
}

run().catch(err => {
  console.error('\n❌ Unexpected error during diagnostic:', err.message);
  console.error(err.stack);
  process.exit(1);
});
