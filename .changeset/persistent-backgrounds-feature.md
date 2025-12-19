---
"dopeshot": minor
---

Add persistent background management system with preset and brand backgrounds

- **Preset Backgrounds**: Free users can now select from a list of predefined backgrounds displayed in a gradient-style grid
- **Brand Backgrounds**: Logged-in users can upload and manage their own collection of brand backgrounds
- **Background Tab**: Shows preset backgrounds for all users, and brand backgrounds for authenticated users with clear distinction
- **Brand Tab**: New section for managing brand backgrounds with upload, preview, and delete capabilities
- **Database**: New tables for `preset_backgrounds` (global) and `brand_backgrounds` (user-specific)
- **Storage**: New Supabase storage buckets with proper RLS policies for background images
- **API**: RESTful endpoints for fetching presets and managing brand backgrounds (GET/POST/DELETE)
- **Analytics**: Comprehensive tracking for background selection and upload events
