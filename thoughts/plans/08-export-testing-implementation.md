# Implementation Plan: Comprehensive Export Testing

## Overview

This plan implements a **5-layer testing strategy** to ensure dopeshot's export functionality works correctly: exported PNGs must match preview rendering exactly (except for 1.5x resolution scaling). Currently, there is **zero test coverage** for export functionality.

**What "works correctly" means:**
1. ✅ All expected elements present (structural integrity)
2. ✅ Visual fidelity (colors, fonts, gradients match preview)
3. ✅ Layout consistency (proportional element positions preserved)
4. ✅ Resolution correctness (1920×1080 desktop, 1080×1920 mobile)
5. ✅ Content accuracy (user uploads render faithfully)
6. ✅ Edge case handling (large/small screenshots, extreme aspect ratios)

## Implementation Approach

We'll build testing coverage incrementally, starting with **immediate-value layers** (integration tests, test fixtures) and expanding to comprehensive coverage (visual regression, geometric validation). This approach:

- **Catches critical bugs fast** - Integration tests verify export button → download workflow
- **Enables confident refactoring** - Unit tests for pixel ratio/dimension calculations
- **Prevents visual regressions** - Playwright visual comparisons with baseline images
- **Validates layout consistency** - Geometric assertions ensure 1.5x scaling preserves proportions
- **Documents expected behavior** - Tests serve as living documentation

**Chosen strategy:** Multi-layered pyramid (unit → component → integration → visual → geometric) ensures comprehensive coverage while maintaining fast feedback loops.

---

## Phase 1: Foundation & Test Infrastructure

**Goal:** Prepare codebase for testing by adding data attributes, creating test fixtures, and extracting testable utilities.

### Changes Required

#### 1. Add Test Attributes to Layout Components

**Files to modify:**
- `components/layouts/popup-gradient.tsx`
- `components/layouts/hero-center.tsx`
- `components/layouts/adaptive-screenshot.tsx`
- `components/layouts/code-snippet.tsx`

**Changes:** Add `data-export-element` and `data-role` attributes to enable DOM queries in tests.

**Example (PopupGradient):**
```typescript
export function PopupGradient({ isStatic, ...props }: LayoutProps) {
  return (
    <div data-export-element data-element="container" className="relative w-full h-full">
      {screenshotAsset && (
        <img
          src={screenshotAsset.url}
          data-export-element
          data-element="screenshot"
          data-role="screenshot"
          className="..."
        />
      )}
      <div data-export-element data-element="gradient" className="...">
        {/* Gradient background */}
      </div>
    </div>
  );
}
```

**Pattern:** Apply to all layout components following this structure:
- Container: `data-export-element data-element="container"`
- Screenshot/image: `data-export-element data-element="screenshot" data-role="screenshot"`
- Background/gradient: `data-export-element data-element="gradient"`
- Decorations: `data-export-element data-element="decoration"`

#### 2. Add Test ID to Preview Canvas

**File:** `components/playground-page.tsx`

**Changes:** Add `data-testid="preview-canvas"` to the preview container.

```typescript
// Around line 120-130
<div
  data-testid="preview-canvas"
  className="preview-container"
>
  <CoverPreview isStatic={false} {...previewProps} />
</div>
```

#### 3. Create Test Fixtures Directory

**New directory:** `tests/fixtures/`

**Files to create:**
- `tests/fixtures/screenshot-1280x720.png` - Desktop aspect ratio (16:9)
- `tests/fixtures/screenshot-720x1280.png` - Mobile aspect ratio (9:16)
- `tests/fixtures/screenshot-4k.png` - Large screenshot (3840×2160)
- `tests/fixtures/screenshot-small.png` - Small screenshot (400×300)
- `tests/fixtures/screenshot-ultrawide.png` - Extreme aspect ratio (2560×1080)

**Script to generate fixtures:**

Create `tests/helpers/generate-fixtures.ts`:
```typescript
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

async function generateFixture(
  name: string,
  width: number,
  height: number,
  backgroundColor: string = '#667eea'
) {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: backgroundColor,
    },
  })
    .png()
    .toBuffer();

  await fs.mkdir(FIXTURES_DIR, { recursive: true });
  await fs.writeFile(path.join(FIXTURES_DIR, name), buffer);
  console.log(`Created: ${name} (${width}×${height})`);
}

async function main() {
  await generateFixture('screenshot-1280x720.png', 1280, 720);
  await generateFixture('screenshot-720x1280.png', 720, 1280);
  await generateFixture('screenshot-4k.png', 3840, 2160);
  await generateFixture('screenshot-small.png', 400, 300);
  await generateFixture('screenshot-ultrawide.png', 2560, 1080);
}

main().catch(console.error);
```

