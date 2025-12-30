# Implementation Plan: DopeShot Memory

**Branch**: `001-memory` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-memory/spec.md`

## Summary

Introduce persistent export history for logged-in users via a collapsible left sidebar. Exports store configuration (not rendered images) for full reproducibility. Users can reload previous configs, share via public URLs, and manage items via right-click context menu. Export flow remains unchanged for logged-out users, with a subtle post-export nudge for account creation.

**Technical Approach**:
- New `MemoryItem` Prisma model with JSON configuration storage
- Supabase Storage bucket for screenshots (`memory-screenshots`)
- Jotai atoms for sidebar state and memory items cache
- shadcn/ui components (ContextMenu, Sheet) for sidebar UI
- Dynamic route `/[shareHash]` for public shared items

## Technical Context

**Language/Version**: TypeScript 5.6.3, Next.js 16.1.1, React 19.2.1
**Primary Dependencies**: Prisma 7.2.0, Jotai 2.15.2, better-auth 1.4.7, html-to-image 1.11.13, shadcn/ui, nanoid
**Storage**: PostgreSQL via Prisma, Supabase Storage for files
**Testing**: Vitest (unit/component), Playwright (e2e)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (Next.js app router)
**Performance Goals**: Sidebar loads 50 items in <1s, export+persist <3s, share URL loads <3s
**Constraints**: No blocking of export flow, silent background persistence, mobile-responsive sidebar
**Scale/Scope**: Unlimited memory items per user, 10MB max screenshot size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation Notes |
|-----------|--------|---------------------|
| shadcn/ui primitives + Tailwind | ✅ Pass | ContextMenu, Sheet, Button from shadcn/ui |
| Design sidebar reserved for styling | ✅ Pass | Memory sidebar is on LEFT, separate from right Design/Brand sidebar |
| Jotai atoms for global state | ✅ Pass | New atoms: `memorySidebarOpenAtom`, `memoryItemsAtom`, `showExportNudgeAtom` |
| `track()` events for user-facing features | ✅ Pass | 11 events defined in spec: sidebar open/close, item CRUD, share, nudge |
| Tests via `pnpm test:ui` and `pnpm test:e2e` | ✅ Pass | Unit tests for config hashing, E2E for export-persist-reload flow |
| Changeset for user-facing changes | ✅ Pass | Required - major new feature |

**No violations. All constitution principles satisfied.**

## Project Structure

### Documentation (this feature)

```text
specs/001-memory/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technical research
├── data-model.md        # Entity definitions
├── quickstart.md        # Setup guide
├── contracts/
│   └── memory-api.yaml  # OpenAPI spec
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
apps/app/
├── src/
│   ├── app/
│   │   ├── (playground)/
│   │   │   └── _components/
│   │   │       ├── playground-page.tsx    # Add MemorySidebar
│   │   │       └── memory-sidebar.tsx     # NEW: Sidebar component
│   │   ├── [shareHash]/
│   │   │   └── page.tsx                   # NEW: Public share route
│   │   └── api/
│   │       └── memory/
│   │           ├── items/
│   │           │   ├── route.ts           # NEW: List/Create
│   │           │   └── [itemId]/
│   │           │       ├── route.ts       # NEW: Get/Delete
│   │           │       └── share/
│   │           │           └── route.ts   # NEW: Share action
│   │           └── shared/
│   │               └── [shareHash]/
│   │                   └── route.ts       # NEW: Public fetch
│   ├── components/
│   │   └── memory/
│   │       ├── memory-sidebar.tsx         # NEW: Main sidebar
│   │       ├── memory-item.tsx            # NEW: Item card
│   │       ├── memory-context-menu.tsx    # NEW: Right-click menu
│   │       └── export-nudge.tsx           # NEW: Post-export CTA
│   ├── domain/
│   │   └── memory/
│   │       ├── config-hash.ts             # NEW: Hash generation
│   │       ├── config-serializer.ts       # NEW: Config to JSON
│   │       └── types.ts                   # NEW: MemoryConfiguration
│   ├── hooks/
│   │   ├── atoms/
│   │   │   └── memory.ts                  # NEW: Memory atoms
│   │   └── use-playground-controller.ts   # MODIFY: Add persist logic
│   └── lib/
│       └── storage/
│           └── memory-storage.ts          # NEW: Supabase upload
├── prisma/
│   └── schema.prisma                      # MODIFY: Add MemoryItem
└── tests/
    ├── unit/
    │   └── memory/
    │       └── config-hash.test.ts        # NEW
    ├── component/
    │   └── memory/
    │       └── memory-sidebar.test.tsx    # NEW
    └── e2e/
        └── memory/
            └── export-persist.spec.ts     # NEW
```

**Structure Decision**: Follows existing monorepo pattern with `apps/app/src/` as primary app. New `memory` domain folder for business logic, components in dedicated `memory` folder, API routes follow Next.js app router conventions.

## Complexity Tracking

> **No violations requiring justification.**

The implementation follows all constitution principles without exceptions.

## Implementation Phases

### Phase 1: Foundation (Database + Storage)
- Add `MemoryItem` to Prisma schema
- Create `memory-screenshots` Supabase bucket
- Implement storage upload/delete utilities

### Phase 2: Core Memory (Persist + Fetch)
- Create memory Jotai atoms
- Extend export flow to persist config
- Implement API routes (list, create, get, delete)
- Add config hash generation

### Phase 3: Sidebar UI
- Create MemorySidebar component
- Implement memory item thumbnail rendering
- Add to playground layout (left side)
- Implement load-config-into-editor flow

### Phase 4: Context Menu + Sharing
- Add ContextMenu with Share/Delete
- Implement share API route
- Create `/[shareHash]` public route
- Handle share URL visiting

### Phase 5: Post-Export Nudge
- Add nudge state atom
- Modify Export button for nudge state
- Wire up auth trigger
- Dismiss on interaction

### Phase 6: Polish + Testing
- Add all tracking events
- Write unit tests for config hashing
- Write E2E tests for full flow
- Add changeset
- Run `pnpm test:ui` and `pnpm test:e2e`

## Dependencies

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `nanoid` | ^5.0.0 | Share hash generation | To add |

All other dependencies already present in project.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large screenshot uploads slow export | Background upload, optimistic UI |
| Sidebar performance with many items | Virtual list, lazy thumbnail rendering |
| Config schema changes break old items | Version field, migration on load |
| Storage costs scale with users | Monitor usage, add limits later if needed |

## Next Steps

Run `/speckit.tasks` to generate detailed implementation tasks.
