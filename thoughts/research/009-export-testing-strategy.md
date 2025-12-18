# Research: Export Functionality Testing Strategy

**Date:** 2025-12-18
**Status:** Research Complete
**Next Steps:** Implementation Planning

---

## Executive Summary

This research investigates how to comprehensively test the export functionality in dopeshot, ensuring that exported PNG files match preview rendering exactly (aside from resolution scaling). The analysis covers current testing infrastructure, export pipeline mechanics, and proposes a multi-layered testing strategy.

**Key Finding:** Current E2E tests only validate UI visibility. There is **zero coverage** for export correctness, visual fidelity, or layout consistency between preview and export.

---

## Table of Contents

1. [Current Testing Infrastructure](#current-testing-infrastructure)
2. [Export Pipeline Analysis](#export-pipeline-analysis)
3. [Preview vs Export Differences](#preview-vs-export-differences)
4. [What "Works Correctly" Means](#what-works-correctly-means)
5. [Recommended Testing Strategy](#recommended-testing-strategy)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Code Examples & Patterns](#code-examples--patterns)

---

## Current Testing Infrastructure

### Overview

dopeshot has a **three-tier testing strategy**:
- **Domain Tests** (tsx runner) - Business logic validation
- **UI Tests** (Vitest + React Testing Library) - Component unit tests
- **E2E Tests** (Playwright) - Integration tests

### Test Configuration

| Framework | Config File | Test Directory | Purpose |
|-----------|-------------|----------------|---------|
| Playwright | `playwright.config.ts` | `tests/e2e/` | E2E workflows |
| Vitest | `vitest.config.ts` | `tests/ui/` | React components |
| tsx | `package.json` scripts | `tests/` | Domain logic |

### Existing Test Coverage

#### 1. Domain Tests (2 files)
- **`tests/color-extraction.test.ts:1-52`** - Color palette extraction from images
- **`tests/gradient-generation.test.ts:1-119`** - Gradient strategy selection

**Pattern:** Direct Node.js assertions with `node:assert`
```typescript
import { strict as assert } from "node:assert";

assert.strictEqual(result.length, 5, "Should extract 5 colors");
assert.ok(result[0].accent, "First color should be accent");
```

**Helper:** `tests/helpers/image-factory.ts` - Uses `sharp` to create test images programmatically

#### 2. UI Component Tests (1 file)
- **`tests/ui/example.test.tsx:1-10`** - Basic button rendering

**Pattern:** Vitest + React Testing Library
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

it('renders a button component', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**Coverage:** Minimal (1 component, 1 test)

#### 3. E2E Tests (1 file)
- **`tests/e2e/playground.spec.ts:1-87`** - Playground page interactions

**Pattern:** Playwright with semantic selectors
```typescript
import { test, expect } from '@playwright/test';

test('renders the landing page with playground', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Go to homepage' })).toBeVisible();

  const looks = page.getByRole('button', { name: /Look:/ });
  await expect(await looks.count()).toBeGreaterThan(7);
});
```

**Current Assertions:**
- Element visibility (`toBeVisible()`)
- ARIA attributes (`toHaveAttribute('aria-pressed', 'true')`)
- Element counts (`toBeGreaterThan()`)

**What's Missing:**
- ❌ No export functionality tests
- ❌ No visual regression tests
- ❌ No layout/position validation
- ❌ No screenshot comparisons
- ❌ No CSS property assertions

### CI/CD Pipeline

**`.github/workflows/test.yml`** runs all tests on push/PR:
1. `pnpm typecheck` - TypeScript validation
2. `pnpm test:domain` - Domain logic tests
3. `pnpm test:ui` - Component tests
4. `pnpm test:e2e` - Playwright tests (chromium only)

**Environment:** ubuntu-latest, Node.js 20, pnpm 9.15.4

---

## Export Pipeline Analysis

### High-Level Flow

```
User clicks "Export PNG" button
           ↓
Validation + Analytics tracking
           ↓
Calculate export dimensions (1920x1080 or 1080x1920)
           ↓
Render hidden export container at high resolution
           ↓
Wait for fonts/animations to load
           ↓
html-to-image captures DOM as PNG (with pixelRatio scaling)
           ↓
Trigger browser download (cover-image.png)
```

### Key Files & Responsibilities

| File | Lines | Purpose |
|------|-------|---------|
| `components/app-header.tsx` | 64-76 | Export button UI + disabled state |
| `components/playground-page.tsx` | 25-68 | Hidden export container setup |
| `hooks/use-playground-controller.ts` | 241-309 | Export handler logic + validation |
| `domain/layout/export.ts` | 47-110 | PNG generation pipeline |
| `domain/layout/screenshot-mode.ts` | 10-19 | Resolution configuration |
| `components/cover-preview.tsx` | 14-54 | Layout rendering component |
| `components/layouts/registry.ts` | 22-27 | Layout component mapping |

### Export Container Architecture

**Location:** `components/playground-page.tsx:25-68`

The export container is a **hidden off-screen rendering surface**:
```typescript
<div
  id="export-container"
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "visible",
    zIndex: -100, // Hidden below viewport
    backgroundColor: "white",
    fontSmoothing: "antialiased",
    textRendering: "optimizeLegibility",
    width: exportDims.width,  // 1920px (desktop) or 1080px (mobile)
    height: exportDims.height, // 1080px (desktop) or 1920px (mobile)
  }}
>
  <CoverPreview isStatic={true} {...exportProps} />
</div>
```

**Key Design Decisions:**
- **Fixed positioning** - Not affected by page scroll
- **z-index: -100** - Below viewport but still rendered
- **visibility: visible** - Forces browser to render despite z-index
- **White background** - Consistent across themes
- **isStatic={true}** - Disables interactive elements (upload prompts, dropzones)

### Resolution Strategy

**`domain/layout/screenshot-mode.ts:10-19`**

```typescript
// Preview dimensions (UI performance)
export const ORIENTATION_DIMENSIONS = {
  desktop: { width: 1280, height: 720 },  // 16:9
  mobile: { width: 720, height: 1280 },   // 9:16
};

// Export dimensions (high quality)
export const EXPORT_ORIENTATION_DIMENSIONS = {
  desktop: { width: 1920, height: 1080 },  // 1.5x upscale from preview
  mobile: { width: 1080, height: 1920 },   // 1.5x upscale from preview
};
```

**Scaling Factor:** 1.5x upscale from preview to export

### PNG Generation Process

**`domain/layout/export.ts:47-110`**

```typescript
export async function exportLayoutAsPng(
  elementId: string,
  fileName: string,
  { width, height, backgroundColor, pixelRatio, maxImageScale }: ExportSizeOptions = {}
) {
  // 1. Wait for render (fonts, animations)
  await waitForRender();

  // 2. Get target element
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element ${elementId} not found`);

  // 3. Calculate pixel ratio
  const desiredPixelRatio = pixelRatio ?? Math.max(window.devicePixelRatio || 1, 2);
  const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;
  const resolvedPixelRatio = Math.min(
    Math.max(desiredPixelRatio, 1),
    Math.max(Math.min(3, maxScale), 1)
  );

  // 4. Convert DOM to PNG
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: resolvedPixelRatio,
    width,
    height,
    skipAutoScale: true,
    backgroundColor,
    style: {
      visibility: "visible",
      zIndex: "auto",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
  });

  // 5. Trigger download
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
```

**Pixel Ratio Logic:**
- Defaults to `Math.max(window.devicePixelRatio || 1, 2)` → typically 2-3x
- Respects `maxImageScale` to prevent upscaling embedded screenshots beyond natural resolution
- Clamped to range [1, 3]

**Pre-Render Wait:** `waitForRender()` ensures fonts/animations complete
```typescript
async function waitForRender() {
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Wait for idle callback or 50ms fallback
  if ("requestIdleCallback" in window) {
    await new Promise((resolve) => requestIdleCallback(resolve, { timeout: 100 }));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Wait for fonts
  await document.fonts.ready;
}
```

### Layout Rendering

**`components/cover-preview.tsx:14-54`**

```typescript
export function CoverPreview({ isStatic = false }: CoverPreviewProps) {
  const currentLayout = useAtomValue(currentLayoutAtom);
  const canvasDimensions = useAtomValue(canvasDimensionsAtom);

  const LayoutComponent = currentLayout
    ? layoutRegistry[currentLayout.id as keyof typeof layoutRegistry]
    : undefined;

  return (
    <LayoutComponent
      isStatic={isStatic}  // Disables interactive elements in export mode
      {...canvasDimensions}
    />
  );
}
```

**Registered Layouts:** `components/layouts/registry.ts:22-27`
- `popup-gradient` → PopupGradient
- `hero-center` → HeroCenter
- `adaptive-stage` → AdaptiveScreenshot
- `code-snippet` → CodeSnippet

Each layout accepts `isStatic` prop to disable upload prompts during export.

### Analytics Tracking

**`hooks/use-playground-controller.ts:258-265`**

Every export triggers analytics:
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

---

## Preview vs Export Differences

### Dimensional Differences

| Aspect | Preview | Export |
|--------|---------|--------|
| **Desktop Dimensions** | 1280 × 720 | 1920 × 1080 |
| **Mobile Dimensions** | 720 × 1280 | 1080 × 1920 |
| **Scale Factor** | 1x (base) | 1.5x upscale |
| **Pixel Ratio** | Browser default | 2-3x (device-dependent) |

### Rendering Differences

| Aspect | Preview | Export |
|--------|---------|--------|
| **Component Mode** | `isStatic={false}` | `isStatic={true}` |
| **Interactive Elements** | Enabled (upload, dropzones) | Disabled |
| **DOM Position** | In viewport | Off-screen (z-index: -100) |
| **Background** | Theme-dependent | Always white |
| **Font Rendering** | Standard | Optimized (antialiased, optimizeLegibility) |

### Potential Consistency Issues

1. **CSS Media Queries** - If layouts use breakpoints based on viewport size, export container (fixed position) may render differently
2. **Dynamic Font Loading** - `waitForRender()` waits for fonts, but timing could cause flicker
3. **Image Scaling** - `maxImageScale` prevents upscaling screenshots, but calculation relies on metadata accuracy
4. **Viewport Units** - `vw`, `vh`, `vmin`, `vmax` may behave differently in fixed-position container
5. **JavaScript-based Layouts** - If layouts calculate positions based on `getBoundingClientRect()`, results may differ

---

## What "Works Correctly" Means

### Definition of Export Correctness

Export functionality "works correctly" when the following criteria are met:

#### 1. **Structural Integrity**
✅ All expected elements are present in the exported PNG
- Screenshot/code snippet image rendered
- Background gradient/pattern rendered
- Text overlays (if any) rendered
- Brand logo (if applicable) rendered
- All UI decorations (borders, shadows, shapes) rendered

**Test Approach:** DOM snapshot comparison or element count validation

#### 2. **Visual Fidelity**
✅ Export visually matches preview (accounting for resolution scaling)
- Colors identical between preview and export
- Fonts render with same family, size, weight
- Images display without artifacts or distortion
- Gradients render smoothly without banding

**Test Approach:** Visual regression testing with tolerance threshold

#### 3. **Layout Consistency**
✅ Element positions maintain proportional relationships
- Relative distances between elements preserved (scaled proportionally)
- Padding/margins consistent when adjusted for resolution
- Alignment rules respected (center, left, right)
- Aspect ratios preserved for images/containers

**Test Approach:** Geometric assertions on element bounding boxes

#### 4. **Resolution Correctness**
✅ Export produces expected dimensions and quality
- Desktop exports at 1920×1080 (or 1080×1920 mobile)
- Pixel ratio applied correctly (2-3x)
- Images not upscaled beyond natural resolution
- Text crisp and readable (no pixelation)

**Test Approach:** Image metadata validation + sharpness heuristics

#### 5. **Content Accuracy**
✅ User-provided content renders faithfully
- Uploaded screenshots display correctly
- Custom text renders as entered
- Selected colors match user's palette
- Selected fonts applied correctly

**Test Approach:** Content hash comparison or OCR validation

#### 6. **Edge Case Handling**
✅ Export handles boundary conditions gracefully
- Very large screenshots don't overflow canvas
- Very small screenshots aren't over-upscaled
- Empty states (no screenshot) handled gracefully
- Long text doesn't clip or overflow

**Test Approach:** Parameterized tests with extreme inputs

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Structural match** | 100% elements present | DOM query assertions |
| **Visual similarity** | >99% pixel match (with tolerance) | Screenshot diff percentage |
| **Layout precision** | <2% position variance | Bounding box calculations |
| **Resolution accuracy** | Exact dimensions (±1px) | Image metadata |
| **Content fidelity** | Exact match | Hash comparison |
| **Edge case coverage** | Zero crashes/errors | Error rate tracking |

---

## Recommended Testing Strategy

### Multi-Layered Approach

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Unit Tests (Vitest)                       │
│ - Export utility functions                          │
│ - Dimension calculations                            │
│ - Pixel ratio logic                                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: Component Tests (Vitest + jsdom)          │
│ - CoverPreview renders in static mode               │
│ - Layout components disable interactions            │
│ - Export container setup correct                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Integration Tests (Playwright)            │
│ - Export button triggers download                   │
│ - File downloaded with correct name                 │
│ - Export state managed correctly                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 4: Visual Regression (Playwright Visual)     │
│ - Screenshot comparisons (preview vs export)        │
│ - Layout consistency across looks/variants          │
│ - Resolution scaling validation                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Layer 5: Geometric Validation (Custom)             │
│ - Element position/distance assertions              │
│ - Proportional scaling checks                       │
│ - Bounding box relationship validation              │
└─────────────────────────────────────────────────────┘
```

### Layer 1: Unit Tests (Vitest)

**File:** `tests/export-utils.test.ts` (new)

Test pure functions in `domain/layout/export.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Export Utilities', () => {
  describe('calculatePixelRatio', () => {
    it('defaults to device pixel ratio or 2', () => {
      const result = calculatePixelRatio();
      expect(result).toBeGreaterThanOrEqual(2);
    });

    it('respects maxImageScale upper bound', () => {
      const result = calculatePixelRatio({ maxImageScale: 1.5 });
      expect(result).toBeLessThanOrEqual(1.5);
    });

    it('clamps to range [1, 3]', () => {
      const result = calculatePixelRatio({ desiredPixelRatio: 10 });
      expect(result).toBeLessThanOrEqual(3);
    });
  });

  describe('getExportDimensions', () => {
    it('returns 1920x1080 for desktop orientation', () => {
      const dims = getExportDimensions('desktop');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });

    it('returns 1080x1920 for mobile orientation', () => {
      const dims = getExportDimensions('mobile');
      expect(dims).toEqual({ width: 1080, height: 1920 });
    });
  });
});
```

**Coverage Target:** 100% of export utility functions

### Layer 2: Component Tests (Vitest + jsdom)

**File:** `tests/ui/export-container.test.tsx` (new)

Test export-specific component behavior:
```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ExportContainer', () => {
  it('renders with correct dimensions for desktop', () => {
    const { container } = render(
      <ExportContainer orientation="desktop" {...mockProps} />
    );

    const exportDiv = container.querySelector('#export-container');
    expect(exportDiv).toHaveStyle({
      width: '1920px',
      height: '1080px',
    });
  });

  it('sets isStatic={true} on CoverPreview', () => {
    const { container } = render(
      <ExportContainer orientation="desktop" {...mockProps} />
    );

    // Verify CoverPreview receives isStatic prop
    const preview = container.querySelector('[data-static="true"]');
    expect(preview).toBeInTheDocument();
  });

  it('applies export-specific styles', () => {
    const { container } = render(
      <ExportContainer orientation="desktop" {...mockProps} />
    );

    const exportDiv = container.querySelector('#export-container');
    expect(exportDiv).toHaveStyle({
      position: 'fixed',
      zIndex: '-100',
      backgroundColor: 'white',
    });
  });
});
```

**Coverage Target:** Export container setup + CoverPreview static mode

### Layer 3: Integration Tests (Playwright)

**File:** `tests/e2e/export.spec.ts` (new)

Test end-to-end export workflow:
```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Export Functionality', () => {
  test('exports PNG file when button clicked', async ({ page }) => {
    await page.goto('/');

    // Upload test screenshot
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

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

    // Verify file is downloadable
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('disables button during export', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

    const exportButton = page.getByRole('button', { name: 'Export PNG' });

    // Click and immediately check disabled state
    await exportButton.click();
    await expect(exportButton).toBeDisabled();
    await expect(exportButton).toHaveAttribute('aria-busy', 'true');
  });

  test('requires screenshot before allowing export', async ({ page }) => {
    await page.goto('/');

    // Export button should not be visible without screenshot
    await expect(page.getByRole('button', { name: 'Export PNG' })).not.toBeVisible();
  });
});
```

**Coverage Target:** Export button behavior, download mechanics, validation

### Layer 4: Visual Regression Tests (Playwright Visual)

**File:** `tests/e2e/export-visual.spec.ts` (new)

Compare preview rendering to exported PNG:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Export Visual Consistency', () => {
  test('exported PNG matches preview rendering', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

    // Take screenshot of preview canvas
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const previewScreenshot = await previewCanvas.screenshot();

    // Trigger export and capture export container
    const exportContainer = page.locator('#export-container');

    // Temporarily show export container for screenshot
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) {
        container.style.zIndex = '9999';
        container.style.position = 'fixed';
      }
    });

    const exportScreenshot = await exportContainer.screenshot();

    // Compare with tolerance for resolution scaling
    expect(exportScreenshot).toMatchSnapshot('export-baseline.png', {
      maxDiffPixels: 100,  // Allow minor anti-aliasing differences
      threshold: 0.01,     // 1% tolerance
    });
  });

  test.describe('all looks render consistently', () => {
    const looks = ['popup-gradient', 'hero-center', 'adaptive-stage', 'code-snippet'];

    for (const look of looks) {
      test(`${look} exports correctly`, async ({ page }) => {
        await page.goto('/');
        await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

        // Select look
        await page.getByRole('button', { name: `Look: ${look}` }).click();

        // Screenshot export container
        const exportContainer = page.locator('#export-container');
        await expect(exportContainer).toHaveScreenshot(`${look}-export.png`, {
          maxDiffPixels: 100,
        });
      });
    }
  });
});
```

**Coverage Target:** Visual parity between preview and export

### Layer 5: Geometric Validation Tests (Custom)

**File:** `tests/e2e/export-geometry.spec.ts` (new)

Validate element positions and distances:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Export Geometric Consistency', () => {
  test('elements maintain proportional distances', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

    // Measure preview element positions
    const previewCanvas = page.locator('[data-testid="preview-canvas"]');
    const previewBounds = await previewCanvas.boundingBox();

    const previewScreenshot = previewCanvas.locator('img[data-role="screenshot"]');
    const previewScreenshotBounds = await previewScreenshot.boundingBox();

    // Calculate relative position in preview
    const previewRelativeX = (previewScreenshotBounds.x - previewBounds.x) / previewBounds.width;
    const previewRelativeY = (previewScreenshotBounds.y - previewBounds.y) / previewBounds.height;

    // Measure export container positions
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) container.style.zIndex = '9999';
    });

    const exportContainer = page.locator('#export-container');
    const exportBounds = await exportContainer.boundingBox();

    const exportScreenshot = exportContainer.locator('img[data-role="screenshot"]');
    const exportScreenshotBounds = await exportScreenshot.boundingBox();

    // Calculate relative position in export
    const exportRelativeX = (exportScreenshotBounds.x - exportBounds.x) / exportBounds.width;
    const exportRelativeY = (exportScreenshotBounds.y - exportBounds.y) / exportBounds.height;

    // Assert proportional positions match (within 2% tolerance)
    expect(Math.abs(previewRelativeX - exportRelativeX)).toBeLessThan(0.02);
    expect(Math.abs(previewRelativeY - exportRelativeY)).toBeLessThan(0.02);
  });

  test('all expected elements present in export', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

    // Count elements in preview
    const previewElements = await page.locator('[data-testid="preview-canvas"] [data-export-element]').count();

    // Count elements in export container
    const exportElements = await page.locator('#export-container [data-export-element]').count();

    expect(exportElements).toBe(previewElements);
  });

  test('element distances scale proportionally', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-screenshot.png');

    // Measure distance between two elements in preview
    const elem1Preview = page.locator('[data-testid="preview-canvas"] [data-element="1"]');
    const elem2Preview = page.locator('[data-testid="preview-canvas"] [data-element="2"]');

    const bounds1Preview = await elem1Preview.boundingBox();
    const bounds2Preview = await elem2Preview.boundingBox();

    const distancePreview = Math.sqrt(
      Math.pow(bounds2Preview.x - bounds1Preview.x, 2) +
      Math.pow(bounds2Preview.y - bounds1Preview.y, 2)
    );

    // Measure same distance in export
    await page.evaluate(() => {
      const container = document.getElementById('export-container');
      if (container) container.style.zIndex = '9999';
    });

    const elem1Export = page.locator('#export-container [data-element="1"]');
    const elem2Export = page.locator('#export-container [data-element="2"]');

    const bounds1Export = await elem1Export.boundingBox();
    const bounds2Export = await elem2Export.boundingBox();

    const distanceExport = Math.sqrt(
      Math.pow(bounds2Export.x - bounds1Export.x, 2) +
      Math.pow(bounds2Export.y - bounds1Export.y, 2)
    );

    // Calculate scale factor (should be 1.5x for desktop)
    const scaleFactor = distanceExport / distancePreview;
    expect(scaleFactor).toBeCloseTo(1.5, 1); // 1.5 ±0.1
  });
});
```

