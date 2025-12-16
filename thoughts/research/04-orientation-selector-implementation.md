# Research: Orientation Selector Implementation

## Overview

This research covers the implementation of an orientation selector feature that allows users to choose output aspect ratio (Horizontal 16:9, Vertical 9:16, Square 1:1). The orientation will constrain which layouts are available and determine canvas/export dimensions. **Default orientation will be detected based on device type** (mobile defaults to vertical, desktop to horizontal).

## Key Files & Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| `hooks/atoms.ts` | Global state atoms with localStorage persistence | 13, 29-37 |
| `components/layout-selector.tsx` | Layout selection UI and asset type dropdown | 49-50, 166-197, 212-230 |
| `domain/layout-def/definitions.ts` | Layout definitions with capabilities | 18-34, 98-342 |
| `domain/layout/screenshot-mode.ts` | Canvas dimension calculations | 5-6, 56-86 |
| `domain/layout/export.ts` | PNG export with dimensions | 30-40, 47-57 |
| `components/ui/segmented-control.tsx` | Custom segmented control component | 1-66 |
| `hooks/atoms/derived.ts` | Derived state atoms (canvas, capabilities) | 11-67 |

## Architecture & Data Flow

### 1. State Management (Jotai)

**Current Pattern:**
- Uses `atomWithStorage` for session persistence
- Example: `assetTypeAtom = atomWithStorage<AssetType>("dopeshot:assetType", "screenshot")`
- Persists to localStorage automatically

**For Orientation:**
```typescript
// In hooks/atoms.ts
export type Orientation = "horizontal" | "vertical" | "square";

// Device detection helper
const getDefaultOrientation = (): Orientation => {
  if (typeof window === 'undefined') return "horizontal";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ? "vertical"
    : "horizontal";
};

export const orientationAtom = atomWithStorage<Orientation>(
  "dopeshot:orientation",
  getDefaultOrientation()
);
```

### 2. Layout Filtering System

**Current Pattern (from layout-selector.tsx:132-137):**
```typescript
if (assetType === "code") {
  return previewConfigs.filter((option) => option.layoutId === "code-snippet");
}
return previewConfigs.filter((option) => supportsScreenshots(option.layoutId));
```

**For Orientation Filtering:**
Each layout definition needs a `supportedOrientations` array in capabilities:

```typescript
// In domain/layout-def/definitions.ts (LayoutCapabilities interface, lines 18-34)
export type LayoutCapabilities = {
  focusMode: "auto" | "always" | "never";
  canvasBehavior: LayoutCanvasBehavior;
  zoomBehavior: "disabled" | "canvas-based" | "screenshot-based";
  text: { required: boolean; supportsSubtitle: boolean };
  typography: { showFontPicker: boolean; showOutlineControl: boolean };
  logo: { supported: boolean };
  screenshot: { supported: boolean };
  supportedOrientations?: Orientation[]; // ADD THIS
};
```

### 3. Canvas Dimensions

**Current System (screenshot-mode.ts:5-6):**
```typescript
export const DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720; // 16:9
export const BASE_CANVAS_WIDTH = 1280;
```

**Orientation-Based Dimensions:**

| Orientation | Dimensions | Aspect Ratio |
|------------|------------|--------------|
| Horizontal | 1920×1080 | 16:9 (1.777:1) |
| Vertical | 1080×1920 | 9:16 (0.5625:1) |
| Square | 1080×1080 | 1:1 (1.0:1) |

**Implementation Strategy:**
Modify `getCanvasDimensions()` in `screenshot-mode.ts:56-86` to accept orientation parameter and adjust base dimensions accordingly.

### 4. Layout Auto-Selection

**Current Pattern (layout-selector.tsx:166-197):**
The `handleAssetTypeChange()` callback:
1. Stores current layout in `lastLayoutByAssetType`
2. Updates `assetType` atom
3. Switches to appropriate layout based on asset type

**For Orientation:**
Similar callback `handleOrientationChange()`:
1. Check if current layout supports new orientation
2. If not, select first compatible layout from filtered list
3. Update `orientationAtom`
4. Track analytics

