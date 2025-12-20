<!--
SYNC IMPACT REPORT
==================
Version Change: None → 1.0.0 (Initial Constitution)
Modified Principles: N/A (initial creation)

Added Sections:
  - Core Principles (5 principles: Test Coverage, User Experience, Code Quality, Observability, Performance)
  - Testing Standards (Unit, Component, Integration, Visual Regression, Edge Case)
  - Performance Requirements (Load Time, Runtime, Bundle Size, Optimization Strategies)
  - Governance (Amendment Process, Compliance Verification, Versioning Policy)

Removed Sections: N/A

Templates Updated:
  ✅ .specify/templates/plan-template.md
     - Added Constitution Check section with 5 principle checkboxes
     - Added Complexity Justification requirements

  ✅ .specify/templates/spec-template.md
     - Added constitution alignment guidance in Requirements section
     - Added Non-Functional Requirements (NFR) subsection for constitution compliance
     - Included NFR-001 through NFR-004 covering all 5 principles

  ✅ .specify/templates/tasks-template.md
     - Changed tests from OPTIONAL to MANDATORY (Principle I)
     - Updated test strategy to include all 5 test types from constitution
     - Added analytics tracking tasks (Principle IV)
     - Added performance verification tasks (Principle V)
     - Fixed task ID numbering conflicts

  ✅ Command files (.claude/commands/speckit.*.md)
     - No changes required (generic guidance already present)

Follow-up TODOs: None
-->

# dopeshot Project Constitution

## Core Principles

### I. Test Coverage is Non-Negotiable

All new features and functionality MUST include appropriate test coverage before implementation is considered complete. Tests are written FIRST, verified to FAIL, then implementation proceeds (Red-Green-Refactor).

**Testing Strategy (per `thoughts/research/009-export-testing-strategy.md`):**
- **Unit tests** (Vitest) for pure functions and utilities
- **Component tests** (Vitest + React Testing Library) for UI components
- **Integration tests** (Playwright) for E2E workflows
- **Visual regression tests** (Playwright) for layout/UI changes when applicable
- **Edge case tests** for boundary conditions and error handling

**Verification:** Run `pnpm test:ui` and `pnpm test:e2e` before considering feature complete. CI MUST pass.

**Rationale:** Untested code creates technical debt and enables regressions. dopeshot is a visual tool where correctness is critical—users expect pixel-perfect exports and consistent rendering. Test-first development catches issues before they reach users.

### II. User Experience Consistency

All UI components MUST provide a delightful, snappy, and easy-to-understand experience with minimal cognitive load.

**Requirements:**
- Use shadcn/ui CLI for primitive components, styled with Tailwind
- Avoid prop drilling—use Jotai atoms for state management
- Keep the Design sidebar focused on styling only; variant/look switching stays in the rail/toggle above canvas
- Be extremely hesitant about adding new sidebar items—every UI element MUST justify its existence
- Interactions MUST feel instant (perceived performance < 100ms)
- Design should be intelligent with zero unnecessary clicks

**Rationale:** dopeshot targets indie hackers who value speed and simplicity. Every extra click, every moment of confusion, every sluggish interaction erodes trust. The tool should feel like it reads the user's mind.

### III. Code Quality & Maintainability

Code MUST be simple, focused, and maintainable. Avoid over-engineering and premature abstractions.

**Requirements:**
- Only make changes directly requested or clearly necessary
- No feature creep—a bug fix doesn't need surrounding code cleanup
- No unnecessary docstrings, comments, or type annotations on unchanged code
- No error handling for scenarios that can't happen—trust internal code and framework guarantees
- No helpers/utilities for one-time operations—three similar lines beats premature abstraction
- No backwards-compatibility hacks (unused `_vars`, re-exports, `// removed` comments)—delete unused code completely
- Collocate helpers or use domain-specific modules—avoid catch-all `utils.ts`
- Actively refactor crucial parts of the codebase when opportunities arise

**Rationale:** Complexity is the enemy of velocity. The right amount of complexity is the minimum needed for the current task. We're building for tomorrow, not maintaining legacy cruft from yesterday.

### IV. Observability & Analytics

All new user-facing functionality MUST include tracking events to measure usage and inform product decisions.

**Requirements:**
- Use `track()` from `@/lib/analytics` for all user interactions
- Track state changes, feature usage, button clicks, and meaningful events
- Include descriptive event names and relevant properties (e.g., `track("feature_used", { property: value })`)
- Events should answer: "Did users find this feature?" and "How are they using it?"

**Rationale:** Data-driven decisions beat intuition. Tracking reveals what users actually do versus what we think they do. Without observability, we're optimizing in the dark.

### V. Performance & Responsiveness

All features MUST feel instant and snappy. Performance is a feature, not an optimization phase.

**Requirements:**
- Preview rendering MUST update within 100ms of user input
- Export functionality MUST complete within 3 seconds for typical screenshots (< 2MB)
- Page load time MUST be under 2 seconds on cable connection (measure with Lighthouse)
- Use lazy loading for heavy components (layouts, fonts, large assets)
- Optimize bundle size—run `knip` after major features to remove dead code
- Monitor performance regressions in CI (Lighthouse checks on PRs)

**Rationale:** Indie hackers are impatient. If the tool feels slow, they'll abandon it. Performance impacts every interaction—it's not something to "fix later."

## Testing Standards

### Unit Tests (Vitest)

**Purpose:** Validate pure functions, utilities, and domain logic in isolation.

