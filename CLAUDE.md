# AGENTS.md

## Overview

dopeshot is the visual identity toolkit for indie hackers and small builders. As a main focus, it formats and nicely wraps a screenshot (product photo, code snippet) but in the future it will also support other use cases.

## Map

- [Product](docs/product/index.md) - homepage for all the documentation regarding the product
- [Folder Structure](docs/development/folder-structure.md) - guide to the src/ directory structure and where to put new code

## Rules

- Focus on creating a delightful front-end experience. Make sure the UI is easy to use, understan and snappy.
- When building UI components, use shadcn/ui CLI for primitives. Style them with Tailwind.
- Avoid new catch-all `utils.ts`; collocate helpers or use domain-specific modules.
- Use pnpm.
- Propose using `knip` to clean up after building a bigger feature.
- Use Jotai for state management, especially for global state. Prefer atoms over prop drilling and callback chains.
- Keep the Design sidebar for styling; look/variant switching stays in the rail/toggle above the canvas.
- Be very hesitant about adding something new to the sidebar. It should be as intelligent as possible, with no extra clicks or steps.
- Actively look for ways to refactor crucial parts of the codebase.
- Add a Changeset for any user-facing change or code change that should appear in the changelog; use `pnpm changeset` and commit the generated file.
- After you are done with implementation, verify if the types & tests work via scripts in `package.json`.
- Whenever you have "a bigger fix" in mind or a refactor, go for it. We are building for tomorrow, not today.
- **Always add tracking events** for all new user-facing functionalities using `track()` from `@/lib/analytics`. Only track relevant product metrics.
- **Always add test coverage** for new features and functionality. Follow the testing strategy documented in `thoughts/research/009-export-testing-strategy.md`:
  - **Unit tests** (Vitest) for pure functions and utilities
  - **Component tests** (Vitest + React Testing Library) for UI components
  - **Integration tests** (Playwright) for E2E workflows
  - **Visual regression tests** (Playwright) for layout/UI changes when applicable
  - **Edge case tests** for boundary conditions and error handling
  - A feature is not complete until it has appropriate test coverage. Run `pnpm test:ui` and `pnpm test:e2e` to verify tests pass before considering implementation done.

- # Phase 1: Supabase Foundation - Product Prompt

## Context

dopeshot is a screenshot beautification tool that will offer free (random beautiful outputs) and paid (brand-consistent outputs) tiers. We need to build the persistence layer that will support user accounts, brand profiles, asset history, and subscription management.

## Goal

Set up Supabase as the complete backend infrastructure. After this phase, dopeshot should be able to remember users, store their brand settings, and keep a history of generated assets.

## What to Build

### 1. Supabase Project Configuration

Create a new Supabase project called "dopeshot" and configure the essential services:

- **Auth**: Enable email/password authentication (keep it simple for now, can add OAuth later)
- **Database**: Postgres database for storing brand profiles, assets, and user metadata
- **Storage**: Two buckets for file storage
- **RLS**: Row Level Security to ensure users can only access their own data

### 2. Database Schema

Design and create tables that capture the full user journey:

**brand_profiles table:**

- Links to authenticated user (one brand profile per user)
- Stores brand identity: name (optional), color palette (5 colors), typography choices (heading font, body font), logo storage reference
- Tracks when profile was created and last updated
- Starts empty when user signs up, filled during onboarding

**generated_assets table:**

- Links to authenticated user (one user has many assets)
- Stores reference to generated image file in storage
- Stores settings snapshot: which layout was used, which style toggles were active, orientation, any text overlays
- Timestamp for sorting/filtering history
- Metadata like file size, dimensions for display purposes

**user_metadata table (extends Supabase auth.users):**

- Subscription tier: "free" or "paid"
- Subscription status: "active", "cancelled", "past_due" (for future payment integration)
- Onboarding progress: which steps completed (useful for prompting incomplete onboarding)
- Usage tracking: exports this month (for free tier limits)
- Feature flags for A/B testing or gradual rollout

### 3. Storage Buckets

