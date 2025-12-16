# Implementation Plan: Orientation Selector

## Overview

This plan implements an orientation selector feature that allows users to choose output aspect ratio (Horizontal 16:9, Vertical 9:16, Square 1:1). The orientation will:
- Constrain which layouts are available (filtering based on layout capabilities)
- Determine canvas and export dimensions
- Default based on device type (mobile → vertical, desktop → horizontal)
- Persist to localStorage for session continuity

## Implementation Approach

We'll follow the established Jotai state management pattern and leverage existing UI components (SegmentedControl). The implementation is broken into logical phases that build upon each other:

1. **Foundation**: Add state management and type definitions
2. **Layout System**: Update layout capabilities and filtering
3. **Canvas Integration**: Wire orientation into dimension calculations
4. **UI Components**: Build the selector interface
5. **Testing & Polish**: Verify all combinations work correctly
6. **Documentation**: Update README with new feature

This approach minimizes risk by keeping each phase independently testable and follows the existing codebase patterns (atomWithStorage, capability-based filtering, derived atoms).

---

## Phase 1: Foundation - State Management & Types

### Changes Required

#### 1. Add Orientation Type and Atom
**File**: `hooks/atoms.ts` (add after line 29)
**Changes**: Define orientation type, device detection helper, and persistent atom

```typescript
// Orientation types
export type Orientation = "horizontal" | "vertical" | "square";

/**
 * Detect default orientation based on device type
 * Mobile devices default to vertical, desktop to horizontal
 */
const getDefaultOrientation = (): Orientation => {
  if (typeof window === 'undefined') return "horizontal";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  return isMobile ? "vertical" : "horizontal";
};

export const orientationAtom = atomWithStorage<Orientation>(
  "dopeshot:orientation",
  getDefaultOrientation()
);
```

#### 2. Update Layout Capabilities Interface
**File**: `domain/layout-def/definitions.ts` (update LayoutCapabilities interface around lines 18-34)
**Changes**: Add optional supportedOrientations field

```typescript
export type LayoutCapabilities = {
  focusMode: "auto" | "always" | "never";
  canvasBehavior: LayoutCanvasBehavior;
  zoomBehavior: "disabled" | "canvas-based" | "screenshot-based";
  text: { required: boolean; supportsSubtitle: boolean };
  typography: { showFontPicker: boolean; showOutlineControl: boolean };
  logo: { supported: boolean };
  screenshot: { supported: boolean };
  supportedOrientations?: Orientation[]; // NEW: defaults to all if not specified
};
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`
- [ ] No lint errors: `pnpm lint`

#### Manual Verification
- [ ] `orientationAtom` is exported from `hooks/atoms.ts`
- [ ] Default orientation is "horizontal" in desktop browser
- [ ] Default orientation is "vertical" when using mobile user agent
- [ ] localStorage key `dopeshot:orientation` is created on first load
- [ ] `LayoutCapabilities` type includes `supportedOrientations` field

---

## Phase 2: Layout System - Capabilities & Filtering

### Changes Required

#### 1. Define Supported Orientations for Each Layout
**File**: `domain/layout-def/definitions.ts` (update each layout definition in lines 98-342)
**Changes**: Add supportedOrientations to each layout's capabilities

```typescript
// Peak (popup-gradient) - supports all orientations
{
  id: "popup-gradient",
  name: "Peak",
  // ... existing fields
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}

// Spotlight (hero-center) - horizontal and square only (vertical too cramped)
{
  id: "hero-center",
  name: "Spotlight",
  // ... existing fields
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "square"],
  },
}

// Backdrop (adaptive-stage) - all orientations
{
  id: "adaptive-stage",
  name: "Backdrop",
  // ... existing fields
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}

// Code (code-snippet) - all orientations
{
  id: "code-snippet",
  name: "Code",
  // ... existing fields
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}
```

#### 2. Add Orientation Filtering Logic
**File**: `components/layout-selector.tsx` (update filtering around lines 132-137)
**Changes**: Add orientation-based filtering to existing asset type filtering

