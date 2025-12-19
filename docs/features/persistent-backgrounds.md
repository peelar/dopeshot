# Persistent Backgrounds Feature

## Overview

The persistent backgrounds feature enables users to select from predefined backgrounds and manage their own brand backgrounds. This feature provides two levels of background management:

1. **Preset Backgrounds** - Global backgrounds available to all users (free tier)
2. **Brand Backgrounds** - User-specific backgrounds for authenticated users (branded tier)

## Architecture

### Database Schema

#### `preset_backgrounds` Table
Stores global backgrounds managed by administrators:
- `id` (uuid, primary key)
- `name` (text) - Display name
- `description` (text, optional)
- `storage_path` (text) - Path in Supabase storage
- `thumbnail_path` (text, optional) - Optimized thumbnail
- `category` (text) - Category for filtering
- `tags` (text[]) - Searchable tags
- `is_active` (boolean) - Enable/disable without deletion
- `display_order` (integer) - Control display order
- Timestamps: `created_at`, `updated_at`

#### `brand_backgrounds` Table
Stores user-specific backgrounds:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `name` (text, optional)
- `storage_path` (text) - Path in Supabase storage
- `thumbnail_path` (text, optional)
- `file_size` (integer)
- `mime_type` (text)
- Timestamps: `created_at`, `updated_at`

### Storage Buckets

#### `preset-backgrounds`
- **Access**: Public read, admin-only write
- **Organization**: Flat structure with descriptive filenames
- **Format**: PNG, JPG, WebP
- **Size**: Optimized for web (< 500KB recommended)

#### `brand-backgrounds`
- **Access**: Public read (for sharing), user-specific write
- **Organization**: `{user_id}/background-{timestamp}.{ext}`
- **Format**: PNG, JPG, GIF, WebP, SVG
- **Size**: Up to 5MB per file

### API Endpoints

#### `GET /api/backgrounds/presets`
Fetch all active preset backgrounds.
- **Auth**: None required (public)
- **Response**: Array of preset backgrounds with public URLs
- **Cache**: Consider adding client-side caching

#### `GET /api/backgrounds/brand`
Fetch user's brand backgrounds.
- **Auth**: Required
- **Response**: Array of user's backgrounds with public URLs

#### `POST /api/backgrounds/brand`
Upload a new brand background.
- **Auth**: Required
- **Body**: FormData with `file` and optional `name`
- **Response**: Created background with public URL

#### `DELETE /api/backgrounds/brand?id={id}`
Delete a brand background.
- **Auth**: Required
- **Response**: Success status

## Frontend Components

### Core Components

#### `BackgroundSwatch`
Location: `src/components/selectors/background-swatch.tsx`

Displays a single background image in a grid.
- Similar to `GradientSwatch` for consistency
- Shows selection state with ring
- Optional remove button for brand backgrounds

#### `PresetBackgroundGrid`
Location: `src/components/selectors/preset-background-grid.tsx`

Grid display for preset backgrounds.
- 4-column grid layout
- Loading skeleton states
- Empty state messaging

#### `BrandBackgroundGrid`
Location: `src/components/selectors/brand-background-grid.tsx`

Grid display for user's brand backgrounds.
- 4-column grid layout
- Remove buttons (optional)
- Empty state with upload prompt

### Integration Points

#### Background Tab (Design Sidebar)
Location: `src/components/sidebar/background-section.tsx`

The Background tab now displays:
1. Upload section (existing functionality)
2. **"Your Backgrounds"** section (if logged in and has backgrounds)
3. **"Preset Backgrounds"** section

#### Brand Tab
Location: `src/components/brand/brand-panel.tsx`

New section added below logo management:
- **Brand Backgrounds** section
- Upload button
- Grid of uploaded backgrounds with remove capability
- Help text explaining usage

## Usage

### For Free Users
1. Navigate to **Design** > **Background** tab
2. Click **Image** to switch from gradients
3. Scroll down to see **Preset Backgrounds**
4. Click any preset to apply it to the canvas

### For Authenticated Users
1. Navigate to **Brand** tab to manage backgrounds:
   - Click **Add** to upload new backgrounds
   - Click backgrounds to preview/apply
   - Click **X** on hover to remove
2. Or use **Design** > **Background** tab:
   - See **Your Backgrounds** section
   - Click any brand background to apply
   - Also see preset backgrounds below

## Analytics Events

The feature tracks the following events:

- `preset_background_selected` - When user selects a preset
  - Properties: `preset_id`, `preset_name`

- `brand_background_uploaded` - When user uploads a background
  - Properties: `file_size_kb`

- `brand_background_selected` - When user selects from Brand tab
  - Properties: `background_id`

- `brand_background_selected_from_design_tab` - When user selects from Design tab
  - Properties: `background_id`

- `brand_background_deleted` - When user removes a background
  - Properties: `background_id`

## Migration Guide

### Running Migrations

1. Apply database migrations:
```bash
# Migration 1: Tables and triggers
supabase db push
# Files: supabase/migrations/20250101T000000_background_persistence.sql
#        supabase/migrations/20250101T000001_background_storage.sql
```

2. Verify storage buckets were created:
```bash
supabase storage list
# Should show: preset-backgrounds, brand-backgrounds
```

### Seeding Preset Backgrounds

To add preset backgrounds for users:

1. Upload images to `preset-backgrounds` bucket (requires service role):
```typescript
await supabaseAdmin.storage
  .from('preset-backgrounds')
  .upload('nature-sunset.jpg', fileBuffer)
```

2. Insert database records:
```sql
INSERT INTO preset_backgrounds (
  name,
  description,
  storage_path,
  category,
  tags,
  display_order
) VALUES (
  'Nature Sunset',
  'Beautiful sunset over mountains',
  'nature-sunset.jpg',
  'nature',
  ARRAY['sunset', 'mountains', 'nature'],
  1
);
```

3. Or use the admin API (to be implemented):
```bash
POST /api/admin/backgrounds/presets
```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:

**preset_backgrounds**:
- Public can read active presets
- Only service role can write/update

**brand_backgrounds**:
- Users can only access their own backgrounds
- Service role has full access

**Storage Policies**:
- `preset-backgrounds`: Public read, admin write
- `brand-backgrounds`: Public read, user-folder write

### File Upload Validation

- Max file size: 5MB
- Allowed types: image/*
- Sanitized file extensions
- User-scoped storage paths

## Testing

### Manual Testing Checklist

- [ ] Free user can see preset backgrounds
- [ ] Free user can select preset backgrounds
- [ ] Logged-in user can upload brand backgrounds
- [ ] Logged-in user can see brand backgrounds in both tabs
- [ ] Logged-in user can select brand backgrounds
- [ ] Logged-in user can delete brand backgrounds
- [ ] Background selection updates canvas
- [ ] Analytics events fire correctly
- [ ] Loading states display properly
- [ ] Error states display properly

### Unit Tests

Consider adding tests for:
- Background hooks (`use-backgrounds`)
- API routes (presets, brand CRUD)
- Component rendering and interactions

## Future Enhancements

- [ ] Thumbnail generation for faster loading
- [ ] Background categories and filtering
- [ ] Search functionality
- [ ] Drag-and-drop upload
- [ ] Batch upload
- [ ] Background templates/variations
- [ ] Public sharing of brand backgrounds
- [ ] Usage limits for free tier
- [ ] CDN integration for preset backgrounds
- [ ] Image optimization on upload