**Requirements:**
- Test files: `tests/*.test.ts` or `tests/ui/*.test.tsx`
- Use `node:assert` for domain tests, Vitest assertions for UI tests
- Achieve 100% coverage for exported utility functions
- Test edge cases: empty inputs, nulls, extreme values, boundary conditions
- Use `tests/helpers/` for test utilities (e.g., `image-factory.ts` for programmatic image creation)

**Examples:**
- Color extraction algorithms
- Gradient generation logic
- Export dimension calculations
- Pixel ratio logic

### Component Tests (Vitest + React Testing Library)

**Purpose:** Verify React components render correctly with various props and states.

**Requirements:**
- Test files: `tests/ui/*.test.tsx`
- Use `@testing-library/react` for rendering and queries
- Focus on user-facing behavior, not implementation details
- Test accessibility (ARIA attributes, keyboard navigation)
- Mock Jotai atoms when testing stateful components

**Examples:**
- Button rendering and interactions
- Export container setup and dimensions
- Layout components with `isStatic` prop

### Integration Tests (Playwright)

**Purpose:** Validate end-to-end user workflows in a real browser environment.

**Requirements:**
- Test files: `tests/e2e/*.spec.ts`
- Use semantic selectors (roles, labels) over CSS selectors
- Test critical paths: upload → customize → export
- Verify downloads, file names, and file integrity
- Test validation flows (disabled states, error messages)
- Run in CI (chromium only for speed; local testing can use all browsers)

**Examples:**
- Screenshot upload and preview rendering
- Export button workflow and file download
- Layout switching and variant selection

### Visual Regression Tests (Playwright Visual)

**Purpose:** Catch unintended visual changes in layouts and exports.

**Requirements:**
- Test files: `tests/e2e/*-visual.spec.ts`
- Use `toHaveScreenshot()` for baseline comparisons
- Set tolerance thresholds (`maxDiffPixels: 100`, `threshold: 0.01`)
- Generate baselines for all looks/variants/orientations
- Update baselines explicitly with `pnpm playwright test --update-snapshots`
- Store baselines in `tests/__screenshots__/`

**Examples:**
- Preview vs. export rendering consistency
- Layout rendering across all looks
- Theme and typography changes

### Edge Case Tests

**Purpose:** Ensure system handles boundary conditions gracefully.

**Requirements:**
- Test extreme inputs: very large screenshots (4K+), very small (< 500px), extreme aspect ratios
- Test empty states: no screenshot uploaded, missing metadata
- Test error scenarios: network failures, unsupported file types, corrupt images
- Test limits: file size caps (5MB for logos), export timeouts

**Examples:**
- Ultra-wide screenshots (21:9) in 16:9 layouts
- 8K screenshot uploads (performance)
- Empty export container (no screenshot)

## Performance Requirements

### Load Time Standards

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.0s | Lighthouse |
| **Time to Interactive (TTI)** | < 2.0s | Lighthouse |
| **Largest Contentful Paint (LCP)** | < 1.5s | Lighthouse |
| **Total Blocking Time (TBT)** | < 200ms | Lighthouse |

### Runtime Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Preview render update** | < 100ms | User perception |
| **Export generation** | < 3s | Analytics tracking |
| **Font loading** | < 500ms | `document.fonts.ready` |
| **Layout switch** | < 50ms | Jotai state update |

### Bundle Size Limits

| Asset | Max Size | Current | Tool |
|-------|----------|---------|------|
| **Initial JS bundle** | 200 KB (gzipped) | TBD | `next build` analysis |
| **Initial CSS bundle** | 50 KB (gzipped) | TBD | `next build` analysis |
| **Font files (combined)** | 100 KB (woff2) | TBD | Manual audit |

### Optimization Strategies

- **Code splitting:** Lazy load layouts (`React.lazy()` for `components/layouts/*`)
- **Tree shaking:** Run `knip` after major features to remove dead code
- **Image optimization:** Use `next/image` with WebP format, responsive sizes
- **Font subsetting:** Only include used glyphs in typography presets
- **Caching:** Leverage Next.js static generation and CDN caching

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:

1. **Documentation:** Proposed change documented in PR description with rationale
2. **Review:** At least one maintainer approval
3. **Impact Analysis:** Sync impact report for template updates (if applicable)
4. **Migration Plan:** If change affects existing code, provide migration checklist

### Compliance Verification

All PRs and code reviews MUST verify compliance with this constitution:

- ✅ Tests written and passing (`pnpm test:ui`, `pnpm test:e2e`)
- ✅ Analytics tracking added (if user-facing feature)
- ✅ Performance validated (Lighthouse score > 90)
- ✅ Code simplicity justified (no over-engineering)
- ✅ Changeset added (`pnpm changeset`) for user-facing changes

### Versioning Policy

Constitution follows semantic versioning:

- **MAJOR:** Backward-incompatible governance/principle removals or redefinitions
- **MINOR:** New principle/section added or materially expanded guidance
- **PATCH:** Clarifications, wording fixes, non-semantic refinements

### Complexity Justification

If a feature violates simplicity principles (Principle III), justification MUST be documented in `plan.md` Complexity Tracking table:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Example: Repository pattern | Supabase RLS requires abstraction | Direct DB access exposes security risks |

### Runtime Guidance

For day-to-day development guidance, refer to:
- `CLAUDE.md` - Agent-specific instructions and project rules
- `docs/development/folder-structure.md` - Code organization standards
- `thoughts/research/` - Technical decision records and research

**Version**: 1.0.0 | **Ratified**: 2025-12-20 | **Last Amended**: 2025-12-20