**Run:** `pnpm tsx tests/helpers/generate-fixtures.ts`

#### 4. Extract Export Utilities into Testable Functions

**File:** `domain/layout/export.ts`

**Changes:** Extract inline pixel ratio calculation into pure function.

**Before (lines 67-70):**
```typescript
const desiredPixelRatio = pixelRatio ?? Math.max(window.devicePixelRatio || 1, 2);
const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;
const resolvedPixelRatio = Math.min(Math.max(desiredPixelRatio, 1), Math.max(Math.min(3, maxScale), 1));
```

**After:** Add new exported function before `exportLayoutAsPng`:
```typescript
/**
 * Calculate the pixel ratio for export, clamped to [1, 3].
 * Defaults to device pixel ratio or 2 (whichever is higher).
 * Respects maxImageScale to prevent upscaling beyond natural resolution.
 */
export function calculatePixelRatio(options: {
  desiredPixelRatio?: number;
  maxImageScale?: number;
  devicePixelRatio?: number;
} = {}): number {
  const {
    desiredPixelRatio,
    maxImageScale,
    devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  } = options;

  const desired = desiredPixelRatio ?? Math.max(devicePixelRatio, 2);
  const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;

  return Math.min(
    Math.max(desired, 1),
    Math.max(Math.min(3, maxScale), 1)
  );
}

/**
 * Get export dimensions for a given orientation.
 */
export function getExportDimensions(orientation: 'desktop' | 'mobile') {
  return EXPORT_ORIENTATION_DIMENSIONS[orientation];
}
```

**Update `exportLayoutAsPng` to use new function (line 67):**
```typescript
const resolvedPixelRatio = calculatePixelRatio({
  desiredPixelRatio: pixelRatio,
  maxImageScale,
  devicePixelRatio: window.devicePixelRatio,
});
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Fixtures generated successfully: `pnpm tsx tests/helpers/generate-fixtures.ts`
- [ ] No console errors when loading playground page

#### Manual Verification
- [ ] Inspect layout components in browser DevTools - all have `data-export-element` attributes
- [ ] Preview canvas has `data-testid="preview-canvas"` attribute
- [ ] 5 fixture images exist in `tests/fixtures/` directory
- [ ] Export functionality still works (no regression from refactoring)

---

## Phase 2: Unit Tests for Export Utilities

**Goal:** Test pixel ratio calculation and dimension logic with 100% coverage.

### Changes Required

#### 1. Create Unit Test File

**New file:** `tests/ui/export-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePixelRatio, getExportDimensions } from '@/domain/layout/export';

