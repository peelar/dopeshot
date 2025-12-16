- -- Supabase Phase 1 foundational schema for dopeshot
--
-- This migration defines the tables, policies, and triggers required to:
--   1. Persist brand profiles and generated assets per user.
--   2. Track subscription tiers, onboarding progress, and usage.
--   3. Enforce row level security so users only access their own data.
--   4. Automate profile/metadata bootstrapping on signup and keep timestamps current.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

--
-- Brand Profiles
--
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text,
  color_palette jsonb not null default '[]'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_profiles enable row level security;

create policy "Owners can select brand profile"
  on public.brand_profiles
  for select
  using (user_id = auth.uid());

create policy "Owners can insert brand profile"
  on public.brand_profiles
  for insert
  with check (user_id = auth.uid());

create policy "Owners can update brand profile"
  on public.brand_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

--
-- Generated Assets
--
create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  settings jsonb not null,
  orientation text,
  text_overlays jsonb default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.generated_assets enable row level security;

create policy "Owners can select assets"
  on public.generated_assets
  for select
  using (user_id = auth.uid());

create policy "Public can read shared assets"
  on public.generated_assets
  for select
  using (is_public = true);

create policy "Owners can insert assets"
  on public.generated_assets
  for insert
  with check (user_id = auth.uid());

create policy "Owners can update assets"
  on public.generated_assets
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Owners can delete assets"
  on public.generated_assets
  for delete
  using (user_id = auth.uid());

--
-- User Metadata
--
create table if not exists public.user_metadata (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'active',
  onboarding_progress jsonb not null default '[]'::jsonb,
  usage jsonb not null default jsonb_build_object('exports_this_month', 0),
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subscription_tier in ('free', 'paid')),
  check (subscription_status in ('active', 'cancelled', 'past_due'))
);

alter table public.user_metadata enable row level security;

create policy "Owners can select metadata"
  on public.user_metadata
  for select
  using (user_id = auth.uid());

create policy "Owners can insert metadata"
  on public.user_metadata
  for insert
  with check (user_id = auth.uid());

create policy "Owners can update metadata"
  on public.user_metadata
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

--
-- Triggers
--
create function if not exists public.brand_profiles_update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_brand_profile_timestamp on public.brand_profiles;
create trigger set_brand_profile_timestamp
  before update on public.brand_profiles
  for each row execute function public.brand_profiles_update_timestamp();

create function if not exists public.bootstrap_user_records()
returns trigger as $$
begin
  insert into public.brand_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_metadata (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql;

drop trigger if exists create_brand_profile_on_signup on auth.users;
create trigger create_brand_profile_on_signup
  after insert on auth.users
  for each row execute function public.bootstrap_user_records();

--
-- Indexes & Helpers
--
create index if not exists idx_generated_assets_user_created
  on public.generated_assets (user_id, created_at desc);
