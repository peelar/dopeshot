-- Brand Profiles table
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  name TEXT,
  color_palette JSONB,
  typography JSONB,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Metadata table
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  exports_this_month INTEGER NOT NULL DEFAULT 0,
  onboarding_progress JSONB,
  feature_flags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for subscription_tier
ALTER TABLE public.user_metadata
  ADD CONSTRAINT user_metadata_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'paid'));

-- Add constraint for subscription_status
ALTER TABLE public.user_metadata
  ADD CONSTRAINT user_metadata_subscription_status_check
  CHECK (subscription_status IN ('active', 'cancelled', 'past_due'));

-- Generated Assets table
CREATE TABLE IF NOT EXISTS public.generated_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  layout TEXT,
  style TEXT,
  settings JSONB,
  metadata JSONB,
  text_overlays JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for generated_assets
CREATE INDEX IF NOT EXISTS generated_assets_user_id_created_at_idx
  ON public.generated_assets(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_profiles
CREATE POLICY "Users can view their own brand profile"
  ON public.brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand profile"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profile"
  ON public.brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_metadata
CREATE POLICY "Users can view their own metadata"
  ON public.user_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metadata"
  ON public.user_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metadata"
  ON public.user_metadata FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for generated_assets
CREATE POLICY "Users can view their own assets"
  ON public.generated_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON public.generated_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.generated_assets FOR DELETE
  USING (auth.uid() = user_id);
