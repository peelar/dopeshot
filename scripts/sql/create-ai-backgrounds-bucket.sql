-- Create AI backgrounds storage bucket (manual run in staging/prod)
-- Option B: direct insert into storage.buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-backgrounds',
  'ai-backgrounds',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;