```typescript
import { orientationAtom } from "@/hooks/atoms";

// Inside LayoutSelector component, add:
const [orientation] = useAtom(orientationAtom);

const filteredOptions = useMemo(() => {
  let options = previewConfigs;

  // Filter by asset type (existing)
  if (assetType === "code") {
    options = options.filter((option) => option.layoutId === "code-snippet");
  } else {
    options = options.filter((option) => supportsScreenshots(option.layoutId));
  }

  // Filter by orientation (NEW)
  options = options.filter((option) => {
    const def = getLayoutDefinition(option.layoutId);
    const supportedOrientations = def?.capabilities.supportedOrientations ?? [
      "horizontal",
      "vertical",
      "square",
    ];
    return supportedOrientations.includes(orientation);
  });

  return options;
}, [previewConfigs, assetType, orientation]);
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] All layouts have `supportedOrientations` defined or default to all
- [ ] Peak layout shows in all orientations
- [ ] Spotlight layout does NOT show in vertical orientation
- [ ] Backdrop and Code layouts show in all orientations
- [ ] Changing orientation (via console) filters layout rail correctly

---

## Phase 3: Canvas Integration - Dimension Calculations

### Changes Required

#### 1. Update Canvas Dimensions Function
**File**: `domain/layout/screenshot-mode.ts` (modify getCanvasDimensions function, lines 56-86)
**Changes**: Add orientation parameter and dimension mapping

```typescript
import type { Orientation } from "@/hooks/atoms";

const ORIENTATION_DIMENSIONS = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

export function getCanvasDimensions(
  config: LayoutConfig,
  screenshot: Asset | null,
  orientation: Orientation = "horizontal" // NEW parameter
): { width: number; height: number; aspectRatio: number } {
  const treatment = getScreenshotTreatment(config);
  const canvasMode = getEffectiveCanvasMode(treatment, screenshot);

  if (canvasMode === "locked") {
    const dims = ORIENTATION_DIMENSIONS[orientation];
    return {
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.width / dims.height,
    };
  }

  // Adaptive mode - use screenshot dimensions
  if (screenshot?.metadata?.dimensions) {
    const { width, height } = screenshot.metadata.dimensions;
    return { width, height, aspectRatio: width / height };
  }

  // Fallback to orientation defaults
  const dims = ORIENTATION_DIMENSIONS[orientation];
  return {
    width: dims.width,
    height: dims.height,
    aspectRatio: dims.width / dims.height,
  };
}
```

#### 2. Update Derived Canvas Atom
**File**: `hooks/atoms/derived.ts` (update canvasAtom around lines 27-31)
**Changes**: Pass orientation to getCanvasDimensions

```typescript
import { orientationAtom } from "./atoms";

export const canvasAtom = atom((get) => {
  const config = get(configAtom);
  const screenshot = get(screenshotAssetAtom);
  const orientation = get(orientationAtom); // NEW
  return getCanvasDimensions(config, screenshot, orientation);
});
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Canvas dimensions are 1920×1080 for horizontal orientation
- [ ] Canvas dimensions are 1080×1920 for vertical orientation
- [ ] Canvas dimensions are 1080×1080 for square orientation
- [ ] Adaptive layouts still respect screenshot dimensions
- [ ] Locked layouts use orientation-based dimensions
- [ ] Export preview shows correct aspect ratio

---

## Phase 4: UI Components - Orientation Selector

### Changes Required

#### 1. Add Orientation Selector Component
**File**: `components/layout-selector.tsx` (add after asset type dropdown, around line 230)
**Changes**: Add SegmentedControl for orientation selection with auto-layout-switching