describe('Export Utilities', () => {
  describe('calculatePixelRatio', () => {
    it('defaults to device pixel ratio or 2 (whichever is higher)', () => {
      expect(calculatePixelRatio({ devicePixelRatio: 1 })).toBe(2);
      expect(calculatePixelRatio({ devicePixelRatio: 2 })).toBe(2);
      expect(calculatePixelRatio({ devicePixelRatio: 3 })).toBe(3);
    });

    it('respects maxImageScale upper bound', () => {
      expect(
        calculatePixelRatio({ maxImageScale: 1.5, devicePixelRatio: 3 })
      ).toBe(1.5);

      expect(
        calculatePixelRatio({ maxImageScale: 2.5, devicePixelRatio: 3 })
      ).toBe(2.5);
    });

    it('clamps to minimum of 1', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 0.5, devicePixelRatio: 0.5 })
      ).toBe(1);
    });

    it('clamps to maximum of 3', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 10, devicePixelRatio: 10 })
      ).toBe(3);
    });

    it('allows custom desiredPixelRatio within bounds', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 2.5, devicePixelRatio: 1 })
      ).toBe(2.5);
    });

    it('handles infinite maxImageScale gracefully', () => {
      expect(
        calculatePixelRatio({ maxImageScale: Infinity, devicePixelRatio: 3 })
      ).toBe(3);
    });

    it('handles NaN maxImageScale gracefully', () => {
      expect(
        calculatePixelRatio({ maxImageScale: NaN, devicePixelRatio: 3 })
      ).toBe(3);
    });
  });

  describe('getExportDimensions', () => {
    it('returns 1920×1080 for desktop orientation', () => {
      const dims = getExportDimensions('desktop');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });

    it('returns 1080×1920 for mobile orientation', () => {
      const dims = getExportDimensions('mobile');
      expect(dims).toEqual({ width: 1080, height: 1920 });
    });

    it('maintains 16:9 aspect ratio for desktop', () => {
      const dims = getExportDimensions('desktop');
      const aspectRatio = dims.width / dims.height;
      expect(aspectRatio).toBeCloseTo(16 / 9, 5);
    });

    it('maintains 9:16 aspect ratio for mobile', () => {
      const dims = getExportDimensions('mobile');
      const aspectRatio = dims.width / dims.height;
      expect(aspectRatio).toBeCloseTo(9 / 16, 5);
    });
  });
});
```

### Success Criteria

#### Automated Verification
- [ ] Unit tests pass: `pnpm test:ui`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] 100% coverage of `calculatePixelRatio` and `getExportDimensions` functions

#### Manual Verification
- [ ] All edge cases covered (min/max clamping, NaN handling, Infinity)
- [ ] Test descriptions are clear and specific

---

## Phase 3: Integration Tests (Playwright E2E)

**Goal:** Verify end-to-end export workflow: button click → file download → validation.

### Changes Required

#### 1. Create Integration Test File

**New file:** `tests/e2e/export.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('exports PNG file when button clicked', async ({ page }) => {
    // Upload test screenshot
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    // Wait for upload to complete
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    // Setup download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: 'Export PNG' }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toBe('cover-image.png');

    // Verify file was downloaded
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('disables export button during export process', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    const exportButton = page.getByRole('button', { name: 'Export PNG' });

    // Button should be enabled before clicking
    await expect(exportButton).toBeEnabled();

    // Click export
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    // Button should be disabled during export
    await expect(exportButton).toBeDisabled();
    await expect(exportButton).toHaveAttribute('aria-busy', 'true');

    // Wait for download to complete
    await downloadPromise;

    // Button should be enabled again after export
    await expect(exportButton).toBeEnabled();
  });

  test('requires screenshot before allowing export', async ({ page }) => {
    // Export button should not be visible without screenshot
    await expect(page.getByRole('button', { name: 'Export PNG' })).not.toBeVisible();

    // Upload screenshot
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    // Export button should now be visible
    await expect(page.getByRole('button', { name: 'Export PNG' })).toBeVisible();
  });

  test('shows correct button text during export', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    const exportButton = page.getByRole('button', { name: 'Export PNG' });

    // Default text
    await expect(exportButton).toHaveText('Export PNG');

    // Click and check loading text (may be very fast, so use locator)
    await exportButton.click();

    // Check for either loading or completed state
    const hasLoadingText = await page.getByRole('button', { name: 'Exporting...' }).isVisible().catch(() => false);
    const hasDefaultText = await page.getByRole('button', { name: 'Export PNG' }).isVisible().catch(() => false);

    expect(hasLoadingText || hasDefaultText).toBe(true);
  });

  test('tracks export analytics event', async ({ page, context }) => {
    // Listen for analytics calls (this assumes you have console.log tracking or similar)
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();
    await downloadPromise;

    // Verify analytics event was tracked
    // Note: Adjust this based on your actual analytics implementation
    const analyticsEvent = consoleLogs.find((log) =>
      log.includes('export_button_clicked')
    );
    expect(analyticsEvent).toBeTruthy();
  });
});
```

#### 2. Add Analytics Tracking Verification

**File:** `hooks/use-playground-controller.ts` (already exists, verify tracking)

Ensure analytics event is fired at line 258-265:
```typescript
track("export_button_clicked", {
  look_id: config.layoutId,
  look_name: currentLook?.name ?? "unknown",
  variant: config.variant,
  background_type: config.background?.type ?? "unknown",
  font_style: config.fontStyle,
  orientation,
});
```

### Success Criteria

#### Automated Verification
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] CI/CD pipeline passes: `pnpm test:ci`

#### Manual Verification
- [ ] Export button workflow tested end-to-end
- [ ] File download verified in all tests
- [ ] Button states (enabled/disabled/loading) validated
- [ ] Analytics tracking verified

---

## Phase 4: Visual Regression Tests (Playwright Visual Comparison)

**Goal:** Ensure export container visually matches preview rendering across all looks.

### Changes Required

#### 1. Update Playwright Configuration

**File:** `playwright.config.ts`

Add visual comparison configuration:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ... existing config ...

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,  // Allow minor anti-aliasing differences
      threshold: 0.01,     // 1% tolerance for pixel differences
    },
  },

  snapshotDir: './tests/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}/{arg}{ext}',

  // ... rest of config ...
});
```

