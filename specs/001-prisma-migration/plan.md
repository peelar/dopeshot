# Implementation Plan: Replace Supabase Client with Prisma ORM

**Branch**: `001-prisma-migration` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-prisma-migration/spec.md`

## Summary

Replace direct Supabase client database calls with Prisma ORM while keeping Supabase Storage for files and better-auth for authentication. Database can be purged and set up fresh. The goal is type-safe database operations with excellent DX (autocomplete, compile-time checking) for brand profiles, user metadata, and generated assets tables.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.0.7, React 19.2.1
**Primary Dependencies**: Prisma ORM, @supabase/supabase-js (storage only), better-auth, Jotai
**Storage**: Supabase Postgres (via Prisma), Supabase Storage (direct SDK for files)
**Testing**: Vitest (unit/component), Playwright (E2E), node:assert (domain tests)
**Target Platform**: Next.js 16 App Router (apps/app)
**Project Type**: Web monorepo (apps/app + apps/landing)
**Performance Goals**: <200ms API responses, <100ms preview updates, <3s exports
**Constraints**: Database features behind feature flag, fresh DB setup acceptable
**Scale/Scope**: 3 tables (brand_profiles, user_metadata, generated_assets), 3 API routes, ~10 database operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md`:

- [x] **Test Coverage (Principle I):** Test strategy defined (unit tests for Prisma queries, integration tests for API routes, E2E tests for full workflows)
- [x] **User Experience (Principle II):** No UI changes - backend only; existing UI interactions remain unchanged
- [x] **Code Quality (Principle III):** Using Prisma's built-in features, no custom ORM abstractions, replacing direct Supabase calls with Prisma equivalents
- [x] **Observability (Principle IV):** Existing analytics remain unchanged (backend refactor only)
- [x] **Performance (Principle V):** Performance targets maintained (<200ms API responses confirmed in spec)

**Complexity Justification**: None required. Prisma is a standard ORM choice that reduces complexity by providing type safety and eliminating manual SQL string construction.

## Project Structure

### Documentation (this feature)

```text
specs/001-prisma-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output (Prisma best practices, schema design, better-auth integration)
├── data-model.md        # Phase 1 output (BrandProfile, UserMetadata, GeneratedAsset models)
├── quickstart.md        # Phase 1 output (setup instructions for Prisma)
├── contracts/           # Phase 1 output (API route contracts)
│   ├── brand-profile.yaml
│   ├── update-profile.yaml
│   └── upload-logo.yaml
└── tasks.md             # Phase 2 output (created by /speckit.tasks command)
```

### Source Code (repository root)

```text
apps/app/
├── src/
│   ├── app/api/           # API routes (to be updated)
│   │   ├── brand/
│   │   │   ├── profile/route.ts       # GET brand profile
│   │   │   ├── update-profile/route.ts # PATCH brand profile
│   │   │   └── upload-logo/route.ts   # POST logo upload
│   │   └── auth/                      # better-auth routes (unchanged)
│   ├── lib/
│   │   ├── prisma.ts                  # NEW: Prisma client singleton
│   │   ├── supabase-admin.ts          # KEEP: for storage operations
│   │   ├── supabase-db.ts             # REMOVE: replaced by Prisma
│   │   └── auth/                      # better-auth integration (unchanged)
│   ├── domain/                        # business logic (unchanged)
│   └── components/                    # UI components (unchanged)
├── prisma/
│   ├── schema.prisma                  # NEW: Prisma schema definition
│   ├── migrations/                    # NEW: Prisma migrations
│   └── seed.ts                        # NEW: Prisma seed script
├── tests/
│   ├── e2e/                           # E2E tests (update for Prisma)
│   ├── ui/                            # Component tests (unchanged)
│   └── domain/                        # Domain tests (unchanged)
└── supabase/                          # KEEP: for storage bucket config only
    └── migrations/                    # REMOVE: replaced by Prisma migrations

apps/landing/                          # Unchanged (no database operations)
```

