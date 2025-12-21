# Tasks: Replace Supabase Client with Prisma ORM

**Input**: Design documents from `/specs/001-prisma-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Backend refactor - no new test coverage required. Existing tests (unit, integration, E2E) must continue to pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/app/src/`, `apps/app/tests/`, `apps/app/prisma/`
- All paths relative to repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma ORM initialization and basic configuration

- [ ] T001 Install Prisma dependencies in apps/app: `prisma`, `@prisma/client`, `prisma-json-types-generator`, `zod`, `server-only`
- [ ] T002 [P] Create Prisma config file in apps/app/prisma.config.ts with external tables configuration
- [ ] T003 [P] Create environment variable template in apps/app/.env.example with DATABASE_URL and DIRECT_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema and core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create Prisma schema file in apps/app/prisma/schema.prisma with datasource and generator config
- [ ] T005 [P] Define User model (external table) in apps/app/prisma/schema.prisma referencing auth.users
- [ ] T006 [P] Define BrandProfile model in apps/app/prisma/schema.prisma with JSON type annotations
- [ ] T007 [P] Define UserMetadata model in apps/app/prisma/schema.prisma with JSON type annotations
- [ ] T008 [P] Define GeneratedAsset model in apps/app/prisma/schema.prisma with JSON type annotations
- [ ] T009 Create Zod schemas for JSON fields in apps/app/src/lib/types/brand.ts (BrandColorPalette, BrandTypography, AssetSettings, etc.)
- [ ] T010 [P] Create TypeScript type definitions in apps/app/src/lib/types/prisma.d.ts for PrismaJson namespace
- [ ] T011 Run `npx prisma db pull` to introspect existing Supabase schema
- [ ] T012 Run `npx prisma migrate dev --name init` to create initial migration
- [ ] T013 Run `npx prisma generate` to generate Prisma Client with JSON types
- [ ] T014 Create Prisma client singleton in apps/app/src/lib/prisma.ts with globalThis pattern
- [ ] T015 [P] Update better-auth configuration in apps/app/src/lib/auth/auth-server.ts with Prisma adapter
- [ ] T016 [P] Add database hooks to better-auth in apps/app/src/lib/auth/auth-server.ts for auto-creating brand_profiles and user_metadata on signup
- [ ] T017 Create session verification helper in apps/app/src/lib/auth/session.ts with React cache
- [ ] T018 Create Data Access Layer (DAL) with user-scoped Prisma client in apps/app/src/lib/data/dal.ts using Prisma Client Extensions
- [ ] T019 [P] Add authorization checks to DAL for BrandProfile, UserMetadata, and GeneratedAsset queries

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Type-Safe Database Operations (Priority: P1) 🎯 MVP

**Goal**: All database operations (brand profiles, user metadata, generated assets) work through Prisma with type safety and autocomplete

**Independent Test**: Run existing test suite (`pnpm test`) and perform CRUD operations on brand profiles, verify all operations work with type safety and tests pass

### Implementation for User Story 1

- [ ] T020 [US1] Update GET /api/brand/profile route in apps/app/src/app/api/brand/profile/route.ts to use Prisma instead of supabaseAdmin
- [ ] T021 [US1] Replace supabaseAdmin queries with Prisma queries using getUserDb() from DAL
- [ ] T022 [US1] Verify brand profile fetch returns correct data with type safety
- [ ] T023 [US1] Verify user metadata fetch returns correct data with type safety
- [ ] T024 [US1] Verify logo signed URL generation continues to work (Supabase Storage unchanged)
- [ ] T025 [US1] Update PATCH /api/brand/update-profile route in apps/app/src/app/api/brand/update-profile/route.ts to use Prisma
- [ ] T026 [US1] Replace brand_profiles upsert with Prisma upsert operation
- [ ] T027 [US1] Replace user_metadata update with Prisma update operation
- [ ] T028 [US1] Validate JSON fields (color_palette, typography) with Zod schemas before database write
- [ ] T029 [US1] Update updateUserMetadata utility in apps/app/src/app/api/brand/utils.ts to use Prisma
- [ ] T030 [US1] Test onboarding progress updates work correctly via Prisma
- [ ] T031 [US1] Verify TypeScript autocomplete works for all Prisma queries in IDE
- [ ] T032 [US1] Run existing tests to verify no regressions: `pnpm test:domain && pnpm test:ui && pnpm test:e2e`

**Checkpoint**: At this point, brand profile CRUD operations should work through Prisma with full type safety

---

## Phase 4: User Story 2 - Storage Operations Work with Prisma (Priority: P1)

**Goal**: Logo upload stores file in Supabase Storage and updates database via Prisma

**Independent Test**: Upload a logo via brand profile UI, verify it appears in Supabase Storage bucket and database record is updated via Prisma

### Implementation for User Story 2

- [ ] T033 [US2] Update POST /api/brand/upload-logo route in apps/app/src/app/api/brand/upload-logo/route.ts to use Prisma for database operations
- [ ] T034 [US2] Keep Supabase Storage upload logic unchanged (supabaseAdmin.storage remains)
- [ ] T035 [US2] Replace brand_profiles upsert (logo_path) with Prisma upsert operation
- [ ] T036 [US2] Update user_metadata (onboarding progress) via Prisma using updateUserMetadata utility
- [ ] T037 [US2] Verify file uploads to Supabase Storage brand-logos bucket successfully
- [ ] T038 [US2] Verify brand profile logo_path is updated in database via Prisma
- [ ] T039 [US2] Verify signed URL generation continues to work for uploaded logos
- [ ] T040 [US2] Test complete upload workflow: file upload → storage → database → signed URL
- [ ] T041 [US2] Run E2E tests for logo upload flow: `pnpm test:e2e`

