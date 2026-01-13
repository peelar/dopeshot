-- Storage policies for brand-logos bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own logos
CREATE POLICY "Users can read their own logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
