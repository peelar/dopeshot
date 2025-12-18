# Testing Requirements

## Overview

All new features and functionality in dopeshot **must include appropriate test coverage** before being considered complete. This ensures code quality, prevents regressions, and enables confident refactoring.

## When to Add Tests

✅ **Always add tests when:**
- Adding new features or functionality
- Implementing user workflows
- Creating new utilities or pure functions
- Building UI components
- Modifying export functionality
- Changing layout/rendering logic

❌ **Tests may be optional for:**
- Minor documentation changes
- Trivial refactoring without behavior changes
- Configuration file updates

## Test Types & When to Use Them

### 1. Unit Tests (Vitest)

**Use for:** Pure functions, utilities, calculations, business logic

**Location:** `tests/ui/*.test.ts`

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculatePixelRatio } from '@/domain/layout/export';

describe('calculatePixelRatio', () => {
  it('defaults to device pixel ratio or 2', () => {
    expect(calculatePixelRatio({ devicePixelRatio: 1 })).toBe(2);
  });

  it('clamps to range [1, 3]', () => {
    expect(calculatePixelRatio({ desiredPixelRatio: 10 })).toBe(3);
  });
});
```

**Run:** `pnpm test:ui`

---

### 2. Component Tests (Vitest + React Testing Library)

**Use for:** React components, UI rendering, user interactions

**Location:** `tests/ui/*.test.tsx`

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

**Run:** `pnpm test:ui`

---

### 3. Integration Tests (Playwright)

**Use for:** End-to-end workflows, user journeys, multi-step interactions

**Location:** `tests/e2e/*.spec.ts`

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('exports PNG after uploading screenshot', async ({ page }) => {
  await page.goto('/');

  // Upload screenshot
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/screenshot.png');

  // Wait for preview
  await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

  // Export
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('cover-image.png');
});
```

**Run:** `pnpm test:e2e`

---

### 4. Visual Regression Tests (Playwright Visual)

**Use for:** Layout changes, UI redesigns, export consistency

**Location:** `tests/e2e/*.spec.ts`

**Example:**
```typescript
test('export container matches baseline', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/screenshot.png');

  const exportContainer = page.locator('#export-container');
  await expect(exportContainer).toHaveScreenshot('export-baseline.png', {
    maxDiffPixels: 100,
  });
});
```

**Update baselines:** `pnpm test:e2e:update-snapshots`

---

### 5. Edge Case Tests

**Use for:** Boundary conditions, error handling, extreme inputs

**Example scenarios:**
- Very large files (4K screenshots)
- Very small files (<500px)
- Extreme aspect ratios
- Empty states
- Invalid inputs
- Network failures

**Include in:** Any of the above test types

---

## Coverage Requirements by Feature Type

| Feature Type | Required Tests | Examples |
|--------------|----------------|----------|
| **New utility function** | Unit tests (100% coverage) | `calculatePixelRatio()`, `getExportDimensions()` |
| **New UI component** | Component tests + visual regression | Button variants, modal dialogs |
| **New user workflow** | Integration tests + edge cases | Upload → customize → export |
| **Export/rendering change** | Visual regression + geometric validation | Layout changes, scaling adjustments |
| **State management** | Component tests + integration tests | Jotai atoms, global state |

## Success Criteria

A feature is **complete** when:
- ✅ All automated tests pass (`pnpm test:ui && pnpm test:e2e`)
- ✅ Test coverage is appropriate for feature complexity
- ✅ Edge cases are identified and tested
- ✅ No flaky tests (tests pass consistently)
- ✅ Test names are descriptive and clear

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:domain    # Domain logic (Node.js)
pnpm test:ui        # Unit/component tests (Vitest)
pnpm test:e2e       # Integration tests (Playwright)

# Run with CI checks
pnpm test:ci        # All tests + typecheck

# Update visual baselines
pnpm test:e2e:update-snapshots
```

## Testing Strategy

For comprehensive testing patterns and strategies, see:
- **[Export Testing Strategy](../thoughts/research/009-export-testing-strategy.md)** - Detailed 5-layer testing approach for export functionality
- **[Testing Implementation Plan](../thoughts/plans/08-export-testing-implementation.md)** - Step-by-step plan for adding test coverage

## Best Practices

### Writing Good Tests

✅ **Do:**
- Use descriptive test names that explain what is being tested
- Test behavior, not implementation details
- Use semantic queries (`getByRole`, `getByText`) for accessibility
- Add comments for complex test logic
- Group related tests with `describe` blocks
- Test edge cases and error conditions

❌ **Don't:**
- Test internal implementation details
- Use brittle selectors (class names, DOM structure)
- Write flaky tests with random timeouts
- Skip edge case testing
- Leave failing tests commented out

### Test Organization

```
tests/
├── fixtures/           # Test data (screenshots, images)
├── helpers/            # Test utilities and helpers
├── ui/                 # Unit and component tests (Vitest)
│   ├── button.test.tsx
│   ├── export-utils.test.ts
│   └── ...
├── e2e/                # Integration tests (Playwright)
│   ├── playground.spec.ts
│   ├── export.spec.ts
│   └── ...
└── __snapshots__/      # Visual regression baselines
```

### Test Fixtures

Create reusable test fixtures in `tests/fixtures/`:
- `screenshot-1280x720.png` - Desktop aspect ratio
- `screenshot-720x1280.png` - Mobile aspect ratio
- `screenshot-4k.png` - Large screenshot
- `screenshot-small.png` - Small screenshot

**Generate fixtures:** `pnpm tsx tests/helpers/generate-fixtures.ts`

## Debugging Failed Tests

### Unit/Component Tests (Vitest)
```bash
# Run specific test file
pnpm vitest tests/ui/export-utils.test.ts

# Run in watch mode
pnpm vitest --watch

# Show detailed output
pnpm vitest --reporter=verbose
```

### Integration Tests (Playwright)
```bash
# Run specific test
pnpm playwright test export.spec.ts

# Run in headed mode (see browser)
pnpm playwright test --headed

# Debug mode (step through)
pnpm playwright test --debug

# Generate trace for debugging
pnpm playwright test --trace on
```

### Visual Regression Failures
1. Check `test-results/` for diff images
2. Review visual changes in baseline vs actual
3. If changes are intentional, update baselines:
   ```bash
   pnpm test:e2e:update-snapshots
   ```
4. Commit new baselines to git

## CI/CD Integration

Tests run automatically on every push/PR via GitHub Actions:
1. TypeScript compilation
2. Domain tests
3. UI tests
4. E2E tests

**Artifacts:** Failed tests upload snapshots/diffs for debugging.

## Questions?

For questions about testing:
- See research: `thoughts/research/009-export-testing-strategy.md`
- See implementation plan: `thoughts/plans/08-export-testing-implementation.md`
- Check existing tests for patterns
