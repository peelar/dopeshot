-- Better-auth tables (in public schema)
CREATE TABLE IF NOT EXISTS public.user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Brand Profiles table
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  name TEXT,
  color_palette JSONB,
  typography JSONB,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Metadata table
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'active',
  exports_this_month INTEGER NOT NULL DEFAULT 0,
  onboarding_progress JSONB,
  feature_flags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_metadata_subscription_tier_check CHECK (subscription_tier IN ('free', 'paid')),
  CONSTRAINT user_metadata_subscription_status_check CHECK (subscription_status IN ('active', 'cancelled', 'past_due'))
);

-- Generated Assets table
CREATE TABLE IF NOT EXISTS public.generated_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  layout TEXT,
  style TEXT,
  settings JSONB,
  metadata JSONB,
  text_overlays JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS session_user_id_idx ON public.session(user_id);
CREATE INDEX IF NOT EXISTS session_token_idx ON public.session(token);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON public.account(user_id);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON public.verification(identifier);
CREATE INDEX IF NOT EXISTS generated_assets_user_id_created_at_idx ON public.generated_assets(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_profiles
DROP POLICY IF EXISTS "Users can view their own brand profile" ON public.brand_profiles;
CREATE POLICY "Users can view their own brand profile"
  ON public.brand_profiles FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can insert their own brand profile" ON public.brand_profiles;
CREATE POLICY "Users can insert their own brand profile"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can update their own brand profile" ON public.brand_profiles;
CREATE POLICY "Users can update their own brand profile"
  ON public.brand_profiles FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- RLS Policies for user_metadata
DROP POLICY IF EXISTS "Users can view their own metadata" ON public.user_metadata;
CREATE POLICY "Users can view their own metadata"
  ON public.user_metadata FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can insert their own metadata" ON public.user_metadata;
CREATE POLICY "Users can insert their own metadata"
  ON public.user_metadata FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can update their own metadata" ON public.user_metadata;
CREATE POLICY "Users can update their own metadata"
  ON public.user_metadata FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- RLS Policies for generated_assets
DROP POLICY IF EXISTS "Users can view their own assets" ON public.generated_assets;
CREATE POLICY "Users can view their own assets"
  ON public.generated_assets FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can insert their own assets" ON public.generated_assets;
CREATE POLICY "Users can insert their own assets"
  ON public.generated_assets FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Users can delete their own assets" ON public.generated_assets;
CREATE POLICY "Users can delete their own assets"
  ON public.generated_assets FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::text);