**Coverage Target:** Proportional layout preservation

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add `data-export-element` attributes to all layout components
- [ ] Add `data-testid="preview-canvas"` to preview container
- [ ] Add `data-role="screenshot"` to screenshot images
- [ ] Extract export utilities into testable pure functions
- [ ] Create test fixtures (sample screenshots, various sizes)

### Phase 2: Unit Tests (Week 1)
- [ ] Write `tests/export-utils.test.ts`
- [ ] Test pixel ratio calculations
- [ ] Test dimension calculations
- [ ] Test scale factor logic
- [ ] Achieve 100% coverage of export utilities

### Phase 3: Component Tests (Week 2)
- [ ] Write `tests/ui/export-container.test.tsx`
- [ ] Test ExportContainer rendering
- [ ] Test CoverPreview static mode
- [ ] Test layout component isStatic behavior

### Phase 4: Integration Tests (Week 2)
- [ ] Write `tests/e2e/export.spec.ts`
- [ ] Test export button workflow
- [ ] Test file download mechanics
- [ ] Test validation (require screenshot)
- [ ] Test loading states

### Phase 5: Visual Regression (Week 3)
- [ ] Write `tests/e2e/export-visual.spec.ts`
- [ ] Generate baseline screenshots for all looks
- [ ] Implement visual comparison tests
- [ ] Add CI/CD integration for visual diffs

