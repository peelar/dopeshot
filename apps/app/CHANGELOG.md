# dopeshot

## 0.11.0

### Minor Changes

- d269b22: Make the editor fully client-side: remove accounts, billing, cloud persistence, in-app feedback, and the product-update banner. Testimonials, tweets, video, Brand settings, and catalog backgrounds are available without login. Brand settings stay in the browser.
- 1e8a60d: Add video export for Peak layouts with orientation-aware dimensions and layout-specific animations
- 616f5b6: Add Twitter Testimonial layout: paste a tweet URL to auto-generate a styled testimonial card with brand personality.

### Patch Changes

- ff40b84: Upgrade screenshot/frame shadows to a layered depth model with background-aware tinting.

  - Replace single-layer `low|medium|high` shadows with multi-layer contact + ambient stacks for more realistic elevation
  - Apply surface-aware tinting so shadows adapt to the active background color instead of always reading as pure black
  - Update screenshot frame fallback shadows to use the shared layered shadow system
  - Add focused tests for shadow layering, tint behavior, and zero-shadow personality cases
  - Add research documentation for findings, performance considerations, and rollout recommendations

## 0.10.1

### Patch Changes

- 92e9eb6: Hide Design button on mobile when there's nothing to customize (e.g., Peak Left/Right layouts with no text fields)
- e8915f8: Fix default border radius from 16px to 8px and clear brand settings on logout so logged-out users get default styling
- 4f8ce67: Improve the mobile empty state layout, hide action controls until a format is chosen, and update the sidebar drawer styling.
- 5f6c77e: Restore the logged-out top-nav `Change screenshot` action so the secondary CTA and refresh icon resurface for demo visitors.
- d5385af: Apply brand logos automatically for testimonial layouts when auto-apply is enabled, not only screenshot layouts. Update the brand panel copy to reflect that the setting applies across assets, and add regression coverage for testimonial auto-apply behavior.

## 0.10.0

### Minor Changes

- f1d8f06: Add Testimonial format - the first non-screenshot layout type. Includes three variants (Centered, Card, Editorial) with author fields, star rating, and avatar upload. Testimonials are gated to signed-in users. Format tabs in the layout selector allow switching between Screenshot and Testimonial formats.

### Patch Changes

- 3a694ce: Move AI backgrounds visibility to dev flag. AI backgrounds are now always off in production and controllable via NEXT_PUBLIC_SHOW_AI_BACKGROUNDS env var in local development.
- fc87954: Fix the left sidebar Brand tab tooltip so it shows on hover instead of appearing constantly. Also fixes `InAppHint` to respect its controlled `open` state.

## 0.9.1

### Patch Changes

- 2411115: Fix image export failures when layouts include signed logo URLs by avoiding cache-busting on signed assets.

## 0.9.0

### Minor Changes

- ca9e6e7: Move the "brand" tab into the new left sidebar with other logged-in-user related tabs (like billing, account, saved).
- 76f1059: Complete OKLCH-based gradient generation pipeline

  New gradient pipeline with 6 visually distinct gradient types (each uses different color harmonies):

  1. **Mesh Gradient** - Organic multi-color blobs using all harmonies
  2. **Split-Complementary Linear** - 150° hue rotation for sophisticated contrast
  3. **Triadic Radial** - 120° hue rotation, radial gradient type
  4. **Multi-Stop Diagonal** - Three colors (base + triadic + complementary)
  5. **Analogous Cool Linear** - -30° hue rotation (cool tones)
  6. **Warm Analogous Linear** - +30° hue rotation (warm tones)

  Key improvements:

  - **Adaptive lightness**: Dark screenshots → darker gradients (12-40%), light screenshots → lighter gradients (50-90%)
  - Harmonious palette expansion using color theory (analogous, complementary, triadic, monochromatic)
  - Replaced chroma-js with culori for perceptually uniform color manipulation
  - Each gradient type has fundamentally different visual character
  - Neutral/grayscale palettes now get injected color variety

- a59d007: Introduce palette-matched gradients driven by screenshot color analysis

  - Extract dominant/accent/muted hues from screenshots for gradient matching
  - Generate six gradient styles with multi-hue variation and alternate secondary palettes
  - Add gradient playground for previewing palettes
  - Make radial "beam" gradient directional for Peak layouts and shift it downward
  - Avoid showing fallback gradients while screenshot analysis is in progress

### Patch Changes

- 3736af3: Hide the playground route outside development builds

## 0.8.1

### Patch Changes

- 4ef1a7b: Fix logo button showing dropdown menu for logged out users instead of direct file picker
- 03e6151: Hide brand personality indicator in font selector for logged out users

## 0.8.0

### Minor Changes

- c0c7f78: Add post-export success modal for anonymous users to encourage signup. Features thumbnail preview, signup CTA, and direct contact options. Logged-in users see no interruption.

## 0.7.1

### Patch Changes

- dce16e3: Fixed the brand tab being invisible for brand users.

## 0.7.0

### Minor Changes

- 62bde91: Add brand backgrounds feature for Brand tier users

  - Brand users can upload up to 10 custom backgrounds in the Brand tab
  - Backgrounds are compressed before upload to optimize storage
  - Select uploaded backgrounds from a collapsible picker in the Design sidebar
  - Backgrounds appear below the gradient options under "Your backgrounds"
  - API enforces brand-only access and 10 background limit
  - Full analytics tracking for upload, delete, and selection events

