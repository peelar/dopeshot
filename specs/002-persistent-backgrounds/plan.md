# Implementation Plan: Persistent Backgrounds

**Branch**: `002-persistent-backgrounds` | **Date**: 2025-12-22 | **Spec**: `/Users/adrianpilarczyk/Code/dopeshot/specs/002-persistent-backgrounds/spec.md`
**Input**: Feature specification from `/specs/002-persistent-backgrounds/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add persistent background libraries with two layers: curated presets for branded
users and personal uploads for logged-in users. Persist background selections
and assets across sessions, with private personal storage and curated preset
availability, plus instrumentation and test coverage per constitution.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.0.7, React 19.2.1, Tailwind, shadcn/ui, Jotai  
**Storage**: Supabase Postgres (via Prisma), Supabase Storage (`curated-backgrounds`, `user-backgrounds`)  
**Testing**: Vitest, React Testing Library, Playwright  
**Target Platform**: Web (modern browsers)  
**Project Type**: Web app (monorepo)  
**Performance Goals**: Background list loads within 1s for <= 50 items; apply selection within 300ms  
**Constraints**: Upload size limit 10MB; accepted formats PNG/JPG/WebP; no loss of current selection on failure  
**Scale/Scope**: 10-20 curated presets; typical user library <= 50 assets  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Use shadcn/ui primitives styled with Tailwind for UI work. (PASS)
- Keep Design sidebar reserved for styling; look/variant switching stays in rail. (PASS)
- Use Jotai atoms for global state; avoid new catch-all `utils.ts`. (PASS)
- Add `track()` events for new user-facing functionality. (PASS)
- Include required tests and plan to run `pnpm test:ui` and `pnpm test:e2e`. (PASS)
- Add a Changeset for user-facing changes or document why not needed. (PASS)

## Project Structure

### Documentation (this feature)

```text
specs/002-persistent-backgrounds/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── app/                 # Product app (background UI + persistence)
└── landing/             # Marketing site (not targeted)

packages/                # Shared packages (if needed)
```

**Structure Decision**: Web app in `apps/app`, with any shared utilities kept
near feature scope or in a domain module if reused.

## Phase 0: Research

### Unknowns to Resolve

- Performance goals for background library loading and selection latency.
- Upload constraints (file size limits, formats) aligned with UX expectations.
- Expected scale for curated and personal background libraries.

### Research Tasks

- Research background selection UX performance targets for creative tools.
- Research practical upload size/format constraints for background assets.
- Research typical library sizes to define pagination or lazy-load thresholds.

## Phase 1: Design & Contracts

### Data Model

- Define preset, personal, and selection entities with metadata and ownership.
- Capture validation rules (file size, format, visibility, removal semantics).
- Document state transitions for selection and removal.

### API Contracts

- Preset backgrounds listing.
- Personal backgrounds listing, upload, delete.
- Background selection persistence.

### Quickstart

- Step-by-step verification for preset selection, upload, deletion, and
  persistence across sessions.

## Phase 1: Constitution Check (Post-Design)

- Confirm UI placement in background sidebar adheres to focused controls.
- Confirm state management uses Jotai atoms where global.
- Confirm instrumentation events are specified and wired.
- Confirm test coverage plan spans unit, component, integration, and E2E.
- Confirm Changeset requirement is captured in tasks planning.

## Complexity Tracking

No violations identified.
