---
"dopeshot-app": patch
---

**Brand Logo Improvements:**
- Fixed brand tier checking inconsistencies - brand users can now properly upload and delete logos
- Added `brand-logos` storage bucket with proper RLS policies (requires manual SQL setup)
- Added subtle loading state during logo upload in Brand tab
- Logo no longer auto-applies to canvas - user must toggle "Apply to all screenshots"
- Fixed "Apply to all screenshots" persistence - setting now persists across page reloads
- Updated auto-apply hook to use API route instead of direct Supabase client for better compatibility
- Improved brand logo UI in Design sidebar - when brand logo is applied, shows "Brand logo" text instead of filename
- Brand logo can be removed from current design by hovering over "Brand logo" text and clicking the "X Remove" button
- Users can opt-out of "Apply to all screenshots" for specific designs by removing the brand logo
- No extra UI bloat - brand logo integrates cleanly into existing Logo section header button
- Standardized logo sizing: max height 32px (h-8), max width 200px, maintains aspect ratio
- Unified all tier checks to use `isBrandUser()` checking `subscriptionTier === "brand"`