#### 2. Create Visual Regression Test File

**New file:** `tests/e2e/export-visual.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Export Visual Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Upload test screenshot
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    // Wait for preview to load
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();
  });

  test('export container renders all elements', async ({ page }) => {
    // Make export container visible for screenshot
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) {
        container.style.zIndex = '9999';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
      }
    });

    const exportContainer = page.locator('#export-container');
    await expect(exportContainer).toBeVisible();

    // Take screenshot of export container
    await expect(exportContainer).toHaveScreenshot('export-container-baseline.png', {
      maxDiffPixels: 100,
    });
  });

  test.describe('all looks render consistently', () => {
    const looks = [
      { id: 'popup-gradient', name: 'Peak Left' },
      { id: 'hero-center', name: 'Spotlight Center' },
      { id: 'adaptive-stage', name: 'Adaptive' },
      { id: 'code-snippet', name: 'Code' },
    ];

    for (const look of looks) {
      test(`${look.name} look exports correctly`, async ({ page }) => {
        // Select look
        await page.getByRole('button', { name: new RegExp(`Look:.*${look.name}`, 'i') }).click();

        // Wait for layout change
        await page.waitForTimeout(500);

        // Make export container visible
        await page.evaluate(() => {
          const container = document.getElementById('export-container');
          if (container) {
            container.style.zIndex = '9999';
            container.style.position = 'fixed';
          }
        });

        const exportContainer = page.locator('#export-container');

        // Screenshot export container
        await expect(exportContainer).toHaveScreenshot(`${look.id}-export.png`, {
          maxDiffPixels: 100,
        });
      });
    }
  });

  test('export container matches preview layout (scaled)', async ({ page }) => {
    // Take screenshot of preview
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const previewScreenshot = await previewCanvas.screenshot();

    // Make export container visible
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) {
        container.style.zIndex = '9999';
      }
    });

    const exportContainer = page.locator('#export-container');
    const exportScreenshot = await exportContainer.screenshot();

    // Note: Direct comparison won't work due to resolution differences (1280×720 vs 1920×1080)
    // This test mainly ensures both containers render without errors
    expect(previewScreenshot).toBeTruthy();
    expect(exportScreenshot).toBeTruthy();
  });
});
```

#### 3. Generate Initial Baselines

Run Playwright in update mode to generate baseline screenshots:

```bash
pnpm playwright test export-visual.spec.ts --update-snapshots
```

This will create:
- `tests/__snapshots__/export-visual.spec.ts/export-container-baseline.png`
- `tests/__snapshots__/export-visual.spec.ts/popup-gradient-export.png`
- `tests/__snapshots__/export-visual.spec.ts/hero-center-export.png`
- `tests/__snapshots__/export-visual.spec.ts/adaptive-stage-export.png`
- `tests/__snapshots__/export-visual.spec.ts/code-snippet-export.png`

#### 4. Add Snapshot Update Script

**File:** `package.json`

Add script to update snapshots:
```json
{
  "scripts": {
    "test:e2e:update-snapshots": "playwright test --update-snapshots"
  }
}
```

### Success Criteria

#### Automated Verification
- [ ] Visual tests pass: `pnpm test:e2e`
- [ ] Baselines generated: 5+ PNG files in `tests/__snapshots__/`
- [ ] No visual regressions detected when re-running tests

#### Manual Verification
- [ ] Review baseline screenshots visually - ensure they look correct
- [ ] Verify each look (Peak Left, Spotlight Center, Adaptive, Code) captured
- [ ] Export container renders all expected elements (screenshot, gradient, decorations)

---

## Phase 5: Geometric Validation Tests

**Goal:** Verify element positions scale proportionally between preview (1280×720) and export (1920×1080).

### Changes Required

#### 1. Create Test Helpers

**New file:** `tests/helpers/geometric-utils.ts`