Create two storage buckets with different access patterns:

**`brand-logos` bucket (private):**

- Users upload their logo here during onboarding
- Only the owner can view/download their logo
- Organized by user_id as folders: `{user_id}/logo-{timestamp}.png`
- Max file size: 5MB (reasonable for logos)
- Accepted formats: PNG, JPG, SVG

**`generated-assets` bucket (public):**

- dopeshot stores generated screenshot assets here
- Public read access (users share these outputs)
- Only creator can upload to their folder
- Organized: `{user_id}/{asset_id}.png`
- No expiration initially, can add for free tier later

### 4. Row Level Security Policies

Implement security rules so users can't access each other's data:

**brand_profiles:**

- Users can SELECT, INSERT, UPDATE their own profile (where user_id = auth.uid())
- Users cannot see other users' profiles
- Service role (server-side) can access all profiles

**generated_assets:**

- Users can SELECT, INSERT their own assets
- Users can DELETE their own assets (for history management)
- Public can SELECT if we add a sharing feature later
- Service role can access all assets

**Storage policies:**

- Users can upload to their own folder in brand-logos
- Users can only read their own logos
- Users can upload to their own folder in generated-assets
- Anyone can read generated-assets (public sharing)

### 5. Database Triggers

Automate common operations:

**On user signup (auth.users insert):**

- Automatically create an empty brand_profile record
- Initialize user_metadata with tier="free", status="active"
- Set onboarding_progress to empty/null

**On brand_profile update:**

- Update the `updated_at` timestamp
- Optional: Log change history for premium users

### 6. Initial Data & Testing

Prepare the database for development:

- Create seed data: 1 test user with complete brand profile
- Upload 1 sample logo to test storage
- Create 3 sample generated assets in history
- Verify RLS by attempting cross-user access (should fail)

## What Success Looks Like

After Phase 1, dopeshot can:

1. **Persist user accounts** - Sign up once, data saved forever
2. **Store brand settings** - Logo uploaded, colors saved, fonts remembered
3. **Keep asset history** - Every generation saved with settings
4. **Enforce security** - Users can't peek at other users' data
5. **Support growth** - Schema ready for subscriptions, limits, features

## Non-Goals (Not in Phase 1)

- ❌ No auth UI yet (sign-up forms, login modals) - just database ready
- ❌ No payment integration - just tier field ready for it
- ❌ No brand onboarding flow - just storage ready for it
- ❌ No asset generation integration - just schema ready for it
- ❌ No email verification or password reset - basic auth only

## Deliverables

1. Supabase project created and configured
2. Database migration file with all tables and relationships
3. Storage buckets created with policies
4. RLS policies written and tested
5. Database triggers implemented
6. Seed data for local testing
7. Documentation: connection strings, bucket names, table schemas

## Technical Constraints

- Use Supabase's built-in auth (don't roll our own)
- Use UUID for all primary keys (Supabase default)
- Use JSONB for flexible data (color palettes, settings snapshots)
- Keep storage paths predictable for easy debugging
- Write RLS policies that are simple and auditable

## How This Connects to Next Phases

- **Phase 2 (Auth):** Will use these tables to store session data and user state
- **Phase 3 (Brands):** Will read/write to brand_profiles table
- **Phase 4 (Payments):** Will update user_metadata.tier via webhooks
- **Phase 5 (Features):** Will query generated_assets for history view

---

**Ready to implement?** This prompt gives you everything needed to set up Supabase persistence correctly the first time.. use supabase mcp

## Active Technologies

- TypeScript 5.x, Next.js 16.0.7, React 19.2.1 + Prisma ORM, @supabase/supabase-js (storage only), better-auth, Jotai (001-prisma-migration)
- Supabase Postgres (via Prisma), Supabase Storage (direct SDK for files) (001-prisma-migration)

## Recent Changes

- 001-prisma-migration: Added TypeScript 5.x, Next.js 16.0.7, React 19.2.1 + Prisma ORM, @supabase/supabase-js (storage only), better-auth, Jotai
