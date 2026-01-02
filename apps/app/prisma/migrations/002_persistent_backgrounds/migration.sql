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
  user_id text not null references public.user(id) on delete cascade,
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

create table if not exists public.background_selections (
  id text primary key,
  user_id text not null unique references public.user(id) on delete cascade,
  background_type text not null,
  background_id text not null,
  updated_at timestamptz not null default now()
);