### Phase 6: Geometric Validation (Week 3)
- [ ] Write `tests/e2e/export-geometry.spec.ts`
- [ ] Implement position comparison logic
- [ ] Implement distance measurement tests
- [ ] Validate proportional scaling

### Phase 7: Edge Cases (Week 4)
- [ ] Test very large screenshots (4K+)
- [ ] Test very small screenshots (<500px)
- [ ] Test extreme aspect ratios (ultra-wide, tall)
- [ ] Test empty states (no screenshot)
- [ ] Test all look/variant combinations

---

## Code Examples & Patterns

### Pattern 1: Testable Export Utilities

**Current:** `domain/layout/export.ts:67-70` (inline logic)
```typescript
const desiredPixelRatio = pixelRatio ?? Math.max(window.devicePixelRatio || 1, 2);
const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;
const resolvedPixelRatio = Math.min(Math.max(desiredPixelRatio, 1), Math.max(Math.min(3, maxScale), 1));
```

**Refactored:** Extract to testable function
```typescript
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
```

**Test:**
```typescript
describe('calculatePixelRatio', () => {
  it('defaults to device pixel ratio or 2', () => {
    expect(calculatePixelRatio({ devicePixelRatio: 1 })).toBe(2);
    expect(calculatePixelRatio({ devicePixelRatio: 3 })).toBe(3);
  });

  it('respects maxImageScale', () => {
    expect(calculatePixelRatio({ maxImageScale: 1.5, devicePixelRatio: 3 })).toBe(1.5);
  });

  it('clamps to [1, 3]', () => {
    expect(calculatePixelRatio({ desiredPixelRatio: 0.5 })).toBe(1);
    expect(calculatePixelRatio({ desiredPixelRatio: 10 })).toBe(3);
  });
});
```

