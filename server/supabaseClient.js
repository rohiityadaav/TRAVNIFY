const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  supabaseServiceKey || 'placeholder-key'
);

module.exports = { supabase, isConfigured: !!(supabaseUrl && supabaseServiceKey) };
