-- Seed script for Phase 1 Supabase foundation.
-- Instructions:
--   1. Create a test user manually via Supabase Auth (email/password) and copy the generated id.
--   2. Replace `{{TEST_USER_ID}}` below with the real UUID.
--   3. Upload the sample logo and generated assets into the storage buckets (paths shown).

-- Replace this placeholder with the user id from Supabase Auth.
-- Example: \set TEST_USER_ID 'a3b1b7f2-7edc-4b73-9d2b-758c7a9c2d3e'
-- In Supabase SQL editor you can define a variable, or simply replace the placeholder before running.
--
-- ------------------------------------------------------------------

-- Brand profile enrichment (updates record created by trigger on signup)
-- Does not create a new row; it populates the profile for our test user.
update public.brand_profiles
set
  name = 'dopeshot test brand',
  color_palette = '["#FF3D81", "#0ACFFC", "#FFD166", "#2B2E4A", "#D1E8E2"]',
  typography = jsonb_build_object('heading', 'SpaceGrotesk', 'body', 'Inter'),
  logo_path = concat('brand-logos/', '{{TEST_USER_ID}}', '/logo-sample.png'),
  updated_at = now()
where user_id = '{{TEST_USER_ID}}';

-- Update metadata to record usage and feature flags for the seed user.
update public.user_metadata
set
  subscription_tier = 'free',
  subscription_status = 'active',
  onboarding_progress = jsonb_build_array('brand_identity', 'layouts'),
  usage = jsonb_build_object('exports_this_month', 2),
  feature_flags = jsonb_build_object('early_access', true, 'grid_view', true),
  updated_at = now()
where user_id = '{{TEST_USER_ID}}';

-- Sample generated assets history. Adjust file paths to match actual uploads.
insert into public.generated_assets (user_id, storage_path, settings, orientation, text_overlays, metadata, is_public)
values
  (
    '{{TEST_USER_ID}}',
    concat('generated-assets/', '{{TEST_USER_ID}}', '/asset-dawn.png'),
    jsonb_build_object(
      'layout', 'Peak',
      'style_flags', jsonb_build_object('gradient', 'sunrise', 'glassmorphism', true),
      'orientation', 'landscape',
      'text_overlays', jsonb_build_array(
        jsonb_build_object('text', 'Launch Day', 'font', 'SpaceGrotesk Bold'),
        jsonb_build_object('text', 'dopeshot.com', 'font', 'Inter')
      )
    ),
    'landscape',
    jsonb_build_array(
      jsonb_build_object('text', 'Launch Day', 'font', 'SpaceGrotesk Bold'),
      jsonb_build_object('text', 'dopeshot.com', 'font', 'Inter')
    ),
    jsonb_build_object('file_size', 257_984, 'width', 1920, 'height', 1080),
    true
  ),
  (
    '{{TEST_USER_ID}}',
    concat('generated-assets/', '{{TEST_USER_ID}}', '/asset-city.png'),
    jsonb_build_object(
      'layout', 'Spotlight',
      'style_flags', jsonb_build_object('contrast', 'high', 'bg_noise', true),
      'orientation', 'portrait',
      'text_overlays', jsonb_build_array(
        jsonb_build_object('text', 'City Mode', 'font', 'Comet'),
        jsonb_build_object('text', 'New look', 'font', 'Inter')
      )
    ),
    'portrait',
    jsonb_build_array(
      jsonb_build_object('text', 'City Mode', 'font', 'Comet'),
      jsonb_build_object('text', 'New look', 'font', 'Inter')
    ),
    jsonb_build_object('file_size', 301_120, 'width', 1080, 'height', 1920),
    false
  ),
  (
    '{{TEST_USER_ID}}',
    concat('generated-assets/', '{{TEST_USER_ID}}', '/asset-focus.png'),
    jsonb_build_object(
      'layout', 'Backdrop',
      'style_flags', jsonb_build_object('soft_shadow', true, 'blur_strength', 'low'),
      'orientation', 'landscape',
      'text_overlays', jsonb_build_array(
        jsonb_build_object('text', 'Focus Mode', 'font', 'SpaceGrotesk Light')
      )
    ),
    'landscape',
    jsonb_build_array(
      jsonb_build_object('text', 'Focus Mode', 'font', 'SpaceGrotesk Light')
    ),
    jsonb_build_object('file_size', 198_560, 'width', 1920, 'height', 1080),
    true
  );
