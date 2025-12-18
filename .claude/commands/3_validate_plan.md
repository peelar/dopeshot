---
description: Verify implementation matches plan success criteria
---

# Validate Plan Command

## Purpose
Verify implementation matches the plan's success criteria and prepare for commit.

## Instructions

1. **Find the relevant plan**:
   - Use the most recent plan if none specified
   - Or find plan matching the described feature

2. **Check implementation status**:
   - Verify each phase's changes exist
   - Confirm code matches plan specifications

3. **Run automated verification**:
   - Build: `npm run build` (or equivalent)
   - Tests: `npm test` (or `pnpm test:ui && pnpm test:e2e && pnpm test:domain`)
   - Type checking: `npm run typecheck`
   - Linting: `npm run lint`

4. **Verify test coverage**:
   - Check that new functionality has appropriate test coverage
   - Verify test types match feature complexity:
     - Unit tests for utilities and pure functions
     - Component tests for UI components
     - Integration/E2E tests for user workflows
     - Visual regression tests for layout changes (if applicable)
   - Ensure edge cases are tested
   - Run `pnpm test:ui` and `pnpm test:e2e` to confirm all tests pass

5. **Code review**:
   - Check code follows project patterns
   - Verify security considerations
   - Confirm no regressions

6. **Generate validation report**:

```markdown
## Validation Report: [Feature Name]

### Implementation Status
✓ Phase 1: [Name] - Fully implemented
✓ Phase 2: [Name] - Fully implemented
⚠️ Phase 3: [Name] - Partial (see notes)

### Automated Verification Results
✓ Build passes
✓ All [X] tests pass
✓ Type checking clean
✓ No linting issues

### Test Coverage Assessment
✓ Unit tests added for [components/utilities]
✓ Component tests added for [UI components]
✓ Integration/E2E tests added for [workflows]
✓ Edge cases covered: [list edge cases tested]
⚠️ Missing coverage: [any gaps]

### Code Review Findings

#### Matches Plan
- [Confirmation of key implementations]

#### Deviations
- [Any differences from plan with rationale]

#### Security Validation
- [Security checks performed]

### Manual Testing Checklist
- [ ] [Item to manually verify]
- [ ] [Another item]

### Ready to Commit
[Yes/No with any conditions]
```
