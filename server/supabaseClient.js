const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Boot-time env var check (visible in Vercel Function Logs) ──────────────
console.log('[Supabase] SUPABASE_URL set            :', !!supabaseUrl);
console.log('[Supabase] SUPABASE_SERVICE_ROLE_KEY set:', !!supabaseServiceKey);
if (supabaseUrl) {
  // Print only the project hostname, never the full key
  try {
    const host = new URL(supabaseUrl).hostname;
    console.log('[Supabase] Project host :', host);
  } catch (_) {
    console.log('[Supabase] SUPABASE_URL value appears malformed (URL parse failed)');
  }
}
if (supabaseServiceKey) {
  console.log('[Supabase] Key length   :', supabaseServiceKey.length, '(expected ~239 chars for service_role)');
  console.log('[Supabase] Key prefix   :', supabaseServiceKey.substring(0, 10) + '...');
}
// ────────────────────────────────────────────────────────────────────────────

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '\n❌ CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not set.\n' +
    '   All database operations will fail until these are configured.\n' +
    '   → Go to your Supabase project: Settings → API → copy Project URL and service_role key.\n' +
    '   → Add them to your Vercel environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n'
  );
}

// Use placeholder values only to prevent a require-time crash;
// the real error will surface when any DB query is attempted.
const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ── Async connectivity probe (runs once after boot, logs result) ───────────
async function probeSupabaseConnection() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase] Skipping connectivity probe — env vars not set.');
    return;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Supabase] ❌ Connectivity probe FAILED:');
      console.error('[Supabase]    message :', error.message);
      console.error('[Supabase]    code    :', error.code);
      console.error('[Supabase]    hint    :', error.hint);
      console.error('[Supabase]    details :', error.details);
    } else {
      console.log('[Supabase] ✅ Connectivity probe PASSED — profiles table reachable. Rows returned:', (data || []).length);
    }
  } catch (err) {
    console.error('[Supabase] ❌ Connectivity probe threw exception:', err.message);
  }
}

// Schedule the probe to run shortly after the module loads
// (setImmediate ensures it runs after the event loop tick so server boots first)
setImmediate(probeSupabaseConnection);
// ────────────────────────────────────────────────────────────────────────────

module.exports = { supabase, isConfigured: !!(supabaseUrl && supabaseServiceKey) };