**Checkpoint**: At this point, logo upload should work end-to-end with Storage + Prisma integration

---

## Phase 5: User Story 3 - Schema as Code (Priority: P2)

**Goal**: Prisma schema is single source of truth, TypeScript types auto-generate, migrations managed by Prisma

**Independent Test**: Make a schema change, run `prisma generate`, verify TypeScript types update automatically

### Implementation for User Story 3

- [ ] T042 [US3] Create seed script in apps/app/prisma/seed.ts for development data
- [ ] T043 [US3] Add seed script configuration to apps/app/package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] T044 [US3] Document Prisma Migrate workflow in apps/app/README.md or docs/
- [ ] T045 [US3] Document `prisma generate` usage for type generation
- [ ] T046 [US3] Document `prisma migrate dev` for local development migrations
- [ ] T047 [US3] Document `prisma migrate deploy` for production migrations
- [ ] T048 [US3] Create quickstart validation script based on quickstart.md steps
- [ ] T049 [US3] Test schema change workflow: modify schema → migrate → generate → verify types
- [ ] T050 [US3] Verify `prisma db pull` can sync external tables from Supabase
- [ ] T051 [US3] Verify migrations apply cleanly on fresh database

**Checkpoint**: All user stories should now be independently functional with complete Prisma integration

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and verification

- [ ] T052 Remove Supabase database client in apps/app/src/lib/supabase-db.ts (replaced by Prisma)
- [ ] T053 [P] Remove old Supabase migrations directory in apps/app/supabase/migrations/ (replaced by Prisma migrations)
- [ ] T054 [P] Update imports across codebase: replace `supabaseAdmin.from()` database calls with Prisma (keep storage calls)
- [ ] T055 [P] Audit codebase for remaining direct Supabase database queries with grep: `grep -r "supabaseAdmin.from" apps/app/src/`
- [ ] T056 Verify no direct database calls remain (only Supabase Storage operations should use supabaseAdmin)
- [ ] T057 [P] Update development documentation in docs/ or README.md with Prisma setup instructions
- [ ] T058 [P] Add Prisma schema documentation comments for key models and fields
- [ ] T059 Run full test suite to verify all tests pass: `pnpm test:ci`
- [ ] T060 Run type checking to verify no type errors: `pnpm typecheck`
- [ ] T061 Run build to verify production build works: `pnpm build`
- [ ] T062 Create changeset for Prisma migration: `pnpm changeset`
- [ ] T063 Verify quickstart.md instructions work by following them in clean environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P1) can proceed in parallel after Phase 2
  - User Story 3 (P2) can start after Phase 2, but benefits from US1/US2 completion for validation
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories, can run in parallel with US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but validates US1/US2 patterns

### Within Each User Story

- Authorization layer (DAL) must be ready before updating API routes
- Each API route update is independent and can be parallelized
- Tests run after implementation tasks for that route

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (different files)
- **Phase 2**: T005-T008 (model definitions), T009-T010 (type definitions), T015-T016 (better-auth config), T019 (authorization) can all run in parallel after T004 (schema file creation)
- **User Stories**: US1 and US2 can be worked on in parallel by different developers after Phase 2 completes
- **Phase 6**: T052, T053, T054, T057, T058 can all run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After T004 (schema file created), launch all models together:
Task: "Define BrandProfile model in apps/app/prisma/schema.prisma"
Task: "Define UserMetadata model in apps/app/prisma/schema.prisma"
Task: "Define GeneratedAsset model in apps/app/prisma/schema.prisma"

# Launch type definitions together:
Task: "Create Zod schemas in apps/app/src/lib/types/brand.ts"
Task: "Create TypeScript definitions in apps/app/src/lib/types/prisma.d.ts"

# Launch authorization and auth config together:
Task: "Update better-auth with Prisma adapter in apps/app/src/lib/auth/auth-server.ts"
Task: "Create DAL in apps/app/src/lib/data/dal.ts"
```

---

## Parallel Example: User Story 1 + User Story 2

```bash
# Two developers can work simultaneously:

# Developer A: User Story 1 (Type-Safe Database Operations)
Task: "Update GET /api/brand/profile to use Prisma"
Task: "Update PATCH /api/brand/update-profile to use Prisma"
Task: "Update updateUserMetadata utility to use Prisma"

# Developer B: User Story 2 (Storage Operations)
Task: "Update POST /api/brand/upload-logo to use Prisma for database"
Task: "Verify Storage + Prisma integration works end-to-end"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Type-Safe Database Operations)
4. Complete Phase 4: User Story 2 (Storage Integration)
5. **STOP and VALIDATE**: Run `pnpm test` to verify all tests pass
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Prisma ready, types generated
2. Add User Story 1 → Test brand profile CRUD → Deploy/Demo (MVP!)
3. Add User Story 2 → Test logo upload → Deploy/Demo
4. Add User Story 3 → Validate schema workflow → Deploy/Demo
5. Polish → Remove old code, audit, document

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T019)
2. Once Foundational is done:
   - Developer A: User Story 1 (T020-T032)
   - Developer B: User Story 2 (T033-T041)
   - Developer C: User Story 3 (T042-T051) or start on Polish tasks
3. Stories complete and merge independently

---

## Notes

- **No new tests required**: This is a backend refactor, existing tests must continue to pass
- **Supabase Storage unchanged**: Only database operations move to Prisma, file storage stays with Supabase SDK
- **Better-auth manages auth.users**: Prisma only references it, doesn't migrate it
- **Fresh database acceptable**: No data migration needed, can reset DB during development
- **Type safety is the goal**: Every Prisma query should have full autocomplete and type checking
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `npx prisma generate` after any schema changes
- Run `pnpm test:ci` before considering feature complete