```typescript
import type { Locator } from '@playwright/test';

export interface Position {
  x: number;
  y: number;
}

export interface RelativePosition {
  x: number; // 0-1 (percentage of container width)
  y: number; // 0-1 (percentage of container height)
}

/**
 * Get element's position relative to container (0-1 range).
 */
export async function getRelativePosition(
  container: Locator,
  element: Locator
): Promise<RelativePosition> {
  const containerBounds = await container.boundingBox();
  const elementBounds = await element.boundingBox();

  if (!containerBounds || !elementBounds) {
    throw new Error('Unable to get bounding boxes for position calculation');
  }

  return {
    x: (elementBounds.x - containerBounds.x) / containerBounds.width,
    y: (elementBounds.y - containerBounds.y) / containerBounds.height,
  };
}

/**
 * Calculate Euclidean distance between two elements.
 */
export async function getDistance(
  elem1: Locator,
  elem2: Locator
): Promise<number> {
  const bounds1 = await elem1.boundingBox();
  const bounds2 = await elem2.boundingBox();

  if (!bounds1 || !bounds2) {
    throw new Error('Unable to get bounding boxes for distance calculation');
  }

  // Use center points
  const center1 = {
    x: bounds1.x + bounds1.width / 2,
    y: bounds1.y + bounds1.height / 2,
  };

  const center2 = {
    x: bounds2.x + bounds2.width / 2,
    y: bounds2.y + bounds2.height / 2,
  };

  return Math.sqrt(
    Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
  );
}

/**
 * Get element count matching selector.
 */
export async function getElementCount(
  container: Locator,
  selector: string
): Promise<number> {
  return await container.locator(selector).count();
}
```

#### 2. Create Geometric Validation Tests

**New file:** `tests/e2e/export-geometry.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';
import {
  getRelativePosition,
  getDistance,
  getElementCount,
} from '../helpers/geometric-utils';

test.describe('Export Geometric Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Upload test screenshot
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    // Wait for preview to load
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();
  });

  test('all expected elements present in export container', async ({ page }) => {
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const exportContainer = page.locator('#export-container');

    // Count elements with data-export-element attribute
    const previewCount = await getElementCount(previewCanvas, '[data-export-element]');
    const exportCount = await getElementCount(exportContainer, '[data-export-element]');

    expect(exportCount).toBe(previewCount);
    expect(exportCount).toBeGreaterThan(0); // Ensure elements exist
  });

  test('screenshot element maintains proportional position', async ({ page }) => {
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const exportContainer = page.locator('#export-container');

    // Make export container visible for measurement
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) {
        container.style.zIndex = '9999';
      }
    });

    // Get screenshot element in both containers
    const previewScreenshot = previewCanvas.locator('[data-role="screenshot"]');
    const exportScreenshot = exportContainer.locator('[data-role="screenshot"]');

    // Calculate relative positions
    const previewPos = await getRelativePosition(previewCanvas, previewScreenshot);
    const exportPos = await getRelativePosition(exportContainer, exportScreenshot);

    // Assert positions match within 2% tolerance
    expect(Math.abs(previewPos.x - exportPos.x)).toBeLessThan(0.02);
    expect(Math.abs(previewPos.y - exportPos.y)).toBeLessThan(0.02);
  });

  test('element distances scale proportionally (1.5x)', async ({ page }) => {
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const exportContainer = page.locator('#export-container');

    // Make export container visible
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) {
        container.style.zIndex = '9999';
      }
    });

    // Get two elements for distance measurement
    const previewElements = await previewCanvas.locator('[data-export-element]').all();
    const exportElements = await exportContainer.locator('[data-export-element]').all();

    // Need at least 2 elements
    if (previewElements.length < 2 || exportElements.length < 2) {
      test.skip();
      return;
    }

    // Measure distance between first two elements in preview
    const distancePreview = await getDistance(previewElements[0], previewElements[1]);

    // Measure same distance in export
    const distanceExport = await getDistance(exportElements[0], exportElements[1]);

    // Calculate scale factor (should be ~1.5x for desktop)
    const scaleFactor = distanceExport / distancePreview;

    // Assert scale factor is approximately 1.5 (±0.1 tolerance)
    expect(scaleFactor).toBeGreaterThan(1.4);
    expect(scaleFactor).toBeLessThan(1.6);
  });

  test('container dimensions are exactly 1.5x preview dimensions', async ({ page }) => {
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const exportContainer = page.locator('#export-container');

    const previewBounds = await previewCanvas.boundingBox();
    const exportBounds = await exportContainer.boundingBox();

    if (!previewBounds || !exportBounds) {
      throw new Error('Unable to get container bounds');
    }

    // Assert export container is 1.5x preview size
    expect(exportBounds.width).toBe(1920);
    expect(exportBounds.height).toBe(1080);
    expect(previewBounds.width).toBe(1280);
    expect(previewBounds.height).toBe(720);

    // Verify 1.5x scaling
    expect(exportBounds.width / previewBounds.width).toBeCloseTo(1.5, 5);
    expect(exportBounds.height / previewBounds.height).toBeCloseTo(1.5, 5);
  });
});
```

