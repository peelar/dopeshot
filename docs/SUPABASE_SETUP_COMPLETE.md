# Supabase Setup Complete ✅

## Project Details

- **Project Name:** dopeshot
- **Project ID:** `xgvseaushfumwnvkhdyx`
- **Project URL:** `https://xgvseaushfumwnvkhdyx.supabase.co`
- **Region:** `us-east-1`
- **Status:** ACTIVE_HEALTHY

## Environment Variables

Add these to your `apps/app/.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xgvseaushfumwnvkhdyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnNlYXVzaGZ1bXdudmtoZHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDE3MTksImV4cCI6MjA4MTQ3NzcxOX0.yVeDurFy5ArvY1Xuq_ku7CXwDMGWV26smyo6ThT-yrI
SUPABASE_SERVICE_ROLE_KEY=<get-from-dashboard>
```

**⚠️ Important:** The `SUPABASE_SERVICE_ROLE_KEY` must be retrieved from the Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/xgvseaushfumwnvkhdyx
2. Navigate to Settings → API
3. Copy the `service_role` key (keep this secret!)

## What's Been Set Up

### ✅ Database Schema
- `brand_profiles` table with RLS policies
- `generated_assets` table with RLS policies  
- `user_metadata` table with RLS policies
- All tables have proper indexes and foreign key constraints

### ✅ Database Triggers
- `bootstrap_user_records()` - Automatically creates brand_profile and user_metadata when a user signs up
- `brand_profiles_update_timestamp()` - Automatically updates `updated_at` timestamp

### ✅ Storage Buckets
- `brand-logos` (private) - For user logo uploads
- `generated-assets` (public) - For generated screenshot assets

### ✅ Storage Policies
- Users can manage their own logos in `brand-logos/{user_id}/`
- Users can upload/manage their own assets in `generated-assets/{user_id}/`
- Public read access for `generated-assets` bucket (for sharing)

### ✅ Security
- All RLS policies configured and tested
- Function search_path security issues resolved
- No security warnings remaining

## Migrations Applied

1. `init` - Initial schema with tables, policies, and triggers
2. `fix_function_search_path` - Security hardening for functions

## Next Steps

1. **Add Service Role Key:** Get the service role key from the dashboard and add it to `apps/app/.env.local`

2. **Test Authentication:** 
   - Create a test user via the Supabase Dashboard (Authentication → Users)
   - Or use the auth UI in the app to sign up

3. **Verify Setup:**
   - Sign up a new user
   - Check that `brand_profiles` and `user_metadata` rows are automatically created (via trigger)
   - Test uploading a logo to `brand-logos` bucket
   - Test uploading a generated asset to `generated-assets` bucket

4. **Seed Data (Optional):**
   - See `apps/app/supabase/seed/phase1_seed.sql` for sample data
   - Create a test user first, then replace `{{TEST_USER_ID}}` in the seed file
   - Upload sample logo and assets to storage buckets
   - Run the seed SQL in the Supabase SQL editor

## Dashboard Access

- **Project Dashboard:** https://supabase.com/dashboard/project/xgvseaushfumwnvkhdyx
- **SQL Editor:** https://supabase.com/dashboard/project/xgvseaushfumwnvkhdyx/sql
- **Storage:** https://supabase.com/dashboard/project/xgvseaushfumwnvkhdyx/storage/buckets
- **Auth:** https://supabase.com/dashboard/project/xgvseaushfumwnvkhdyx/auth/users

## Bucket Configuration

### brand-logos
- **Access:** Private (owner-only)
- **Max File Size:** 5MB
- **Allowed Types:** PNG, JPG, SVG
- **Path Pattern:** `brand-logos/{user_id}/logo-{timestamp}.{ext}`

### generated-assets
- **Access:** Public read, owner write
- **Max File Size:** No limit
- **Allowed Types:** PNG
- **Path Pattern:** `generated-assets/{user_id}/{asset_id}.png`

---

Setup completed on: 2025-12-16
