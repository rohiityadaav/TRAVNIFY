-- ============================================================
-- Travnify — Migration to add Subscription Columns
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Verify columns were added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('razorpay_subscription_id', 'subscription_status');
