-- Background Persistence Migration
--
-- This migration adds support for:
--   1. Preset backgrounds (global, admin-managed) for free users
--   2. Brand backgrounds (user-specific) for branded/paid users
--   3. Storage buckets and policies for background images

--
-- Preset Backgrounds (Global)
-- Admin uploads these backgrounds that are available to all users
--
create table if not exists public.preset_backgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  storage_path text not null unique,
  thumbnail_path text,
  category text default 'general',
  tags text[] default array[]::text[],
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No RLS needed - public read access
alter table public.preset_backgrounds enable row level security;

create policy "Anyone can read active preset backgrounds"
  on public.preset_backgrounds
  for select
  using (is_active = true);

-- Only admins can manage preset backgrounds (via service role)

--
-- Brand Backgrounds (User-specific)
-- Authenticated users can upload their own collection of brand backgrounds
--
create table if not exists public.brand_backgrounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  storage_path text not null,
  thumbnail_path text,
  file_size integer,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_backgrounds enable row level security;

create policy "Owners can select their brand backgrounds"
  on public.brand_backgrounds
  for select
  using (user_id = auth.uid());

create policy "Owners can insert brand backgrounds"
  on public.brand_backgrounds
  for insert
  with check (user_id = auth.uid());

create policy "Owners can update their brand backgrounds"
  on public.brand_backgrounds
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Owners can delete their brand backgrounds"
  on public.brand_backgrounds
  for delete
  using (user_id = auth.uid());

--
-- Triggers
--
create or replace function public.preset_backgrounds_update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_preset_background_timestamp on public.preset_backgrounds;
create trigger set_preset_background_timestamp
  before update on public.preset_backgrounds
  for each row execute function public.preset_backgrounds_update_timestamp();

create or replace function public.brand_backgrounds_update_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_brand_background_timestamp on public.brand_backgrounds;
create trigger set_brand_background_timestamp
  before update on public.brand_backgrounds
  for each row execute function public.brand_backgrounds_update_timestamp();

--
-- Indexes
--
create index if not exists idx_preset_backgrounds_active_order
  on public.preset_backgrounds (is_active, display_order);

create index if not exists idx_brand_backgrounds_user_created
  on public.brand_backgrounds (user_id, created_at desc);