### Pattern 2: Data Attributes for Testing

**Add to layout components:**
```typescript
export function PopupGradient({ isStatic }: LayoutProps) {
  return (
    <div data-export-element data-element="container">
      <img
        src={screenshot.url}
        data-export-element
        data-element="screenshot"
        data-role="screenshot"
      />
      <div data-export-element data-element="gradient">
        {/* Gradient background */}
      </div>
    </div>
  );
}
```

**Query in tests:**
```typescript
const elements = page.locator('[data-export-element]');
await expect(elements).toHaveCount(3); // container + screenshot + gradient
```

### Pattern 3: Geometric Assertions

**Helper function:**
```typescript
async function getRelativePosition(
  container: Locator,
  element: Locator
): Promise<{ x: number; y: number }> {
  const containerBounds = await container.boundingBox();
  const elementBounds = await element.boundingBox();

  if (!containerBounds || !elementBounds) {
    throw new Error('Unable to get bounding boxes');
  }

  return {
    x: (elementBounds.x - containerBounds.x) / containerBounds.width,
    y: (elementBounds.y - containerBounds.y) / containerBounds.height,
  };
}
```

**Usage in tests:**
```typescript
const previewPos = await getRelativePosition(previewCanvas, previewScreenshot);
const exportPos = await getRelativePosition(exportContainer, exportScreenshot);

expect(Math.abs(previewPos.x - exportPos.x)).toBeLessThan(0.02);
expect(Math.abs(previewPos.y - exportPos.y)).toBeLessThan(0.02);
```

