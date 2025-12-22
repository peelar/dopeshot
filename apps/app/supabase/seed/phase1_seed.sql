-- Seed script for curated preset backgrounds only.
-- Curated preset backgrounds (stored in Supabase bucket: curated-backgrounds root).
-- Use bucket-relative paths (no folder prefix).
insert into public.preset_backgrounds (
  id,
  name,
  description,
  storage_path,
  preview_url,
  is_active,
  sort_order,
  created_at,
  updated_at
)
values
  ('preset-1', 'Preset 1', null, '1.png', '1.png', true, 1, now(), now()),
  ('preset-2', 'Preset 2', null, '2.png', '2.png', true, 2, now(), now()),
  ('preset-3', 'Preset 3', null, '3.png', '3.png', true, 3, now(), now()),
  ('preset-4', 'Preset 4', null, '4.png', '4.png', true, 4, now(), now()),
  ('preset-5', 'Preset 5', null, '5.png', '5.png', true, 5, now(), now()),
  ('preset-6', 'Preset 6', null, '6.png', '6.png', true, 6, now(), now()),
  ('preset-7', 'Preset 7', null, '7.png', '7.png', true, 7, now(), now()),
  ('preset-8', 'Preset 8', null, '8.png', '8.png', true, 8, now(), now()),
  ('preset-9', 'Preset 9', null, '9.png', '9.png', true, 9, now(), now()),
  ('preset-10', 'Preset 10', null, '10.png', '10.png', true, 10, now(), now());
