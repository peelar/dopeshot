-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create minimal auth tables needed by better-auth
CREATE TABLE IF NOT EXISTS auth.user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS auth.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Create indexes for better-auth tables
CREATE INDEX IF NOT EXISTS session_user_id_idx ON auth.session(user_id);
CREATE INDEX IF NOT EXISTS session_token_idx ON auth.session(token);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON auth.account(user_id);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON auth.verification(identifier);