**Structure Decision**: Monorepo with apps/app containing the main application. Prisma client will be initialized in `apps/app/src/lib/prisma.ts` as a singleton. Schema defined in `apps/app/prisma/schema.prisma`. Supabase client remains for storage operations only (logo uploads, asset storage).

## Complexity Tracking

> **No violations to justify** - this implementation follows simplicity principles by using a standard ORM and removing manual database client code.

## Phase 0: Research

**Unknowns to resolve:**

1. **Prisma + better-auth integration pattern**
   - How to configure Prisma schema to reference `auth.users` table without modifying it
   - How to handle user signup triggers (brand_profile + user_metadata auto-creation)

2. **JSON field handling in Prisma**
   - Best practices for `color_palette` (string array)
   - Best practices for `typography`, `settings`, `metadata`, `feature_flags` (JSON objects)
   - Type safety strategy for JSON fields

3. **Prisma client initialization in Next.js**
   - Singleton pattern for Prisma client to avoid connection pool exhaustion
   - Development vs production configuration
   - Test environment setup

4. **Migration strategy from Supabase migrations to Prisma**
   - How to initialize Prisma from existing Supabase schema
   - Database reset workflow (since fresh setup is acceptable)

5. **Authorization middleware patterns**
   - Replacing RLS with application-level checks
   - Where to enforce user_id filtering (middleware vs route handlers)

**Research Tasks:**

- Research Prisma + better-auth integration patterns (auth.users table handling)
- Research Prisma JSON field type safety best practices
- Research Next.js Prisma client singleton pattern
- Research Prisma schema introspection from existing Postgres database
- Research application-level authorization patterns for multi-tenant data

**Output**: `research.md` with decisions, rationale, and alternatives considered

## Phase 1: Design

**Prerequisites**: `research.md` complete

### Data Model (`data-model.md`)

Extract from spec and define Prisma models:

- **BrandProfile**: id, user_id (FK to auth.users), name, color_palette (JSON), typography (JSON), logo_path, timestamps
- **UserMetadata**: user_id (PK, FK to auth.users), subscription_tier, subscription_status, onboarding_progress (JSON), usage (JSON), feature_flags (JSON), timestamps
- **GeneratedAsset**: id, user_id (FK to auth.users), storage_path, settings (JSON), orientation, text_overlays (JSON), metadata (JSON), is_public, created_at

### API Contracts (`contracts/`)

Generate OpenAPI specs for existing API routes:

1. **GET /api/brand/profile** - Fetch brand profile, user metadata, logo signed URL
2. **PATCH /api/brand/update-profile** - Update brand profile and/or user metadata
3. **POST /api/brand/upload-logo** - Upload logo to storage, update brand profile

### Quickstart (`quickstart.md`)

Developer setup instructions:
- Install Prisma CLI
- Configure DATABASE_URL
- Run `prisma generate` and `prisma migrate dev`
- Initialize Prisma client in code
- Run tests to verify setup

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- Prisma ORM usage
- Prisma schema location
- Prisma client import pattern
- Test patterns for Prisma queries

## Phase 2: Tasks

**Not created by this command** - use `/speckit.tasks` after plan approval

Will generate implementation tasks for:
- Prisma setup and configuration
- Schema definition and migration
- API route refactoring (replace Supabase client with Prisma)
- Authorization middleware implementation
- Test updates
- Documentation updates

## Gate: Re-Evaluate Constitution

*After Phase 1 design complete, re-check:*

- [x] **Test Coverage**: Strategy defined for Prisma query tests, API route integration tests
- [x] **User Experience**: No UI changes - backend refactor maintains existing UX
- [x] **Code Quality**: Using Prisma built-ins, no over-engineering
- [x] **Observability**: Backend refactor only - existing analytics unchanged
- [x] **Performance**: <200ms API response targets maintained

All checks pass. Ready for implementation.