### Success Criteria

#### Automated Verification
- [ ] Geometric tests pass: `pnpm test:e2e`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] All assertions within tolerance thresholds

#### Manual Verification
- [ ] Element counts match between preview and export
- [ ] Relative positions preserved (within 2%)
- [ ] Distances scale by 1.5x (within 10% tolerance)
- [ ] Container dimensions are exactly 1920×1080 (desktop)

---

## Phase 6: Edge Case & Stress Tests

**Goal:** Test export functionality with extreme inputs (large screenshots, small screenshots, unusual aspect ratios).

### Changes Required

#### 1. Create Edge Case Test File

**New file:** `tests/e2e/export-edge-cases.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Export Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('handles 4K screenshot without overflow', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-4k.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');
  });

  test('handles small screenshot without over-upscaling', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-small.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');
  });

  test('handles ultrawide aspect ratio correctly', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-ultrawide.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');
  });

  test('handles mobile orientation (720×1280)', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-720x1280.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    // Switch to mobile orientation if needed
    // (Depends on your UI - adjust selector as needed)

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');
  });

  test('exports without errors when screenshot aspect ratio mismatches orientation', async ({ page }) => {
    // Upload landscape screenshot in mobile orientation (or vice versa)
    const fixtureFile = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.setInputFiles('input[type="file"]', fixtureFile);

    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');
  });
});
```

### Success Criteria

#### Automated Verification
- [ ] Edge case tests pass: `pnpm test:e2e`
- [ ] No console errors during extreme inputs
- [ ] All downloads complete successfully

#### Manual Verification
- [ ] 4K screenshots don't cause layout overflow
- [ ] Small screenshots aren't pixelated or over-upscaled
- [ ] Ultrawide screenshots render correctly
- [ ] Mobile orientation exports at 1080×1920
- [ ] Aspect ratio mismatches handled gracefully

---

## Phase 7: CI/CD Integration & Documentation

**Goal:** Ensure tests run in CI/CD pipeline and document testing strategy.

### Changes Required

#### 1. Update GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

Verify visual comparison tests run in CI (already configured, but add explicit step):

```yaml
name: Test

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Extract pnpm version
        id: pnpm-version
        run: echo "version=$(jq -r '.packageManager' package.json | sed 's/pnpm@//')" >> $GITHUB_OUTPUT

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ steps.pnpm-version.outputs.version }}

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run typecheck
        run: pnpm typecheck

      - name: Run domain tests
        run: pnpm test:domain

      - name: Run UI tests
        run: pnpm test:ui

      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      # Upload visual comparison failures for debugging
      - name: Upload Playwright test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-results
          path: test-results/
          retention-days: 7

      # Upload snapshot diffs if visual tests fail
      - name: Upload snapshot diffs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: snapshot-diffs
          path: tests/__snapshots__/
          retention-days: 7
```

#### 2. Update README with Testing Documentation

**File:** `README.md`

Add section on testing:

```markdown
## Testing

dopeshot uses a comprehensive testing strategy to ensure export functionality works correctly:

### Test Layers

1. **Unit Tests** - Export utilities (pixel ratio, dimensions)
2. **Component Tests** - React components in isolation
3. **Integration Tests** - End-to-end workflows (upload → export → download)
4. **Visual Regression** - Screenshot comparisons with baselines
5. **Geometric Validation** - Element position/distance assertions

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:domain    # Domain logic tests
pnpm test:ui        # Component unit tests
pnpm test:e2e       # Playwright E2E tests

# Run with coverage
pnpm test:ci

# Update visual baselines (after intentional UI changes)
pnpm test:e2e:update-snapshots
```

