---

description: "Task list template for feature implementation"
---

# Tasks: Persistent Backgrounds

**Input**: Design documents from `/specs/002-persistent-backgrounds/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL for this spec since they were not explicitly
requested; add them if you want a test-first approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create background domain constants in apps/app/src/domain/backgrounds/constants.ts
- [X] T002 Add background domain types in apps/app/src/domain/backgrounds/types.ts
- [X] T003 [P] Add background data access helpers in apps/app/src/domain/backgrounds/background-service.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add background entities to apps/app/prisma/schema.prisma
- [X] T005 Create Prisma migration in apps/app/prisma/migrations/002_persistent_backgrounds/migration.sql
- [X] T006 Update Supabase seed data for curated presets in apps/app/supabase/seed/phase1_seed.sql
- [X] T007 Add background storage helpers in apps/app/src/domain/backgrounds/background-storage.ts
- [X] T008 Add server-side background auth checks in apps/app/src/lib/supabase-admin.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Select Preset Backgrounds (Priority: P1) 🎯 MVP

**Goal**: Allow branded users to browse and apply curated preset backgrounds that
persist across sessions.

**Independent Test**: Branded user can select a preset background, refresh, and
see the preset library available with the selection persisted.

### Implementation for User Story 1

- [X] T009 [US1] Implement presets API in apps/app/src/app/api/backgrounds/presets/route.ts
- [X] T010 [US1] Implement selection persistence API in apps/app/src/app/api/backgrounds/selection/route.ts
- [X] T011 [US1] Add background selection atoms in apps/app/src/hooks/atoms/backgrounds.ts
- [X] T012 [US1] Load preset library in apps/app/src/components/sidebar/background-section.tsx
- [X] T013 [US1] Persist preset selection in apps/app/src/components/sidebar/background-section.tsx
- [X] T014 [US1] Track preset selection events in apps/app/src/components/sidebar/background-section.tsx

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Upload Personal Backgrounds (Priority: P2)

**Goal**: Let logged-in users upload, select, and manage personal backgrounds that persist.

**Independent Test**: Logged-in user can upload a personal background, select it,
refresh, and see it retained in the personal library.

### Implementation for User Story 2

- [X] T015 [US2] Implement personal list/upload API in apps/app/src/app/api/backgrounds/personal/route.ts
- [X] T016 [US2] Implement personal delete API in apps/app/src/app/api/backgrounds/personal/[backgroundId]/route.ts
- [X] T017 [US2] Wire uploads to persistence in apps/app/src/domain/asset/upload-orchestrator.ts
- [X] T018 [US2] Render personal library in apps/app/src/components/sidebar/background-section.tsx
- [X] T019 [US2] Add personal delete action in apps/app/src/components/sidebar/background-section.tsx
- [X] T020 [US2] Track upload/select/delete events in apps/app/src/components/sidebar/background-section.tsx

**Checkpoint**: User Story 2 fully functional and testable independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T021 [P] Add Changeset entry in .changeset/persistent-backgrounds.md
- [X] T022 [P] Update quickstart validation steps in specs/002-persistent-backgrounds/quickstart.md
- [X] T023 Run quickstart validation notes in specs/002-persistent-backgrounds/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May reuse selection persistence

### Within Each User Story

- API contracts before UI wiring
- UI wiring before persistence validation
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks T001-T003 can run in parallel.
- Foundational tasks T004-T008 can run in parallel, except T005 after T004.
- API tasks T009-T010 can run in parallel.
- API tasks T015-T016 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch API tasks in parallel:
Task: "Implement presets API in apps/app/src/app/api/backgrounds/presets/route.ts"
Task: "Implement selection persistence API in apps/app/src/app/api/backgrounds/selection/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify User Story 1 independently
5. Deploy/demo if ready