### Pattern 4: Visual Regression Baseline Management

**Directory structure:**
```
tests/
  __screenshots__/
    export-visual.spec.ts/
      popup-gradient-export-chromium-darwin.png
      hero-center-export-chromium-darwin.png
      adaptive-stage-export-chromium-darwin.png
      code-snippet-export-chromium-darwin.png
```

**Playwright config update:**
```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.01,
    },
  },
  snapshotDir: './tests/__screenshots__',
});
```

**Regenerate baselines:**
```bash
pnpm playwright test --update-snapshots
```

---

## Recommendations

### Immediate Priorities

1. **Extract Export Utilities** - Make pixel ratio/dimension calculations testable
2. **Add Data Attributes** - Instrument layouts for geometric testing
3. **Create Test Fixtures** - Sample screenshots of various sizes/aspect ratios
4. **Write Integration Tests** - Verify export button workflow end-to-end

### Long-Term Improvements

1. **Migrate Domain Tests to Vitest** - Consolidate test frameworks
2. **Add Accessibility Testing** - Use `@axe-core/playwright` for a11y audits
3. **Performance Benchmarks** - Track export time for large screenshots
4. **Cross-Browser Testing** - Expand beyond Chromium to Firefox/WebKit

### Tooling Additions

- **`@axe-core/playwright`** - Accessibility testing
- **`pixelmatch`** - Custom image diffing (alternative to Playwright visual)
- **`sharp`** - Image analysis (already available for domain tests)
- **`playwright-expect-image`** - Enhanced visual comparison

---

## Conclusion

Export testing requires a **multi-layered strategy** combining unit tests (pure functions), component tests (React rendering), integration tests (E2E workflow), visual regression tests (screenshot comparison), and geometric validation (layout consistency).

The current codebase has **zero export test coverage**, leaving a critical user-facing feature untested. Implementing the proposed strategy will:

✅ Ensure exported PNGs match preview rendering
✅ Validate proportional layout scaling
✅ Catch regressions in export quality
✅ Document expected export behavior
✅ Enable confident refactoring of export pipeline

**Next Step:** Begin with Phase 1 (foundation) and Phase 4 (integration tests) for immediate value, then expand to visual/geometric testing for comprehensive coverage.
