-- ============================================================
-- Travnify — Supabase Profiles Table Migration
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT,
  email                       TEXT UNIQUE NOT NULL,
  password_hash               TEXT,
  country                     TEXT DEFAULT 'IN',
  currency                    TEXT DEFAULT 'INR',
  preferred_currency          TEXT DEFAULT 'INR',
  role                        TEXT DEFAULT 'user',
  is_premium                  BOOLEAN DEFAULT FALSE,
  subscription_type           TEXT,
  subscription_start          TIMESTAMPTZ,
  subscription_end            TIMESTAMPTZ,
  free_trips_generated        INTEGER DEFAULT 0,
  daily_credits_used          INTEGER DEFAULT 0,
  credits_window_started_at   TIMESTAMPTZ,
  email_verified              BOOLEAN DEFAULT FALSE,
  email_verification_token    TEXT,
  email_verification_expires_at BIGINT,
  refresh_token               TEXT,
  refresh_token_expires_at    BIGINT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index on email for fast lookups (findByEmail is the most common query)
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- 3. Index on refresh_token for fast refresh-token lookups
CREATE INDEX IF NOT EXISTS profiles_refresh_token_idx ON public.profiles (refresh_token);

-- 4. Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Disable Row Level Security for the service_role key
--    (the backend uses service_role which bypasses RLS anyway,
--     but this makes it explicit and prevents accidental lockouts)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 6. Verify the table was created — should return 0 rows, no error
SELECT COUNT(*) AS total_profiles FROM public.profiles;