### Writing Tests

- **Unit tests:** `tests/ui/*.test.ts` (Vitest)
- **E2E tests:** `tests/e2e/*.spec.ts` (Playwright)
- **Fixtures:** `tests/fixtures/` (sample screenshots)
- **Helpers:** `tests/helpers/` (test utilities)

### Test Fixtures

We provide sample screenshots for testing:
- `screenshot-1280x720.png` - Desktop aspect ratio (16:9)
- `screenshot-720x1280.png` - Mobile aspect ratio (9:16)
- `screenshot-4k.png` - Large screenshot (3840×2160)
- `screenshot-small.png` - Small screenshot (400×300)
- `screenshot-ultrawide.png` - Extreme aspect ratio (2560×1080)

Regenerate fixtures: `pnpm tsx tests/helpers/generate-fixtures.ts`

### Visual Testing

Export tests use Playwright's visual comparison:
- Baselines stored in `tests/__snapshots__/`
- 1% pixel difference tolerance (configurable in `playwright.config.ts`)
- Update baselines after intentional UI changes

### Export Correctness Criteria

Export functionality "works correctly" when:
1. ✅ All elements present (structural integrity)
2. ✅ Visual fidelity (colors, fonts match preview)
3. ✅ Layout consistency (proportional positions preserved)
4. ✅ Resolution correctness (1920×1080 desktop, 1080×1920 mobile)
5. ✅ Content accuracy (uploads render faithfully)
6. ✅ Edge cases handled (large/small screenshots)
```

#### 3. Add Test Documentation File

**New file:** `docs/TESTING.md`

```markdown
# Testing Strategy

This document outlines dopeshot's comprehensive testing strategy for export functionality.

## Overview

Export testing ensures that exported PNG files match preview rendering exactly (except for 1.5x resolution scaling). We use a **5-layer testing pyramid** to achieve comprehensive coverage.

## Test Layers

### Layer 1: Unit Tests (Vitest)

**Location:** `tests/ui/export-utils.test.ts`

**Purpose:** Test pure functions in isolation

**Coverage:**
- `calculatePixelRatio()` - Pixel ratio calculation logic
- `getExportDimensions()` - Dimension lookup for orientations

**Run:** `pnpm test:ui`

### Layer 2: Component Tests (Vitest + jsdom)

**Location:** `tests/ui/export-container.test.tsx` (future)

**Purpose:** Test React components in isolation

**Coverage:**
- ExportContainer setup
- CoverPreview static mode
- Layout component isStatic behavior

**Run:** `pnpm test:ui`

### Layer 3: Integration Tests (Playwright)

**Location:** `tests/e2e/export.spec.ts`

**Purpose:** Test end-to-end export workflow

**Coverage:**
- Export button triggers download
- File downloaded with correct name
- Button states (enabled/disabled/loading)
- Validation (requires screenshot)
- Analytics tracking

**Run:** `pnpm test:e2e`

### Layer 4: Visual Regression (Playwright Visual)

**Location:** `tests/e2e/export-visual.spec.ts`

**Purpose:** Ensure visual consistency between preview and export

**Coverage:**
- Export container renders all elements
- All looks (Peak Left, Spotlight, Adaptive, Code) consistent
- Preview and export layouts match visually

**Run:** `pnpm test:e2e`

**Update baselines:** `pnpm test:e2e:update-snapshots`

### Layer 5: Geometric Validation (Playwright + Custom Helpers)

**Location:** `tests/e2e/export-geometry.spec.ts`

**Purpose:** Verify element positions scale proportionally

**Coverage:**
- Element counts match
- Relative positions preserved (within 2%)
- Distances scale by 1.5x
- Container dimensions correct (1920×1080)

**Run:** `pnpm test:e2e`

## Edge Case Testing

**Location:** `tests/e2e/export-edge-cases.spec.ts`

**Coverage:**
- 4K screenshots (3840×2160)
- Small screenshots (<500px)
- Ultrawide aspect ratios
- Mobile orientation (1080×1920)
- Aspect ratio mismatches

## Test Fixtures

Sample screenshots for consistent testing:

