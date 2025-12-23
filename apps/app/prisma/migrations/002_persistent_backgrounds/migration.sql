create table if not exists public.preset_backgrounds (
  id text primary key,
  name text not null,
  description text,
  storage_path text not null,
  preview_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_backgrounds (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  storage_path text not null,
  preview_url text not null,
  file_size_kb integer not null,
  width_px integer not null,
  height_px integer not null,
  file_format text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_backgrounds_user_id_idx on public.personal_backgrounds(user_id);

alter table public.personal_backgrounds enable row level security;

create policy "Owners can select personal backgrounds"
  on public.personal_backgrounds
  for select
  using (user_id = auth.uid());

create policy "Owners can insert personal backgrounds"
  on public.personal_backgrounds
  for insert
  with check (user_id = auth.uid());

create policy "Owners can update personal backgrounds"
  on public.personal_backgrounds
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Owners can delete personal backgrounds"
  on public.personal_backgrounds
  for delete
  using (user_id = auth.uid());

create table if not exists public.background_selections (
  id text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  background_type text not null,
  background_id text not null,
  updated_at timestamptz not null default now()
);
