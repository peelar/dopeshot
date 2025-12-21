# Implementation Plan: Persistent Background Management

**Branch**: `002-persistent-backgrounds` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)

## Summary

Enable logged-in users to upload custom background images that persist across sessions, while providing free users access to a curated collection of backgrounds stored in the database. Backgrounds are uploaded via the brand sidebar and selected from the background selector sidebar. Technical approach follows existing logo upload patterns with Supabase Storage integration and Prisma database persistence.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16.0.7 and React 19.2.1
**Primary Dependencies**: Prisma ORM, @supabase/supabase-js, better-auth, Jotai
**Storage**: Supabase Postgres (via Prisma) + Supabase Storage buckets for files
**Testing**: Vitest (unit/component), Playwright (E2E/visual regression)
**Target Platform**: Web application (Next.js App Router)
**Project Type**: Web (monorepo with apps/app as main Next.js app)
**Performance Goals**: <100ms background selection, <3s upload completion, <1s background selector load
**Constraints**: 5MB file size limit per background, supports PNG/JPG/WEBP/SVG
**Scale/Scope**: ~10 curated backgrounds at launch, unlimited user backgrounds per account

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md`:

- [x] **Test Coverage (Principle I):** Test strategy defined
  - Unit tests: File validation, filename uniqueness check
  - Component tests: Background selector UI, upload dropzone
  - Integration tests: Upload flow, background persistence, free vs logged-in user behavior
  - Visual regression: Background rendering consistency
  - Edge cases: Duplicate filenames, oversized files, invalid formats

- [x] **User Experience (Principle II):** UI follows shadcn/ui + Tailwind, uses Jotai for state, minimizes cognitive load
  - Reuses existing AssetDropzone component pattern from logo upload
  - Background selector shows thumbnails for visual identification
  - Upload integrated into brand sidebar (existing UX pattern)
  - Instant preview updates via Jotai atoms (<100ms)
  - Confirmation dialog for deletion (prevents accidental loss)

- [x] **Code Quality (Principle III):** No over-engineering, no premature abstractions, collocated helpers
  - Follows existing upload patterns (mirrors logo upload implementation)
  - Reuses upload-orchestrator.ts for client-side processing
  - Reuses Data Access Layer (DAL) for userId enforcement
  - No new abstraction layers - extends existing GeneratedAsset model

- [x] **Observability (Principle IV):** Analytics tracking planned for user-facing features
  - `background_uploaded` (file_size_kb, is_authenticated)
  - `background_selected` (source: "user_uploaded" | "curated")
  - `background_deleted` (background_id)
  - `curated_backgrounds_loaded` (count)

- [x] **Performance (Principle V):** Performance targets defined
  - Background selection: <100ms (Jotai atom update)
  - Upload completion: <3s for 5MB files
  - Selector load: <1s (includes thumbnail fetch from Supabase)
  - Lighthouse score: >90 (lazy load background selector)

**Complexity Justification**: None required - feature reuses existing patterns without introducing new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/002-persistent-backgrounds/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions
├── data-model.md        # Phase 1: Database schema design
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: API contracts (OpenAPI)
└── tasks.md             # Phase 2: Implementation tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/app/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── background/          # NEW: Background API routes
│   │           ├── upload/
│   │           │   └── route.ts     # POST /api/background/upload
│   │           ├── list/
│   │           │   └── route.ts     # GET /api/background/list
│   │           ├── delete/
│   │           │   └── route.ts     # DELETE /api/background/delete
│   │           └── utils.ts         # Background-specific utilities
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── background-section.tsx        # MODIFY: Add brand background upload
│   │   │   └── background-selector.tsx       # NEW: Background picker UI
│   │   └── brand/
│   │       └── brand-panel.tsx               # MODIFY: Add background upload section
│   ├── domain/
│   │   └── background/                       # NEW: Background domain logic
│   │       ├── types.ts                      # Background-specific types
│   │       └── validation.ts                 # Filename uniqueness validation
│   ├── hooks/
│   │   ├── atoms.ts                          # MODIFY: Add userBackgroundsAtom
│   │   └── use-background-upload.ts          # NEW: Background upload hook
│   └── lib/
│       └── data/
│           └── dal.ts                        # MODIFY: Add background queries
├── prisma/
│   ├── schema.prisma                         # MODIFY: Add BackgroundAsset model
│   └── migrations/                           # NEW: Migration for background tables
└── tests/
    ├── ui/
    │   ├── background-selector.test.tsx      # Component tests
    │   └── background-upload.test.tsx        # Upload validation tests
    └── e2e/
        ├── background-persistence.spec.ts    # E2E: Upload → logout → login flow
        └── background-free-user.spec.ts      # E2E: Free user curated backgrounds
```