- 3ae36dc: Add optional brand background upload to onboarding modal

  - Reorganize onboarding into 4-card bento grid: Logo, Background, Colors, Personality
  - Background card in position 2 explains backgrounds are reusable across designs
  - Compact personality selector with 2x2 grid layout
  - Dashed border on background card signals optional upload
  - Background upload uses shared hook with auto-crop to 16:9 and compression
  - Track has_background in onboarding completion analytics

- 5ec8532: Replace collapsible brand backgrounds with paged background picker

  The background section now uses a single paged grid instead of gradients + a collapsible for brand backgrounds. Page 1 shows screenshot-derived gradients, pages 2+ show uploaded brand backgrounds. Navigation via arrow buttons and clickable dots in the section header. Brand users only see the Brand Backgrounds tab when a screenshot is present; free users see only gradients. Copy updated to remove the background counter and use the “Brand Backgrounds” label.

### Patch Changes

- 89d47df: Auto-crop brand backgrounds to 16:9 aspect ratio

  - Brand backgrounds are automatically cropped to 16:9 using center-crop
  - Accepts any aspect ratio upload (portrait, square, ultrawide)
  - Compression happens after cropping for optimal file size
  - Users see a toast notification when their image is cropped
  - Tracking includes original and final dimensions for analytics

- 351d869: Preload brand logo metadata so it applies alongside screenshots without visible delay.
- 8bab858: Allow headline and subtitle inputs to accept manual line breaks in the designer preview.
- 334aa4b: Soften horizontal fade masks so left/right variants keep the near edge bright and fade more gently across the frame.

## 0.6.0

### Minor Changes

- 5589087: Refactor brand personalities with visual style tokens

  Replace the existing 5 personalities (technical, business, creative, friendly, premium) with 4 new ones:

  - **Hipster** — Warm, grainy, handcrafted (14px corners, warm-tinted shadow, grain texture, Bricolage Grotesque)
  - **Founder** — Sharp, clean, precise (8px corners, crisp shadow, Geist Sans)
  - **Hacker** — Terminal vibes, functional (2px corners, no shadow, scanlines stub, IBM Plex Mono)
  - **Kawaii** — Soft, rounded, Studio Ghibli warmth (24px corners, soft blur shadow, Kiwi Maru)

  Each personality now controls concrete visual tokens:

  - Corner radius on screenshot frames
  - Shadow style (blur, spread, offset, tint)
  - Texture overlay (grain, scanlines stub)
  - Typography (font family)

  Added new `PersonalityStyle` type and `getStyleForPersonality()` function for retrieving style tokens.

- 3f4c2ba: Restore `subscriptionTier`/`subscriptionStatus` on `UserMetadata` and add tier utility helpers.
- b57c5e6: Add tier-aware feature gating for Brand features (sidebar Brand tab, logo tools, and save limits).

### Patch Changes

- 5589087: Fix brand font preselection in sidebar font dropdown

  The font derived from brand personality is now automatically preselected in the sidebar dropdown, rather than just being highlighted in the options. When a user has set a brand personality, their brand-appropriate font will be the default choice until they explicitly select a different font.

- c197442: Remove brand tab routing - handle tab switching purely on frontend without URL changes
- 6743bae: Add brand onboarding modal (shown on first brand login) to collect logo, accent color, light/dark mode, and personality; persist onboarding completion in `UserMetadata.onboardingProgress` and gate editor access until complete.
- bed3343: Redesign the empty state with animated gradient blobs

  Replace the basic dashed border empty state with a more polished design featuring:

  - Four animated corner blobs with subtle drift animations (violet, blue, emerald, orange)
  - Centered plus icon in a rounded container
  - "Drop an image to start" text prompt
  - Smooth hover transitions on borders and colors
  - Dark mode support with adjusted blob opacities
  - Respects `prefers-reduced-motion` by disabling animations

- ea5ab53: Add Friendly (Nunito) and Premium (DM Serif Display) font styles for brand users, including tier-aware font selection and updated adaptive typography rules.
- b041057: **Brand Logo Improvements:**
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
- 409ac8c: Improve logo upload UX with dropdown menu for brand users

  - Add dropdown menu when brand logo is available but not applied
  - "Apply brand logo" option to quickly re-apply saved brand logo
  - "Upload new" option to upload and apply a new logo to current design
  - Show remove button on hover for all logo states (brand and custom)
  - Change label from "Choose file" to "Add logo" for clarity
  - Fix logo upload to automatically apply to canvas

- f88a6fb: Allow dismissing the brand onboarding modal with a confirmation prompt, auto-dismiss on request errors with toast feedback, and add helper copy for color scheme selection.
- b041057: - Ensure brand logo auto-applies again after starting a new design.
- 5589087: Simplified gradient system by removing unused abstractions:

  - Removed gradient presets (Hyper, Oceanic, Cotton Candy, etc.) - all gradients now derive from screenshot colors
  - Removed `gradientSource` field from BackgroundConfig - no longer needed since there's only one source
  - Removed `color-source.ts` abstraction layer - simplified gradient generation pipeline
  - Removed brand gradient mode feature that wasn't working correctly

  The gradient picker now shows 6 screenshot-derived options: 3 linear gradients, 1 mesh gradient, and 2 ambient gradients with blob overlays.

- e255269: Add `BrandProfile.personality` (onboarding product personality), including API support and a personality→font mapping helper.
- 6f08609: Scaffold Polar billing (checkout + portal + webhooks) behind a static feature flag, plus setup docs.
- 83af07f: Add sidebar brand controls for onboarding fields, icon tabs, and brand subroutes.

## 0.5.7

### Patch Changes

- 3a6fc1e: feat: make organic blobs layout-aware by positioning them based on the layout variant (left/right/center) to improve visual balance

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
