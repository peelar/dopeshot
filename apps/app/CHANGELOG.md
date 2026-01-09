# dopeshot

## 0.5.6

### Patch Changes

- 6659837: Fix 'Saved' button visibility in dark mode and ensure state updates immediately after saving a design.
- 5cce7c2: Fix stale saved designs count after login by removing localStorage caching

  Previously, memory items were cached in localStorage, causing stale data to appear after logout/login cycles. This fix:

  - Removes all localStorage caching for memory items
  - Uses hard navigation after login to ensure Jotai atoms reset
  - Relies on server-side `use cache` for caching instead

  The server cache (`getCachedMemoryItems` with `use cache` directive) handles caching, while `revalidateTag` properly invalidates on save/delete.

## 0.5.5

### Patch Changes

- 5ca880e: Fix update banner styling in dark mode to use consistent primary color scheme across both themes
- 32dc748: Fix "Request Entity Too Large" error when saving designs by compressing screenshot images before upload to stay under Vercel's 4.5MB payload limit. Includes fallback for older browsers that don't support OffscreenCanvas/createImageBitmap APIs.
- 0ffc561: Add automated database migrations in CI. Migrations now run automatically when release PRs merge, before Vercel deploys.

## 0.3.1

### Patch Changes

- b5b8c85: Fix screenshot scaling in backdrop layouts and allow full zoom range.
- 74e19b5: Improve asset upload UI in sidebar: truncate long file names to 8rem max-width for better readability, hide upload icon when logo is uploaded to reduce visual clutter, and remove brand logo toggle for simplified workflow.
- d3c9416: Increase dropdown menu sizes for better mobile usability. Font style and asset type (screenshot/code) selectors now have wider dropdowns, larger touch targets, and improved text readability on mobile devices.

## 0.3.0

### Minor Changes

- 56899b3: Add persistent background libraries with presets and personal uploads
  - Add background domain models, storage helpers, and API routes
  - Persist background selections for branded and logged-in users
  - Update background sidebar to manage presets and personal libraries

## 0.2.0

### Minor Changes

- 3a49e81: Generate distinctive gradients for monochromatic palettes using color theory harmonies

  When a screenshot has limited colors (e.g., orange + white), gradient generation now creates 4 visually distinct options instead of 4 similar variations:

  - Gradient 1: Lightness variation (original color)
  - Gradient 2: Complementary (180° hue rotation)
  - Gradient 3: Triadic (120° hue rotation)
  - Gradient 4: Split-complementary (150° hue rotation)

- 03b7d46: Migrate database layer from Supabase client to Prisma ORM
  - Added Prisma ORM with external tables support for better-auth integration
  - Created type-safe database schema with JSON field validation using Zod
  - Implemented Data Access Layer (DAL) with automatic user-scoped authorization
  - Migrated all brand API routes to use Prisma for database operations
  - Maintained Supabase Storage integration for file uploads
  - Added database hooks for automatic brand profile and user metadata creation
  - Replaced non-null assertions with tiny-invariant for better runtime safety

### Patch Changes

- 833c92c: CRITICAL SECURITY FIX: Fix authentication and data leakage vulnerabilities + Prisma 7 adapter configuration

  Fixed two catastrophic P0 security vulnerabilities where React's cache() memoization without arguments caused authentication state and database clients to be shared across all users:

  **Authentication Bypass (P0 - CRITICAL)**

  - verifySession() cached the first user's authentication state and returned it to all subsequent users
  - Any user making a request would be authenticated as the first logged-in user
  - Fixed by removing cache() wrapper entirely - authentication must never be cached without request-specific keys

  **Data Access Layer Leakage (P0 - CRITICAL)**

  - getUserDb() cached the first user's Prisma client and returned it to all subsequent users
  - Users could read/write other users' data through the shared database client
  - Fixed by adding userId parameter to create unique cache keys per user

  **Feature Flag Enforcement**

  - Brand-related UI features are now properly hidden behind showBrandExperienceFlag (dev only)
  - Disabled database queries for brand features when flag is off
  - Updated useBrandLogoAutoApply hook to respect feature flag

  **Prisma 7 Configuration**

  - Added @prisma/adapter-pg and pg driver for PostgreSQL adapter support (required in Prisma 7)
  - Configured PrismaClient with PrismaPg adapter for direct database connections
  - Resolved build errors related to missing adapter configuration

  Changes:

  - Removed cache() from verifySession() - authentication is now verified per-request
  - Updated getUserDb() to accept userId as argument, creating proper cache keys
  - Updated all data access functions (getBrandProfile, getUserMetadata, getGeneratedAssets) to accept userId
  - Updated all API route callers to pass userId explicitly
  - Added `enabled` parameter to useBrandLogoAutoApply hook
  - Installed @prisma/adapter-pg and pg packages
  - Configured Prisma client with PostgreSQL adapter
  - Each user now gets isolated authentication state and database client

- 200cdc8: Fix Prisma configuration and type safety:
  - Add postinstall script to generate Prisma client in CI/deployments
  - Remove DATABASE_URL invariant check from prisma.config.ts that was blocking client generation in CI (validation now happens at runtime when connecting)
  - Use Prisma.defineExtension for automatic type inference in Client Extensions, eliminating implicit any types
  - Replace unsafe `as any` casts with type-safe Record<string, unknown> assertions
  - Fix prisma.config.ts to conditionally load .env.local (development) while allowing environment variables to be injected in production deployments

## 0.1.2

### Patch Changes

- aabd6d1: Align buttons and typography with the Shadcn theme, including the export CTA styling and subtle header accent.

## 0.1.1

### Patch Changes

- e7f5f91: Set up changesets release workflow and Vercel deploy hook automation.