**Structure Decision**: Web application (Next.js App Router). Feature follows existing patterns with API routes in `app/api/background/`, domain logic in `src/domain/background/`, and component modifications in existing sidebar files. No new architecture layers needed.

## Complexity Tracking

No violations to report. Feature reuses all existing patterns:
- Upload flow mirrors `api/brand/upload-logo`
- DAL for userId enforcement (existing)
- Jotai atoms follow established patterns
- Supabase Storage integration (existing)

## Phase 0: Research & Technical Decisions

**Status**: Pending (to be generated in research.md)

### Research Tasks

1. **Curated Background Storage Strategy**
   - Decision needed: Store curated backgrounds in Prisma DB or just Supabase Storage?
   - Research: Best practices for shared assets vs. user assets
   - Consideration: Admin interface for adding curated backgrounds

2. **Background Asset Table Design**
   - Decision needed: Extend `GeneratedAsset` model or create separate `BackgroundAsset` table?
   - Research: Trade-offs between reusing existing table vs. dedicated table
   - Consideration: Query patterns for listing user backgrounds

3. **Filename Uniqueness Enforcement**
   - Decision needed: Check uniqueness at DB level, storage level, or application level?
   - Research: Supabase Storage duplicate handling behavior
   - Consideration: Error messaging for duplicate uploads

4. **Curated Background Seeding**
   - Decision needed: Manual upload via Supabase dashboard or seed script?
   - Research: Prisma seeding best practices for binary assets
   - Consideration: Initial 10 backgrounds selection criteria

5. **Background Deletion Strategy**
   - Decision needed: Soft delete (mark inactive) or hard delete (remove from storage)?
   - Research: Supabase Storage deletion patterns
   - Consideration: Cascading delete if background currently applied to canvas

### Best Practices Research

1. **Supabase Storage Patterns**
   - Bucket organization: separate bucket for backgrounds or reuse `generated-assets`?
   - Path structure: `{userId}/backgrounds/{filename}` or flat structure?
   - Signed URL caching strategy

2. **Jotai State Management**
   - Atom composition: separate atoms for user vs. curated backgrounds?
   - Persistence: should user's selected background persist in localStorage?
   - Sync strategy: optimistic updates vs. await server confirmation

3. **Image Thumbnail Generation**
   - Approach: Client-side resize before upload or Supabase Image Transformation?
   - Size targets: 200x200px thumbnails for selector grid
   - Performance: lazy load thumbnails or eager load?

## Phase 1: Design & Contracts

**Status**: Pending

### Deliverables

1. **data-model.md**: Prisma schema updates
   - `BackgroundAsset` model (or `GeneratedAsset` extension)
   - `CuratedBackground` model
   - Relationships to `User` model
   - Indexes for performance

2. **contracts/**: API contract definitions
   - `POST /api/background/upload` (FormData → signed URL)
   - `GET /api/background/list` (returns user + curated backgrounds)
   - `DELETE /api/background/delete` (background ID → confirmation)
   - `GET /api/background/curated` (fetch curated collection)

3. **quickstart.md**: Developer setup instructions
   - Prisma migration steps
   - Supabase bucket creation
   - Seed curated backgrounds
   - Environment variables
   - Testing setup

## Next Steps

After `/speckit.plan` completes (this command):
1. Review `research.md` for technical decisions
2. Review `data-model.md` for schema changes
3. Review `contracts/` for API specifications
4. Run `/speckit.tasks` to generate implementation task breakdown
5. Run `/speckit.implement` to execute tasks

**Note**: This plan follows the constitution's simplicity principle - no new patterns introduced, all infrastructure reused from existing logo upload feature.
