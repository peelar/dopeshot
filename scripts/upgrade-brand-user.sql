-- Upgrade a user to the "brand" tier by email (PostgreSQL).
-- Supabase SQL Editor: replace the email literal in the target CTE and run.
-- Safe to run repeatedly: adds missing columns if they aren't present yet.

-- Ensure required columns exist (no-op if already present)
ALTER TABLE public.user_metadata
  ADD COLUMN IF NOT EXISTS subscription_tier   text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';

WITH target AS (
  -- Replace this email before running
  SELECT id FROM public."user" WHERE email = 'user@example.com'
)
INSERT INTO public.user_metadata (
  id,
  user_id,
  subscription_tier,
  subscription_status,
  created_at,
  updated_at
)
SELECT
  -- Generate a CUID-like ID (or you can use gen_random_uuid() if you prefer UUID)
  'c' || encode(gen_random_bytes(12), 'base64')::text,
  id,
  'brand',
  'active',
  now(),
  now()
FROM target
ON CONFLICT (user_id) DO UPDATE
  SET subscription_tier   = EXCLUDED.subscription_tier,
      subscription_status = EXCLUDED.subscription_status,
      updated_at          = now()
RETURNING user_id, subscription_tier, subscription_status, updated_at;