## Layout-Orientation Compatibility Matrix

Based on layout capabilities analysis:

| Layout | Variants | Horizontal | Vertical | Square | Notes |
|--------|----------|------------|----------|--------|-------|
| Peak (popup-gradient) | left, right, center | ✅ | ✅ | ✅ | All variants adaptive |
| Spotlight (hero-center) | left, right | ✅ | ❌ | ✅ | Horizontal emphasis |
| Backdrop (adaptive-stage) | - | ✅ | ✅ | ✅ | Fully adaptive |
| Code (code-snippet) | - | ✅ | ✅ | ✅ | Text-based, all ratios |

**Recommended Defaults by Orientation:**
- Horizontal → Peak Center (popup-gradient-center)
- Vertical → Peak Center (popup-gradient-center)
- Square → Backdrop (adaptive-stage)

## Code Examples

### Example 1: Orientation Atom Definition

```typescript
// File: hooks/atoms.ts (add after line 29)
export type Orientation = "horizontal" | "vertical" | "square";

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

### Example 2: Orientation Selector Component

```typescript
// File: components/layout-selector.tsx (add after asset type dropdown)
import { SegmentedControl } from "@/components/ui/segmented-control";
import { orientationAtom } from "@/hooks/atoms";

// Inside LayoutSelector component:
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
      // Find first compatible layout
      const compatibleLayout = LAYOUT_DEFINITIONS.find((def) =>
        def.capabilities.supportedOrientations?.includes(newOrientation)
      );

      if (compatibleLayout) {
        setConfig((prev) => ({
          ...prev,
          layoutId: compatibleLayout.id,
        }));
      }
    }

    setOrientation(newOrientation);
  },
  [config.layoutId, setConfig, setOrientation]
);

// In render:
<SegmentedControl
  options={orientationOptions}
  value={orientation}
  onChange={handleOrientationChange}
/>
```

### Example 3: Update Layout Definitions

```typescript
// File: domain/layout-def/definitions.ts
// Update each layout's capabilities (lines 100-342)

// Peak - supports all orientations
{
  id: "popup-gradient",
  name: "Peak",
  // ...
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}

// Spotlight - horizontal and square only
{
  id: "hero-center",
  name: "Spotlight",
  // ...
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "square"],
  },
}

// Backdrop - all orientations
{
  id: "adaptive-stage",
  name: "Backdrop",
  // ...
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}

// Code - all orientations
{
  id: "code-snippet",
  name: "Code",
  // ...
  capabilities: {
    // ... existing capabilities
    supportedOrientations: ["horizontal", "vertical", "square"],
  },
}
```

### Example 4: Canvas Dimensions Based on Orientation

```typescript
// File: domain/layout/screenshot-mode.ts
// Modify getCanvasDimensions function (lines 56-86)

import { orientationAtom } from "@/hooks/atoms";
import { useAtomValue } from "jotai";

const ORIENTATION_DIMENSIONS = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

