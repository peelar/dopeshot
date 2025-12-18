---
description: Generate detailed, phased implementation plans
---

# Create Plan Command

## Purpose
Generate detailed, phased implementation plans with clear success criteria.

## Instructions

When the user describes a feature or change:

1. **Research phase** (if needed):
   - Check existing research in `thoughts/research/`
   - Conduct additional research if gaps exist

2. **Generate a structured plan** with:
   - Overview explaining the approach
   - Why this approach was chosen
   - 3-5 implementation phases
   - Each phase includes:
     - Specific file changes with locations
     - Code examples where helpful
     - Automated verification commands
     - Manual verification checklist
     - **Test coverage requirements** (unit, component, integration, or E2E tests)
   - **Always include a Testing phase** to add appropriate test coverage
   - **Always include a Documentation phase** to update README.md
   - **Always include Analytics Tracking** for user-facing features using `track()` from `@/lib/analytics`

3. **Success criteria for each phase**:
   - Automated checks (tests, build, lint, types)
   - Manual verification steps
   - Rollback considerations

4. **Save the plan** with auto-incremented index:
   - Read existing files in `thoughts/plans/`
   - Find the highest numeric prefix (e.g., `01-`, `02-`, `07-`)
   - Save to `thoughts/plans/{highest_index+1}-[descriptive_name].md`
   - Example: If highest is `07-`, save as `08-my_new_plan.md`

## Plan Template

```markdown
# Implementation Plan: [Feature Name]

## Overview
[What we're building and why]

## Implementation Approach
[Strategy and rationale]

## Phase 1: [Phase Name]

### Changes Required

#### 1. [Component/File Name]
**File**: `path/to/file.ts`
**Changes**: [Description]

```typescript
// Example code
// Remember to add tracking events for user interactions:
import { track } from "@/lib/analytics";
track("event_name", { property: value });
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test` (or `pnpm test:ui && pnpm test:e2e`)
- [ ] Types check: `npm run typecheck`

#### Manual Verification
- [ ] [Specific behavior to verify]
- [ ] [Edge case to check]
- [ ] Analytics events fire correctly (check browser console or analytics dashboard)

#### Test Coverage
- [ ] Unit tests added for [utilities/pure functions]
- [ ] Component tests added for [React components]
- [ ] Integration/E2E tests added for [user workflows]
- [ ] Edge cases covered: [list specific edge cases]

---

## Phase 2: [Phase Name]
[Continue pattern...]

---

## Phase N-1: Testing

### Changes Required

#### 1. Add Test Coverage
**Files to create**:
- `tests/ui/[feature-name].test.ts` - Unit/component tests (if applicable)
- `tests/e2e/[feature-name].spec.ts` - Integration/E2E tests (if applicable)

**Test types to include**:
- **Unit tests** - Pure functions, utilities, calculations
- **Component tests** - React components with Vitest + React Testing Library
- **Integration tests** - User workflows with Playwright
- **Edge case tests** - Boundary conditions, error handling

**Example test structure**:
```typescript
import { describe, it, expect } from 'vitest';

describe('[Feature Name]', () => {
  describe('[Component/Function]', () => {
    it('handles normal case', () => {
      // Test implementation
    });

    it('handles edge case: [description]', () => {
      // Edge case test
    });
  });
});
```

### Success Criteria

#### Automated Verification
- [ ] All tests pass: `pnpm test:ui && pnpm test:e2e`
- [ ] Test coverage appropriate for feature complexity
- [ ] No flaky tests (run multiple times to verify)

#### Manual Verification
- [ ] Tests cover main user workflows
- [ ] Edge cases documented and tested
- [ ] Test fixtures created (if needed)
- [ ] Test names are descriptive and clear

---

## Phase N: Documentation

### Changes Required

#### 1. Update README.md
**File**: `README.md`
**Changes**: Document new feature/command

- Update "Available Commands" section with new command
- Add usage examples and options
- Update "Coming Soon" section if applicable
- Add any new configuration or setup steps
- Update project structure diagram if files added

### Success Criteria

#### Automated Verification
- [ ] README renders correctly in markdown preview

#### Manual Verification
- [ ] Command is documented with examples
- [ ] All options and flags are explained
- [ ] Usage is clear for new users
- [ ] Links and references are valid

---

## Rollback Plan
[How to revert if needed]
```

## Example Usage
> /2_create_plan
> Based on the research, add OAuth 2.0 support with Google and GitHub providers