```typescript
import { SegmentedControl } from "@/components/ui/segmented-control";
import { orientationAtom } from "@/hooks/atoms";

// Inside LayoutSelector component, add hooks:
const [orientation, setOrientation] = useAtom(orientationAtom);

const orientationOptions = [
  { id: "horizontal" as const, label: "Horizontal" },
  { id: "vertical" as const, label: "Vertical" },
  { id: "square" as const, label: "Square" },
];

const handleOrientationChange = useCallback(
  (newOrientation: Orientation) => {
    // Check if current layout supports new orientation
    const currentDef = getLayoutDefinition(config.layoutId);
    const supportedOrientations = currentDef?.capabilities.supportedOrientations ?? [
      "horizontal",
      "vertical",
      "square",
    ];

    if (!supportedOrientations.includes(newOrientation)) {
      // Find first compatible layout from filtered options
      const compatibleLayout = LAYOUT_DEFINITIONS.find((def) => {
        const orientations = def.capabilities.supportedOrientations ?? [
          "horizontal",
          "vertical",
          "square",
        ];
        return orientations.includes(newOrientation);
      });

      if (compatibleLayout) {
        setConfig((prev) => ({
          ...prev,
          layoutId: compatibleLayout.id,
        }));
      }
    }

    setOrientation(newOrientation);

    // Track analytics if available
    // trackEvent("orientation_changed", { orientation: newOrientation });
  },
  [config.layoutId, setConfig, setOrientation]
);

// In JSX, add between asset type dropdown and layout rail:
<div className="mt-3">
  <SegmentedControl
    options={orientationOptions}
    value={orientation}
    onChange={handleOrientationChange}
  />
</div>
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Orientation selector appears below asset type dropdown
- [ ] Three buttons: Horizontal, Vertical, Square
- [ ] Clicking orientation updates state immediately
- [ ] If current layout doesn't support new orientation, auto-switches to compatible layout
- [ ] Selection persists across page refreshes (localStorage)
- [ ] UI is responsive on mobile screens

---

## Phase 5: Testing & Polish

### Changes Required

#### 1. Add Unit Tests for Orientation Logic
**File**: `domain/layout/__tests__/screenshot-mode.test.ts` (create or update)
**Changes**: Add tests for orientation-based dimensions

```typescript
import { getCanvasDimensions } from "../screenshot-mode";
import type { Orientation } from "@/hooks/atoms";

describe("getCanvasDimensions with orientation", () => {
  it("returns 1920×1080 for horizontal orientation", () => {
    const result = getCanvasDimensions(mockLockedConfig, null, "horizontal");
    expect(result).toEqual({
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    });
  });

  it("returns 1080×1920 for vertical orientation", () => {
    const result = getCanvasDimensions(mockLockedConfig, null, "vertical");
    expect(result).toEqual({
      width: 1080,
      height: 1920,
      aspectRatio: 1080 / 1920,
    });
  });

  it("returns 1080×1080 for square orientation", () => {
    const result = getCanvasDimensions(mockLockedConfig, null, "square");
    expect(result).toEqual({
      width: 1080,
      height: 1080,
      aspectRatio: 1.0,
    });
  });

  it("respects screenshot dimensions in adaptive mode", () => {
    const result = getCanvasDimensions(
      mockAdaptiveConfig,
      mockScreenshot,
      "vertical"
    );
    expect(result.width).toBe(mockScreenshot.metadata.dimensions.width);
    expect(result.height).toBe(mockScreenshot.metadata.dimensions.height);
  });
});
```

#### 2. Manual Testing Checklist
Create a testing script to verify all combinations:

**Test Matrix**:
- 3 orientations × 4 layouts = 12 combinations
- Asset type switching (screenshot/code) × orientations
- Device detection (mobile/desktop defaults)
- localStorage persistence
- Export dimensions

### Success Criteria

#### Automated Verification
- [ ] All tests pass: `pnpm test:domain`
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Horizontal orientation + Peak layout = 1920×1080 canvas
- [ ] Vertical orientation + Peak layout = 1080×1920 canvas
- [ ] Square orientation + Backdrop layout = 1080×1080 canvas
- [ ] Vertical orientation auto-switches from Spotlight to Peak
- [ ] Mobile user agent defaults to vertical on first visit
- [ ] Desktop user agent defaults to horizontal on first visit
- [ ] Orientation persists after page reload
- [ ] Exported PNG has correct dimensions for each orientation
- [ ] All layout variants render correctly in each supported orientation
- [ ] SegmentedControl is keyboard accessible (tab + arrow keys)
- [ ] No layout breaks or text overflow in any combination

---

## Phase 6: Documentation

### Changes Required

#### 1. Update README.md
**File**: `README.md`
**Changes**: Document orientation selector feature

Add to features section:
```markdown
### Orientation Selector