export function getCanvasDimensions(
  config: LayoutConfig,
  screenshot: Asset | null,
  orientation: Orientation = "horizontal"
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

### Example 5: Update Derived Canvas Atom

```typescript
// File: hooks/atoms/derived.ts (lines 27-31)
import { orientationAtom } from "./atoms";

export const canvasAtom = atom((get) => {
  const config = get(configAtom);
  const screenshot = get(screenshotAssetAtom);
  const orientation = get(orientationAtom); // ADD THIS
  return getCanvasDimensions(config, screenshot, orientation);
});
```

### Example 6: Filter Layouts by Orientation

```typescript
// File: components/layout-selector.tsx
// Update the filtering logic (around lines 132-137)

const filteredOptions = useMemo(() => {
  let options = previewConfigs;

  // Filter by asset type
  if (assetType === "code") {
    options = options.filter((option) => option.layoutId === "code-snippet");
  } else {
    options = options.filter((option) => supportsScreenshots(option.layoutId));
  }

  // Filter by orientation
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

## UI Placement

Based on the current layout-selector.tsx structure:

```
Current (lines 209-256):
┌─────────────────────────────────────┐
│ <Select> (Asset Type Dropdown)      │  Lines 212-230
│   Screenshot ▾                      │
│   - Screenshot                      │
│   - Code                            │
└─────────────────────────────────────┘

│ <div> (Layout Preview Cards)        │  Lines 233-254
│   Horizontal scroll grid            │
└─────────────────────────────────────┘
```

**New Structure:**
```
┌─────────────────────────────────────┐
│ <Select> (Asset Type Dropdown)      │
│   Screenshot ▾                      │
├─────────────────────────────────────┤
│ <SegmentedControl> (Orientation)    │  ← NEW (add after line 230)
│   [Horizontal] [Vertical] [Square]  │
├─────────────────────────────────────┤
│ <div> (Layout Preview Cards)        │
│   Horizontal scroll grid            │
│   (filtered by orientation)         │
└─────────────────────────────────────┘
```

Insert orientation selector between lines 230-233 with spacing class `mt-3`.

## Recommendations

### Implementation Steps

1. **Add orientation type and atom** (hooks/atoms.ts)
   - Define `Orientation` type
   - Create device detection helper
   - Add `orientationAtom` with device-aware default

2. **Update layout capabilities** (domain/layout-def/definitions.ts)
   - Add `supportedOrientations` to LayoutCapabilities interface
   - Define supported orientations for each layout

3. **Create orientation selector component** (components/layout-selector.tsx)
   - Import SegmentedControl
   - Add orientation state hook
   - Implement handleOrientationChange with auto-layout-selection
   - Insert UI between asset type and layout rail

4. **Update canvas dimension logic** (domain/layout/screenshot-mode.ts)
   - Add orientation parameter to getCanvasDimensions
   - Define ORIENTATION_DIMENSIONS constant
   - Apply orientation-based dimensions for locked mode

5. **Update derived canvas atom** (hooks/atoms/derived.ts)
   - Pass orientation to getCanvasDimensions

6. **Add layout filtering** (components/layout-selector.tsx)
   - Filter preview cards by orientation
   - Auto-select compatible layout on orientation change

7. **Test export dimensions** (domain/layout/export.ts)
   - Verify export uses correct canvas dimensions
   - Test all orientation × layout combinations

### Edge Cases to Handle

1. **Server-side rendering:** Device detection in `getDefaultOrientation()` checks for `window` to avoid SSR errors
2. **Layout incompatibility:** If no layouts support an orientation (unlikely), fallback to horizontal
3. **State persistence:** localStorage may fail in private browsing—handle gracefully
4. **Layout variant handling:** Ensure flattened layout IDs (e.g., "popup-gradient-left") are checked correctly

### Testing Checklist

- [ ] Orientation selector appears between asset type and layout rail
- [ ] Mobile devices default to vertical orientation
- [ ] Desktop devices default to horizontal orientation
- [ ] Changing orientation filters layout rail
- [ ] Incompatible layouts auto-switch to compatible ones
- [ ] Canvas dimensions update correctly
- [ ] Export produces correct aspect ratio
- [ ] localStorage persists orientation choice
- [ ] All layout × orientation combinations render correctly

## Potential Concerns

1. **Mobile UX:** Three-button segmented control may be cramped on small screens—consider icon-based buttons
2. **Layout availability:** Ensure at least one layout supports each orientation
3. **Performance:** Layout filtering happens on every orientation change—optimize with useMemo
4. **Migration:** Existing users won't have orientation in localStorage—default detection handles this
5. **Aspect ratio detection:** Current aspect.ts categorization may conflict with explicit orientation—keep them separate

## Additional Notes

- The existing `domain/layout/aspect.ts` categorizes aspect ratios (portrait/landscape/square) for **recommendation purposes**—this is separate from explicit orientation selection
- SegmentedControl component already exists and matches design system
- No new dependencies needed—all primitives available
- Follow existing pattern: add atom → update types → build UI → wire state → test
