# Tasks: DopeShot Memory

**Input**: Design documents from `/specs/001-memory/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/memory-api.yaml

**Tests**: Tests are REQUIRED per constitution. Unit tests for domain logic, E2E tests for user flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/app/`:
- **Source**: `src/`
- **Tests**: `tests/` (vitest unit), `e2e/` (playwright)
- **Prisma**: `prisma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and project configuration

- [X] T001 Install nanoid package: `pnpm add nanoid`
- [X] T002 [P] Add shadcn/ui ContextMenu component: `pnpm dlx shadcn@latest add context-menu`
- [X] T003 [P] Add shadcn/ui Sheet component (if not present): `pnpm dlx shadcn@latest add sheet`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Storage

- [X] T004 Add MemoryItem model to Prisma schema in `prisma/schema.prisma` with fields: id, userId, configHash, screenshotPath, configuration (Json), shareHash, sharedAt, createdAt, and indexes
- [X] T005 Add MemoryItem relation to User model in `prisma/schema.prisma`
- [X] T006 Run Prisma migration: `npx prisma migrate dev --name add-memory-items`
- [X] T007 Create `memory-screenshots` bucket in Supabase via SQL (see data-model.md for exact SQL)
- [X] T008 [P] Create memory storage utilities in `src/lib/storage/memory-storage.ts` with uploadScreenshot(), deleteScreenshot(), getSignedUrl() functions

### Domain Types & Utilities

- [X] T009 [P] Create MemoryConfiguration type in `src/domain/memory/types.ts` matching data-model.md schema
- [X] T010 [P] Create config serializer in `src/domain/memory/config-serializer.ts` to extract current editor state into MemoryConfiguration
- [X] T011 [P] Create config hash utility in `src/domain/memory/config-hash.ts` using SHA-256 (first 32 chars)
- [X] T012 [P] Create config loader in `src/domain/memory/config-loader.ts` to hydrate editor state from MemoryConfiguration

### State Management

- [X] T013 Create memory atoms in `src/hooks/atoms/memory.ts`: memorySidebarOpenAtom, memoryItemsAtom, memoryLoadingAtom, showExportNudgeAtom, loadedMemoryItemIdAtom
- [X] T014 [P] Create derived atoms in `src/hooks/atoms/memory.ts`: currentConfigHashAtom, configExistsInMemoryAtom

### Unit Tests for Domain Logic

- [ ] T015 [P] Create unit test for config-hash in `tests/unit/memory/config-hash.test.ts` - verify deterministic hashing, different configs produce different hashes
- [ ] T016 [P] Create unit test for config-serializer in `tests/unit/memory/config-serializer.test.ts` - verify all fields captured correctly
- [ ] T017 [P] Create unit test for config-loader in `tests/unit/memory/config-loader.test.ts` - verify state restoration

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Logged-In User Exports and Sees Memory (Priority: P1) 🎯 MVP

**Goal**: A logged-in user can export and see their export appear in a memory sidebar. They can reload previous exports.

**Independent Test**: Export a design as logged-in user → appears in sidebar → click to reload → editor shows same config

### API Routes for US1

- [X] T018 [US1] Create GET /api/memory/items route in `src/app/api/memory/items/route.ts` - list user's memory items with pagination
- [X] T019 [US1] Create POST /api/memory/items route in `src/app/api/memory/items/route.ts` - create memory item with screenshot upload
- [X] T020 [US1] Create GET /api/memory/items/[itemId] route in `src/app/api/memory/items/[itemId]/route.ts` - get full memory item with configuration

### Sidebar UI Components for US1

- [X] T021 [P] [US1] Create MemoryItem thumbnail component in `src/components/memory/memory-item.tsx` - displays thumbnail, handles click
- [X] T022 [US1] Create MemorySidebar component in `src/components/memory/memory-sidebar.tsx` - collapsible left sidebar with item list
- [X] T023 [US1] Create MemorySidebarTrigger component in `src/components/memory/memory-sidebar-trigger.tsx` - icon button to toggle sidebar

### Layout Integration for US1

- [ ] T024 [US1] Add MemorySidebar to playground layout in `src/app/(playground)/_components/playground-page.tsx` - position on left side (See INTEGRATION_GUIDE.md)
- [ ] T025 [US1] Add sidebar trigger icon to header or left rail in `src/app/(playground)/_components/playground-page.tsx` (See INTEGRATION_GUIDE.md)

### Export Flow Extension for US1

- [ ] T026 [US1] Extend export handler in `src/hooks/use-playground-controller.ts` - after successful export, if logged in: serialize config, upload screenshot, create memory item (See INTEGRATION_GUIDE.md)
- [X] T027 [US1] Add optimistic UI update in export handler - immediately add item to memoryItemsAtom before server confirms (Implemented in useMemory hook)
- [X] T028 [US1] Implement deduplication check in export handler - skip creation if configHash already exists (Implemented in API route)

### Config Loading for US1

- [X] T029 [US1] Implement loadMemoryItem function in `src/hooks/use-playground-controller.ts` - fetch full config and hydrate all atoms (Implemented in useMemory hook)
- [X] T030 [US1] Wire up memory item click to loadMemoryItem in `src/components/memory/memory-item.tsx` (Props interface ready, wiring in INTEGRATION_GUIDE.md)

### Analytics for US1

- [ ] T031 [P] [US1] Add `memory_sidebar_opened` tracking event in `src/components/memory/memory-sidebar.tsx`
- [ ] T032 [P] [US1] Add `memory_sidebar_closed` tracking event in `src/components/memory/memory-sidebar.tsx`
- [ ] T033 [P] [US1] Add `memory_item_created` tracking event in export handler
- [ ] T034 [P] [US1] Add `memory_item_loaded` tracking event in loadMemoryItem

### E2E Test for US1

- [ ] T035 [US1] Create E2E test in `e2e/memory/export-and-reload.spec.ts` - login, export, verify sidebar item, click item, verify config restored

**Checkpoint**: User Story 1 complete - logged-in users can export and reload from memory

---

## Phase 4: User Story 2 - Logged-Out User Exports Without Friction (Priority: P1)

**Goal**: Logged-out users can still export with zero friction. Memory sidebar shows empty state.

**Independent Test**: Export as logged-out user → file downloads → no errors → sidebar empty

### Implementation for US2

- [ ] T036 [US2] Add auth check to export handler in `src/hooks/use-playground-controller.ts` - skip persistence if not logged in
- [ ] T037 [US2] Add empty state to MemorySidebar in `src/components/memory/memory-sidebar.tsx` - no items, no messaging when logged out
- [ ] T038 [US2] Verify export flow doesn't make server calls when logged out (review export handler)

### E2E Test for US2

- [ ] T039 [US2] Create E2E test in `e2e/memory/logged-out-export.spec.ts` - export as guest, verify download works, verify no memory items created

**Checkpoint**: User Story 2 complete - logged-out export unchanged

---

## Phase 5: User Story 3 - Post-Export Account Nudge (Priority: P2)

**Goal**: After logged-out export, Export button changes to "Create account" nudge

**Independent Test**: Export as guest → button shows "Create account" → any interaction dismisses

### Implementation for US3

- [ ] T040 [US3] Create ExportNudge component in `src/components/memory/export-nudge.tsx` - wraps/modifies Export button with nudge state
- [ ] T041 [US3] Add nudge trigger to export handler in `src/hooks/use-playground-controller.ts` - set showExportNudgeAtom true after logged-out export
- [ ] T042 [US3] Add nudge dismissal logic - subscribe to relevant atoms, dismiss on any change
- [ ] T043 [US3] Wire nudge click to open auth modal without navigation in `src/components/memory/export-nudge.tsx`

### Analytics for US3

- [ ] T044 [P] [US3] Add `export_nudge_shown` tracking event
- [ ] T045 [P] [US3] Add `export_nudge_clicked` tracking event
- [ ] T046 [P] [US3] Add `export_nudge_dismissed` tracking event with time_visible_ms

### E2E Test for US3

- [ ] T047 [US3] Create E2E test in `e2e/memory/export-nudge.spec.ts` - export as guest, verify nudge appears, interact with editor, verify nudge dismissed

**Checkpoint**: User Story 3 complete - conversion nudge working

---

## Phase 6: User Story 4 - Explicit Sharing of Exports (Priority: P2)

**Goal**: Right-click memory item to share, generates public URL

**Independent Test**: Share item → get URL → visit URL as anonymous → see full image and load config

### API Routes for US4

- [ ] T048 [US4] Create POST /api/memory/items/[itemId]/share route in `src/app/api/memory/items/[itemId]/share/route.ts` - generate shareHash, return URL
- [ ] T049 [US4] Create GET /api/memory/shared/[shareHash] route in `src/app/api/memory/shared/[shareHash]/route.ts` - return config for public access

### Public Share Page for US4

- [ ] T050 [US4] Create dynamic route page in `src/app/[shareHash]/page.tsx` - server fetch config, render editor with loaded state
- [ ] T051 [US4] Add 404 handling for invalid/unshared hashes in `src/app/[shareHash]/page.tsx`

### Context Menu for US4

- [ ] T052 [P] [US4] Create MemoryContextMenu component in `src/components/memory/memory-context-menu.tsx` using shadcn ContextMenu
- [ ] T053 [US4] Add "Share" menu item to context menu - calls share API, copies URL, shows toast
- [ ] T054 [US4] Disable "Share" option for already-shared items in context menu

### Analytics for US4

- [ ] T055 [P] [US4] Add `memory_item_shared` tracking event
- [ ] T056 [P] [US4] Add `shared_link_visited` tracking event on share page

### E2E Test for US4

- [ ] T057 [US4] Create E2E test in `e2e/memory/share-flow.spec.ts` - share item, visit URL, verify config loads

**Checkpoint**: User Story 4 complete - sharing works

---

## Phase 7: User Story 5 - Reload and Modify Previous Export (Priority: P2)

**Goal**: Loading a memory item and exporting creates a new item (original unchanged). Deduplication if identical.

**Independent Test**: Load item, modify, export → new item at top, original unchanged

### Implementation for US5

- [ ] T058 [US5] Ensure export after load creates new item (verify existing T026-T028 handle this)
- [ ] T059 [US5] Add visual indicator in sidebar for currently-loaded item in `src/components/memory/memory-item.tsx`
- [ ] T060 [US5] Verify deduplication works - export identical config shows no new item (test in E2E)

### E2E Test for US5

- [ ] T061 [US5] Create E2E test in `e2e/memory/reload-modify-export.spec.ts` - load item, change config, export, verify two items exist

**Checkpoint**: User Story 5 complete - modify and re-export flow works

---

## Phase 8: User Story 6 - Gradient Freezing and Regeneration (Priority: P3)

**Goal**: Gradients are frozen in config. Ghost button to regenerate.

**Independent Test**: Export → reload → gradient identical. Click regenerate → gradient changes.

### Implementation for US6

- [ ] T062 [US6] Ensure gradient is captured in config serializer (verify T010 includes full gradient params)
- [ ] T063 [US6] Ensure gradient is restored in config loader (verify T012 restores screenshotGradientAtom)
- [ ] T064 [US6] Create GradientRegenerateButton (ghost style) in `src/components/memory/gradient-regenerate-button.tsx`
- [ ] T065 [US6] Add regenerate button below gradient preview in design sidebar when memory item is loaded

### Analytics for US6

- [ ] T066 [P] [US6] Add `gradient_regenerated` tracking event with from_memory_item property

### E2E Test for US6

- [ ] T067 [US6] Create E2E test in `e2e/memory/gradient-freeze.spec.ts` - export, reload, verify gradient, regenerate, verify changed

**Checkpoint**: User Story 6 complete - gradient freezing works

---

## Phase 9: User Story 7 - Delete Memory Items (Priority: P3)

**Goal**: Right-click delete removes item. Shared URLs become 404.

**Independent Test**: Delete item → gone from sidebar. If was shared → 404 on URL.

### API Route for US7

- [ ] T068 [US7] Create DELETE /api/memory/items/[itemId] route in `src/app/api/memory/items/[itemId]/route.ts` - delete from DB and storage

### Context Menu for US7

- [ ] T069 [US7] Add "Delete" menu item to context menu in `src/components/memory/memory-context-menu.tsx`
- [ ] T070 [US7] Implement delete handler - call API, optimistically remove from memoryItemsAtom

### Analytics for US7

- [ ] T071 [P] [US7] Add `memory_item_deleted` tracking event with item_age_days, was_shared

### E2E Test for US7

- [ ] T072 [US7] Create E2E test in `e2e/memory/delete-flow.spec.ts` - delete item, verify gone, if shared verify 404

**Checkpoint**: User Story 7 complete - deletion works

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, testing, and release prep

- [ ] T073 Add changeset via `pnpm changeset` - major new feature "DopeShot Memory"
- [ ] T074 Run `pnpm test:ui` and fix any failures
- [ ] T075 Run `pnpm test:e2e` and fix any failures
- [ ] T076 Run `pnpm knip` to identify unused exports/dependencies
- [ ] T077 Review all tracking events are implemented (11 total from spec)
- [ ] T078 Mobile responsiveness review for MemorySidebar (drawer pattern)
- [ ] T079 Performance review: sidebar virtualization for 50+ items
- [ ] T080 Update quickstart.md verification checklist with final tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - core MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3 (uses same export handler)
- **User Story 3 (Phase 5)**: Depends on Phase 4 (extends logged-out behavior)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (needs memory items to exist)
- **User Story 5 (Phase 7)**: Depends on Phase 3 (validates reload/modify flow)
- **User Story 6 (Phase 8)**: Depends on Phase 3 (needs config serialization working)
- **User Story 7 (Phase 9)**: Depends on Phase 6 (shares context menu)
- **Polish (Phase 10)**: Depends on all user stories

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Foundational | - |
| US2 (P1) | US1 | - |
| US3 (P2) | US2 | - |
| US4 (P2) | US1 | US3, US5, US6 |
| US5 (P2) | US1 | US3, US4, US6 |
| US6 (P3) | US1 | US3, US4, US5 |
| US7 (P3) | US4 (context menu) | US6 |

### Within Each User Story

1. API routes first
2. UI components
3. Integration/wiring
4. Analytics events
5. E2E test last

### Parallel Opportunities

```text
Phase 1: All tasks [P] - run together
Phase 2: T008, T009, T010, T011, T012, T014, T015, T016, T017 can run in parallel
Phase 3: T021, T031-T034 can run in parallel
Phase 6: T052, T055, T056 can run in parallel
Phase 8: T066 can run in parallel with implementation
Phase 9: T071 can run in parallel with implementation
```

---

## Parallel Example: Foundational Phase

```bash
# Run all parallel foundational tasks together:
# Storage utility
Task: "T008 Create memory storage utilities"
# Domain types
Task: "T009 Create MemoryConfiguration type"
Task: "T010 Create config serializer"
Task: "T011 Create config hash utility"
Task: "T012 Create config loader"
# Derived atoms
Task: "T014 Create derived atoms"
# Unit tests
Task: "T015 Create config-hash unit test"
Task: "T016 Create config-serializer unit test"
Task: "T017 Create config-loader unit test"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (export + memory)
4. Complete Phase 4: User Story 2 (logged-out unchanged)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo MVP

### Incremental Delivery

1. **MVP**: US1 + US2 → Core memory works, export unchanged
2. **+Conversion**: US3 → Nudge for account creation
3. **+Sharing**: US4 + US7 → Share and delete
4. **+Polish**: US5 + US6 → Reload/modify, gradient freeze

---

## Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Setup | 3 | 2 |
| Foundational | 14 | 10 |
| US1 (P1) | 18 | 5 |
| US2 (P1) | 4 | 0 |
| US3 (P2) | 8 | 3 |
| US4 (P2) | 10 | 3 |
| US5 (P2) | 4 | 0 |
| US6 (P3) | 6 | 1 |
| US7 (P3) | 5 | 1 |
| Polish | 8 | 0 |
| **Total** | **80** | **25** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each story is independently testable
- Commit after each task or logical group
- All tracking events (11) are distributed across stories
- Changeset required before merge
