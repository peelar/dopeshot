# Tasks: Persistent Background Management

**Input**: Design documents from `/specs/002-persistent-backgrounds/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-spec.yaml

**Tests**: Per Constitution Principle I, test coverage is MANDATORY for all features. Tests MUST be written FIRST, verified to FAIL, then implementation proceeds (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/app/src/` for source, `apps/app/tests/` for tests
- **API routes**: `apps/app/src/app/api/background/`
- **Components**: `apps/app/src/components/`
- **Domain logic**: `apps/app/src/domain/background/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and Supabase Storage setup

- [X] T001 Run Prisma migration to create BackgroundAsset and CuratedBackground tables per data-model.md
- [X] T002 [P] Create Supabase Storage bucket `user-backgrounds` (private) with 5MB limit and image MIME types
- [X] T003 [P] Create Supabase Storage bucket `curated-backgrounds` (public) with 10MB limit and image MIME types
- [X] T004 [P] Apply RLS policies for user-backgrounds bucket (upload, read, delete to own folder)
- [X] T005 Verify migration success with Prisma Studio (check BackgroundAsset and CuratedBackground tables exist)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Create domain types in apps/app/src/domain/background/types.ts (BackgroundAsset, CuratedBackground, BackgroundListResponse)
- [X] T007 [P] Create filename validation utility in apps/app/src/domain/background/validation.ts (sanitizeFilename, validateFileType)
- [X] T008 [P] Create Jotai atoms in apps/app/src/hooks/atoms.ts (userBackgroundsAtom, curatedBackgroundsAtom, availableBackgroundsAtom)
- [X] T009 Extend DAL in apps/app/src/lib/data/dal.ts to support BackgroundAsset queries (getUserBackgrounds, createBackgroundAsset, deleteBackgroundAsset)
- [X] T010 [P] Create API utils in apps/app/src/app/api/background/utils.ts (sanitizeFileExtension, validateBackgroundFile)
- [X] T011 [P] Create seed script in apps/app/prisma/seed-curated-backgrounds.ts for 10 curated backgrounds
- [X] T012 Upload 10 curated background images to Supabase Storage `curated-backgrounds` bucket via dashboard
- [X] T013 Run seed script to populate CuratedBackground table with 10 records

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Logged-in User Uploads Personal Background (Priority: P1) 🎯 MVP

**Goal**: Allow authenticated users to upload custom background images that persist across sessions and appear in the background selector.

**Independent Test**: Log in, upload background via brand sidebar, verify it appears in background selector, log out and log back in, verify persistence.

### Tests for User Story 1 (MANDATORY per Constitution Principle I) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

**Test Strategy (based on constitution):**

- [X] T014 [P] [US1] Unit tests for filename validation in apps/app/tests/ui/background-validation.test.ts
- [X] T015 [P] [US1] Unit tests for file size/type validation in apps/app/tests/ui/background-upload.test.ts
- [X] T016 [P] [US1] Component tests for upload dropzone UI in apps/app/tests/ui/background-dropzone.test.tsx
- [X] T017 [P] [US1] Integration test for upload → persist → logout → login flow in apps/app/tests/e2e/background-persistence.spec.ts
- [X] T018 [P] [US1] Edge case tests for oversized files (>5MB) in apps/app/tests/ui/background-upload.test.ts
- [X] T019 [P] [US1] Edge case tests for invalid file types (e.g., PDF, GIF) in apps/app/tests/ui/background-upload.test.ts

### Implementation for User Story 1

- [X] T020 [US1] Implement POST /api/background/upload endpoint in apps/app/src/app/api/background/upload/route.ts (verify session, validate file, upload to Storage, create DB record, return signed URL)
- [X] T021 [US1] Implement GET /api/background/list endpoint in apps/app/src/app/api/background/list/route.ts (fetch user backgrounds with signed URLs, fetch curated backgrounds with public URLs)
- [X] T022 [P] [US1] Create background upload hook in apps/app/src/hooks/use-background-upload.ts (handles file validation, API call, atom updates)
- [X] T023 [P] [US1] Create background selector component in apps/app/src/components/sidebar/background-selector.tsx (displays user + curated backgrounds with thumbnails)
- [X] T024 [US1] Modify brand panel in apps/app/src/components/brand/brand-panel.tsx to add background upload section
- [X] T025 [US1] Modify background section in apps/app/src/components/sidebar/background-section.tsx to integrate background selector
- [X] T026 [US1] Add analytics tracking events (background_uploaded, background_selected) in apps/app/src/lib/analytics.ts
- [ ] T027 [US1] Verify performance target: background upload completes within 3 seconds for 5MB file

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Free User Selects from Curated Backgrounds (Priority: P1)

**Goal**: Allow non-logged-in users to select from a curated collection of backgrounds without needing an account.

**Independent Test**: Use app without logging in, open background selector, verify curated backgrounds are visible, select one, verify it applies, refresh page, verify uploaded background does not persist.

### Tests for User Story 3 (MANDATORY per Constitution Principle I) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

**Test Strategy (based on constitution):**

- [X] T028 [P] [US3] Integration test for free user accessing curated backgrounds in apps/app/tests/e2e/background-free-user.spec.ts
- [X] T029 [P] [US3] Edge case test: curated backgrounds collection empty or fails to load in apps/app/tests/ui/background-selector.test.tsx
- [X] T030 [P] [US3] Component test: verify free users don't see upload option in apps/app/tests/ui/background-selector.test.tsx

### Implementation for User Story 3

- [X] T031 [US3] Modify GET /api/background/list endpoint to return empty user array for anonymous requests in apps/app/src/app/api/background/list/route.ts
- [X] T032 [US3] Update background selector component to hide user backgrounds section for anonymous users in apps/app/src/components/sidebar/background-selector.tsx
- [X] T033 [US3] Update background selector to show only curated backgrounds for anonymous users in apps/app/src/components/sidebar/background-selector.tsx
- [X] T034 [US3] Add analytics tracking event (curated_backgrounds_loaded) in apps/app/src/lib/analytics.ts
- [ ] T035 [US3] Verify performance target: background selector loads within 1 second

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 2 - Logged-in User Manages Multiple Backgrounds (Priority: P2)

**Goal**: Allow authenticated users to upload multiple backgrounds, view all of them in the selector, switch between them, and handle duplicate filename errors.

**Independent Test**: Log in, upload 3+ background images with unique names, verify all appear in selector, switch between them, attempt duplicate upload, verify error message.

### Tests for User Story 2 (MANDATORY per Constitution Principle I) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

**Test Strategy (based on constitution):**

- [X] T036 [P] [US2] Integration test for uploading multiple backgrounds in apps/app/tests/e2e/background-persistence.spec.ts
- [X] T037 [P] [US2] Integration test for switching between multiple backgrounds in apps/app/tests/e2e/background-persistence.spec.ts
- [X] T038 [P] [US2] Unit test for duplicate filename rejection (P2002 error) in apps/app/tests/ui/background-upload.test.ts
- [X] T039 [P] [US2] Component test for displaying 50+ backgrounds in selector (pagination/scroll) in apps/app/tests/ui/background-selector.test.tsx
- [X] T040 [P] [US2] Edge case test: attempt duplicate filename upload, verify 409 error in apps/app/tests/e2e/background-persistence.spec.ts

### Implementation for User Story 2

- [X] T041 [US2] Implement DELETE /api/background/delete endpoint in apps/app/src/app/api/background/delete/route.ts (verify ownership, delete from Storage, delete from DB)
- [X] T042 [P] [US2] Add delete button with confirmation dialog to background selector component in apps/app/src/components/sidebar/background-selector.tsx
- [X] T043 [US2] Update upload handler to catch P2002 Prisma error and return 409 with clear message in apps/app/src/app/api/background/upload/route.ts
- [X] T044 [P] [US2] Add error toast for duplicate filename in upload hook in apps/app/src/hooks/use-background-upload.ts
- [X] T045 [US2] Add analytics tracking event (background_deleted) in apps/app/src/lib/analytics.ts
- [ ] T046 [US2] Verify performance target: background deletion completes within 1 second

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Background Upload from Brand Sidebar (Priority: P2)

**Goal**: Allow authenticated users to upload brand backgrounds directly from the brand sidebar, with uploaded backgrounds appearing in both the brand sidebar and background selector.

**Independent Test**: Log in, open brand sidebar, upload background, verify it appears in both brand sidebar and background selector.

### Tests for User Story 4 (MANDATORY per Constitution Principle I) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

**Test Strategy (based on constitution):**

- [X] T047 [P] [US4] Integration test for uploading from brand sidebar in apps/app/tests/e2e/background-brand-upload.spec.ts
- [X] T048 [P] [US4] Component test for background upload section in brand panel in apps/app/tests/ui/brand-panel.test.tsx
- [X] T049 [P] [US4] Visual regression test for brand sidebar with backgrounds in apps/app/tests/e2e/brand-sidebar-visual.spec.ts

### Implementation for User Story 4

- [X] T050 [P] [US4] Add background upload section to brand panel in apps/app/src/components/brand/brand-panel.tsx (reuse AssetDropzone component)
- [X] T051 [US4] Connect brand sidebar upload to same POST /api/background/upload endpoint (already implemented in US1)
- [X] T052 [US4] Update userBackgroundsAtom after brand sidebar upload to sync with background selector in apps/app/src/hooks/use-background-upload.ts
- [X] T053 [P] [US4] Add visual indicator in brand sidebar showing uploaded backgrounds count in apps/app/src/components/brand/brand-panel.tsx
- [ ] T054 [US4] Verify uploaded background from brand sidebar appears in background selector within 100ms

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T055 [P] Add error boundaries for background upload failures in apps/app/src/components/sidebar/background-section.tsx
- [X] T056 [P] Optimize thumbnail loading with lazy loading in apps/app/src/components/sidebar/background-selector.tsx
- [X] T057 [P] Add loading states and progress indicators for uploads in apps/app/src/hooks/use-background-upload.ts
- [ ] T058 Add Lighthouse performance check (verify >90 score)
- [X] T059 [P] Add comprehensive error messages for all failure scenarios in apps/app/src/app/api/background/utils.ts
- [ ] T060 Run quickstart.md validation (manual testing checklist)
- [ ] T061 [P] Add changeset for user-facing feature via `pnpm changeset`
- [ ] T062 Code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - US3 (Phase 4): Can start after Foundational - Reuses GET /api/background/list from US1 but independently testable
  - US2 (Phase 5): Can start after Foundational - Adds delete to US1 functionality but independently testable
  - US4 (Phase 6): Can start after Foundational - Reuses upload endpoint from US1 but independently testable
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Reuses list endpoint but independently testable ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Adds delete functionality, independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Reuses upload endpoint, independently testable

**Recommended MVP Scope**: US1 + US3 (logged-in upload + free user curated backgrounds)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (T014-T019 before T020, etc.)
- Tests marked [P] can run in parallel
- Implementation tasks follow logical dependencies (API endpoints before UI components)
- Analytics tracking added as final step in each story

### Parallel Opportunities

- **Setup (Phase 1)**: T002, T003, T004 can run in parallel (different buckets/policies)
- **Foundational (Phase 2)**: T006, T007, T008, T010, T011 can run in parallel (different files)
- **User Story Tests**: All tests within a story marked [P] can run in parallel
- **User Stories**: After Foundational completes, all 4 user stories can be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for filename validation in apps/app/tests/ui/background-validation.test.ts"
Task: "Unit tests for file size/type validation in apps/app/tests/ui/background-upload.test.ts"
Task: "Component tests for upload dropzone UI in apps/app/tests/ui/background-dropzone.test.tsx"
Task: "Integration test for upload → persist → logout → login flow in apps/app/tests/e2e/background-persistence.spec.ts"
Task: "Edge case tests for oversized files in apps/app/tests/ui/background-upload.test.ts"
Task: "Edge case tests for invalid file types in apps/app/tests/ui/background-upload.test.ts"

# After tests written and verified to fail, launch parallel implementation tasks:
Task: "Create background upload hook in apps/app/src/hooks/use-background-upload.ts"
Task: "Create background selector component in apps/app/src/components/sidebar/background-selector.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T014-T027)
4. Complete Phase 4: User Story 3 (T028-T035)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready - users can upload backgrounds (logged-in) or select curated backgrounds (free)

**This delivers core value**: Background persistence for paid users + curated selection for free users

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (logged-in users can upload)
3. Add User Story 3 → Test independently → Deploy/Demo (free users can select curated)
4. Add User Story 2 → Test independently → Deploy/Demo (logged-in users can delete)
5. Add User Story 4 → Test independently → Deploy/Demo (upload from brand sidebar)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T013)
2. Once Foundational is done (checkpoint reached):
   - **Developer A**: User Story 1 (T014-T027)
   - **Developer B**: User Story 3 (T028-T035)
   - **Developer C**: User Story 2 (T036-T046)
   - **Developer D**: User Story 4 (T047-T054)
3. Stories complete and integrate independently
4. Team completes Polish together (T055-T062)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = US1 + US3 (core value for both user types)
- US2 + US4 = enhancements (can defer to post-MVP)

---

## Summary

**Total Tasks**: 62
**MVP Tasks**: 35 (Setup + Foundational + US1 + US3)
**Enhancement Tasks**: 27 (US2 + US4 + Polish)

**Task Breakdown by Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1 - MVP): 14 tasks (6 tests + 8 implementation)
- Phase 4 (US3 - MVP): 8 tasks (3 tests + 5 implementation)
- Phase 5 (US2): 11 tasks (5 tests + 6 implementation)
- Phase 6 (US4): 8 tasks (3 tests + 5 implementation)
- Phase 7 (Polish): 8 tasks

**Parallel Opportunities**: 29 tasks marked [P] can run in parallel within their phase
**Independent Stories**: 4 user stories, each independently testable

**Recommended MVP**: Phases 1-4 (35 tasks) → Delivers background persistence for logged-in users + curated backgrounds for free users
