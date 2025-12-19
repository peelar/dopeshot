# Supabase Phase 1 (dopeshot)

This document explains how to wire Supabase into dopeshot’s persistence layer, covering project configuration, schema, storage, access controls, triggers, and seeds. The migration under `apps/app/supabase/migrations/20240401T000000_init.sql` implements the SQL described below.

## 1. Project setup checklist

1. **Create a Supabase project named `dopeshot`** and take note of the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` shown under Settings → API. Store them securely (e.g. GitHub secrets or `.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key
   SUPABASE_SERVICE_ROLE_KEY=service-role-key
   ```
2. **Enable Email/Password auth** under Authentication → Settings → External OAuth Providers → Password, then leave OAuth providers off for now.
3. **Create the database schema** by running the migration file (`apps/app/supabase/migrations/20240401T000000_init.sql`) via the Supabase SQL editor or `supabase` CLI.
4. **Enable RLS** on the tables (`brand_profiles`, `generated_assets`, `user_metadata`) — the migration already includes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and policy creation.

## 2. Schema overview

| Table | Purpose | Key Columns |
|---|---|---|
| `brand_profiles` | One profile per user storing brand identity | `user_id`, `color_palette` (JSONB array), `typography` (JSONB object), `logo_path`, timestamps |
| `generated_assets` | History of generated screenshots | `user_id`, `storage_path`, `settings` (JSONB snapshot), `metadata` (size/dimensions), `is_public`, `created_at` |
| `user_metadata` | Subscription and onboarding state | `subscription_tier`, `subscription_status`, `onboarding_progress`, `usage`, `feature_flags` |

All primary keys are UUIDs generated with `gen_random_uuid()`. `settings` stores layout, style toggles, orientation, and overlays as JSON for flexibility.

## 3. Storage buckets

| Bucket | Access | Notes |
| --- | --- | --- |
| `brand-logos` | **Private:** owner-only read/write | Stores logos at `brand-logos/{user_id}/logo-{timestamp}.{ext}`. Enforce max size 5MB and allow `.png`, `.jpg`, `.svg`. |
| `generated-assets` | **Public read:** uploads scoped to owner | Stores assets at `generated-assets/{user_id}/{asset_id}.png`. Assets can be shared via `generated_assets.is_public`. |

### Bucket policies (run in SQL editor)

```sql
alter table storage.objects enable row level security;

create policy "Users can manage their logos"
  on storage.objects
  for all
  using (
    bucket_id = 'brand-logos'
    and split_part(name, '/', 1) = auth.uid()
  );

create policy "Users can upload their assets"
  on storage.objects
  for insert
  using (
    bucket_id = 'generated-assets'
    and split_part(name, '/', 1) = auth.uid()
  );

create policy "Public can read generated assets"
  on storage.objects
  for select
  using (bucket_id = 'generated-assets');

create policy "Owners can read their logos"
  on storage.objects
  for select
  using (
    bucket_id = 'brand-logos'
    and split_part(name, '/', 1) = auth.uid()
  );
```

Adjust these policies if you later add metadata fields (e.g. storing `user_id` inside `metadata`). The `generated-assets` bucket is public so marketing assets can be shared immediately.

## 4. Row Level Security (RLS)

RLS policies in the migration ensure:

- **brand_profiles:** only the owning user can `SELECT`, `INSERT`, or `UPDATE` a profile.
- **generated_assets:** owners can `SELECT`, `INSERT`, `UPDATE`, `DELETE`. Public selects are allowed for rows where `is_public = true`.
- **user_metadata:** owners can `SELECT`, `INSERT`, `UPDATE`. The service role bypasses RLS automatically, so server-side cron jobs or functions can inspect all rows.

Public unauthenticated requests will fail if they try to read another user’s data because `auth.uid()` will be `null` and no policy will match. To verify RLS:

```sql
-- Simulate cross-user select (should return 0 rows)
select * from public.generated_assets
where user_id != '00000000-0000-0000-0000-000000000000';
```

Try this from a non-owner service account or the Supabase Row Level Security simulator in the SQL editor.

## 5. Triggers

- `bootstrap_user_records` (trigger on `auth.users`): inserts empty entries for `brand_profiles` and `user_metadata` when a user signs up, ensuring onboarding data exists.
- `brand_profiles_update_timestamp` (trigger on `brand_profiles`): keeps `updated_at` synced whenever the profile changes.

Both triggers are defined and activated in the migration file, so running it is enough to get automated bookkeeping started.

## 6. Seed data & sample assets

Use the seed script at `apps/app/supabase/seed/phase1_seed.sql`. Steps:

1. Create a test user via Authentication → Users and copy the UUID.
2. Replace `{{TEST_USER_ID}}` throughout the seed file with that UUID.
3. Upload sample files:
   - Logo: `brand-logos/{user_id}/logo-sample.png` (≤ 5MB, PNG/JPG/SVG).
   - Assets: `generated-assets/{user_id}/asset-dawn.png`, `-city.png`, `-focus.png`.
4. Run the seed file in the SQL editor to update the profile and insert asset metadata.

The script populates palette, typography, metadata, usage counts, and three sample history items (two marked public). The actual image files must be uploaded separately via the Storage UI, CLI, or SDK so their paths exist.

## 7. Testing & verification

1. **RLS checks:** Audit `brand_profiles`, `generated_assets`, and `storage.objects` policies to ensure only `auth.uid()` matches the owner (except the public asset policy).
2. **Seed user inspection:** Log in as the test user and confirm the brand profile is not empty and the generated assets can be queried via GraphQL/Client SDK.
3. **Onboarding flow:** Since triggers pre-create profile/metadata, onboarding code only has to `UPDATE` existing rows. You can assert this by selecting `brand_profiles` immediately after signup to verify the row exists.

## 8. Frontend auth wiring

Auth is now surfaced on its own page rather than in a sidebar sheet:

- `SupabaseAuthProvider` in `apps/app/src/app/layout.tsx` keeps the client-side session in sync via `@supabase/supabase-js`.
- `apps/app/src/app/auth/page.tsx` renders `apps/app/src/components/auth/auth-form.tsx`, which shows the segmented Sign in / Create account form and a post-login sign-out surface.
- Verify you’ve set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (see `apps/app/.env.example`) so the UI can reach the auth endpoint.

This wiring keeps dopeshot’s persistence and UI aligned for Phase 1, so every new signup immediately provisions a brand profile and metadata row via the triggers.

## 9. Next steps

1. Wire the frontend to the new tables using Supabase JS (`brand_profiles`, `generated_assets`, `user_metadata`).
2. Hook up storage uploads to the specified bucket paths and reuse `storage_path` to link assets to metadata.
3. Add subscription webhooks to update `user_metadata.subscription_tier` and `subscription_status`.

For reminders about bucket names (`brand-logos`, `generated-assets`), the migration and this documentation are the single source of truth.