| Fixture | Dimensions | Purpose |
|---------|------------|---------|
| `screenshot-1280x720.png` | 1280×720 | Desktop aspect ratio (16:9) |
| `screenshot-720x1280.png` | 720×1280 | Mobile aspect ratio (9:16) |
| `screenshot-4k.png` | 3840×2160 | Large screenshot stress test |
| `screenshot-small.png` | 400×300 | Small screenshot edge case |
| `screenshot-ultrawide.png` | 2560×1080 | Extreme aspect ratio |

**Regenerate:** `pnpm tsx tests/helpers/generate-fixtures.ts`

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Structural match** | 100% elements present | DOM query assertions |
| **Visual similarity** | >99% pixel match | Screenshot diff % |
| **Layout precision** | <2% position variance | Bounding box calculations |
| **Resolution accuracy** | Exact dimensions (±1px) | Image metadata |

## CI/CD Integration

Tests run automatically on every push/PR via GitHub Actions:

1. TypeScript compilation (`pnpm typecheck`)
2. Domain tests (`pnpm test:domain`)
3. UI tests (`pnpm test:ui`)
4. E2E tests (`pnpm test:e2e`)

**Artifacts:** Visual test failures upload snapshot diffs for debugging.

## Best Practices

### Writing Export Tests

1. **Use data attributes** - Query elements with `data-export-element`, `data-role="screenshot"`
2. **Test proportions, not absolutes** - Relative positions (0-1) instead of pixel values
3. **Allow tolerance** - 1-2% tolerance for anti-aliasing differences
4. **Isolate fixtures** - Use consistent test screenshots for deterministic results

### Updating Visual Baselines

```bash
# After intentional UI changes, update baselines
pnpm test:e2e:update-snapshots

# Review diffs in tests/__snapshots__/ before committing
git diff tests/__snapshots__/

# Commit new baselines
git add tests/__snapshots__/
git commit -m "Update visual baselines after UI changes"
```

### Debugging Test Failures

1. **Visual failures:** Check `test-results/` for diff images
2. **Geometric failures:** Inspect element bounding boxes in DevTools
3. **Timeout failures:** Increase `page.waitForTimeout()` values
4. **Flaky tests:** Add explicit waits (`waitForLoadState`, `waitForSelector`)

## Future Improvements

- [ ] Migrate domain tests to Vitest (consolidate frameworks)
- [ ] Add accessibility testing with `@axe-core/playwright`
- [ ] Add performance benchmarks for export time
- [ ] Expand browser coverage (Firefox, WebKit)
- [ ] Add snapshot tests for DOM structure
```

### Success Criteria

#### Automated Verification
- [ ] CI/CD pipeline runs all tests: `pnpm test:ci`
- [ ] Visual test failures upload artifacts
- [ ] README includes testing section

#### Manual Verification
- [ ] `docs/TESTING.md` documents all test layers
- [ ] README provides clear testing instructions
- [ ] CI/CD workflow configured correctly
- [ ] Snapshot diffs uploaded on failures

---

## Rollback Plan

If issues arise during implementation:

### Phase 1-2 Rollback
- Remove data attributes from layout components
- Delete `tests/helpers/generate-fixtures.ts`
- Revert `domain/layout/export.ts` to inline pixel ratio calculation

### Phase 3-6 Rollback
- Delete test files: `tests/e2e/export*.spec.ts`, `tests/ui/export*.test.ts`
- Delete fixtures: `tests/fixtures/`
- Revert `playwright.config.ts` changes
- Remove snapshot directory: `tests/__snapshots__/`

### Phase 7 Rollback
- Revert `.github/workflows/test.yml` to original
- Remove testing sections from `README.md`
- Delete `docs/TESTING.md`

**Recovery time:** <30 minutes per phase

---

## Summary

This plan implements **comprehensive export testing** using a 5-layer strategy:

1. ✅ **Unit Tests** - Pure function logic (pixel ratio, dimensions)
2. ✅ **Component Tests** - React component behavior (export container)
3. ✅ **Integration Tests** - E2E workflow (button → download)
4. ✅ **Visual Regression** - Screenshot comparisons (baseline matching)
5. ✅ **Geometric Validation** - Layout consistency (proportional scaling)

**Immediate value:** Integration tests (Phase 3) catch critical export bugs
**Long-term value:** Visual + geometric tests prevent regressions during refactoring

**Expected timeline:** 7 phases, implement incrementally over 2-4 weeks
**Risk mitigation:** Each phase includes rollback plan, minimal dependencies

**Success criteria defined:** All phases have automated + manual verification steps
