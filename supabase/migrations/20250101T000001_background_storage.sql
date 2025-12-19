-- Storage buckets and policies for background images

-- Create storage buckets
insert into storage.buckets (id, name, public)
values
  ('preset-backgrounds', 'preset-backgrounds', true),
  ('brand-backgrounds', 'brand-backgrounds', true)
on conflict (id) do nothing;

--
-- Preset Backgrounds Bucket Policies
-- Public read, admin-only write
--
create policy "Public can read preset backgrounds"
  on storage.objects for select
  using (bucket_id = 'preset-backgrounds');

create policy "Service role can upload preset backgrounds"
  on storage.objects for insert
  with check (bucket_id = 'preset-backgrounds');

create policy "Service role can update preset backgrounds"
  on storage.objects for update
  using (bucket_id = 'preset-backgrounds');

create policy "Service role can delete preset backgrounds"
  on storage.objects for delete
  using (bucket_id = 'preset-backgrounds');

--
-- Brand Backgrounds Bucket Policies
-- Public read (for sharing), user-specific write
--
create policy "Public can read brand backgrounds"
  on storage.objects for select
  using (bucket_id = 'brand-backgrounds');

create policy "Users can upload to their own folder in brand backgrounds"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own brand backgrounds"
  on storage.objects for update
  using (
    bucket_id = 'brand-backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own brand backgrounds"
  on storage.objects for delete
  using (
    bucket_id = 'brand-backgrounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
