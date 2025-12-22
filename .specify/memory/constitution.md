<!--
Sync Impact Report
- Version change: TEMPLATE -> 0.1.0
- Modified principles: Template Principle 1 -> Delightful UX & Focused Controls; Template Principle 2 -> Shadcn + Tailwind Primitives; Template Principle 3 -> State & Module Hygiene; Template Principle 4 -> Instrumentation First; Template Principle 5 -> Test-verified Delivery
- Added sections: Tooling & Release Constraints; Development Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: TODO(RATIFICATION_DATE): original ratification date not found in repo history
-->
# dopeshot Constitution

## Core Principles

### Delightful UX & Focused Controls
All UI changes MUST prioritize a fast, clear, and delightful experience. The Design
sidebar is reserved for styling controls, and look/variant switching stays in the
rail/toggle above the canvas. Be highly selective about adding new sidebar items;
only add them if they remove steps or reduce complexity for users.

### Shadcn + Tailwind Primitives
UI primitives MUST be built with shadcn/ui and styled with Tailwind. Introduce a
custom primitive only when shadcn/ui cannot meet the requirement, and document
the rationale in the PR or plan.

### State & Module Hygiene
Global state MUST use Jotai atoms; avoid prop drilling and callback chains. Do not
introduce new catch-all `utils.ts` files; collocate helpers within domain-specific
modules. When touching critical paths, leave them cleaner than found or document
why a refactor was deferred.

### Instrumentation First
All new user-facing functionality MUST add tracking events using `track()` from
`@/lib/analytics` with descriptive event names and relevant properties capturing
user interactions, state changes, and feature usage.

### Test-verified Delivery
Every new feature or behavior change MUST include test coverage aligned with the
documented strategy (unit, component, integration, visual regression, and edge
case tests as applicable). Run `pnpm test:ui` and `pnpm test:e2e` before marking
work complete; any exceptions require written justification in the plan.

## Tooling & Release Constraints

- Package management MUST use `pnpm` for installs and scripts.
- User-facing changes MUST include a Changeset (`pnpm changeset`) that follows
  `docs/RELEASE_WORKFLOW.md`.
- After larger features or refactors, propose a `knip` cleanup pass to keep the
  codebase lean.

## Development Workflow & Quality Gates

- Every implementation plan MUST include a Constitution Check, and any violations
  must be justified in the plan's complexity tracking section.
- Specifications MUST define required tracking events and test expectations for
  each user story.
- PRs must verify tests pass (`pnpm test:ui`, `pnpm test:e2e`) and include any
  required Changesets before merge.

## Governance

- This constitution supersedes conflicting practices or ad-hoc guidance.
- Amendments require updating this document, recording rationale, and bumping the
  version according to semantic versioning (MAJOR for removals or redefinitions,
  MINOR for new or expanded guidance, PATCH for clarifications).
- Compliance is reviewed in plans and PRs; any exception must be explicit and
  time-bounded with a documented remediation plan.

**Version**: 0.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original ratification date not found in repo history | **Last Amended**: 2025-12-22