Choose your output aspect ratio:
- **Horizontal (16:9)**: 1920×1080 - Perfect for desktop screenshots, tutorials
- **Vertical (9:16)**: 1080×1920 - Optimized for mobile, social stories
- **Square (1:1)**: 1080×1080 - Instagram posts, social media

The selector intelligently:
- Defaults based on device type (mobile → vertical, desktop → horizontal)
- Filters available layouts based on orientation compatibility
- Auto-switches to compatible layouts when orientation changes
- Persists your choice across sessions
```

Add to architecture section:
```markdown
### State Management

Orientation state uses Jotai's `atomWithStorage` for persistence:
- `orientationAtom` in `hooks/atoms.ts` - current orientation
- `canvasAtom` in `hooks/atoms/derived.ts` - computed canvas dimensions
- Device detection via user agent on first load
```

#### 2. Update Internal Documentation
**File**: `docs/product/index.md` (if exists)
**Changes**: Add orientation feature to product documentation

### Success Criteria

#### Automated Verification
- [ ] README renders correctly in markdown preview
- [ ] All internal links work

#### Manual Verification
- [ ] Orientation feature is documented with examples
- [ ] Dimensions for each orientation are specified
- [ ] Device detection behavior is explained
- [ ] State persistence is mentioned
- [ ] Architecture section includes orientation atoms

---

## Rollback Plan

If issues arise, rollback can be done phase-by-phase in reverse order:

### Phase 6 → 5: Remove Documentation
- Revert README.md changes
- No code impact

### Phase 5 → 4: Remove Tests
- Delete test files
- No production code impact

### Phase 4 → 3: Remove UI Component
- Remove SegmentedControl from layout-selector.tsx
- Remove handleOrientationChange callback
- Keep orientation atom (no harm, just unused)

### Phase 3 → 2: Revert Canvas Integration
- Revert getCanvasDimensions to remove orientation parameter
- Revert canvasAtom to not use orientationAtom
- Default dimensions will be used (1280×720)

### Phase 2 → 1: Remove Layout Filtering
- Remove orientation filtering logic from layout-selector.tsx
- Remove supportedOrientations from layout definitions

### Phase 1 → 0: Remove Foundation
- Delete orientationAtom from hooks/atoms.ts
- Remove Orientation type
- Remove supportedOrientations from LayoutCapabilities interface

### Emergency Rollback (All Phases)
```bash
git revert <commit-range>
pnpm install
pnpm run build
pnpm test
```

### Partial Rollback Strategy
The phased approach allows keeping working phases while rolling back problematic ones. For example:
- Keep Phase 1-3 (working canvas dimensions) while fixing Phase 4 (UI issues)
- Keep Phase 1-2 (state + layout filtering) while redesigning Phase 3 (dimension calculations)

---

## Notes

- **No new dependencies**: Uses existing SegmentedControl and Jotai patterns
- **Performance**: Layout filtering uses useMemo to prevent unnecessary recalculations
- **Mobile-first**: Segmented control should be touch-friendly with adequate tap targets
- **Accessibility**: SegmentedControl should support keyboard navigation and screen readers
- **Analytics ready**: Add tracking hooks in handleOrientationChange for future analytics integration
- **Edge case handled**: Default to all orientations if supportedOrientations is undefined
- **SSR safe**: Device detection checks for window existence
