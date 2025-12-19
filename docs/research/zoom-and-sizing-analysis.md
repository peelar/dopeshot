# Zoom and Screenshot Sizing Analysis

## Overview

This document analyzes how zooming and screenshot sizing currently work in the codebase, with a focus on understanding the differences needed for implementing per-look zoom behaviors.

---

## 1. Zoom Slider/Controls

**Files:**
- `components/screenshot-zoom-slider.tsx` (lines 1-38)
- `components/playground-workspace.tsx` (lines 46, 89)

**Implementation:**

The zoom slider is a simple HTML range input:
- Minimum: 0.5 (50% zoom)
- Maximum: 1.5 (150% zoom)
- Step: 0.05
- Default value: 1.0

```tsx
// screenshot-zoom-slider.tsx
<input
  type="range"
  min={0.5}
  max={1.5}
  step={0.05}
  value={value}
  onChange={(e) => onChange(parseFloat(e.target.value))}
/>
```

**State Management:**

The zoom value is stored in a Jotai atom:

```typescript
// hooks/atoms.ts:21
export const screenshotZoomAtom = atom<number>(1.0);
```

---

## 2. How Zoom Affects Screenshots

**Key Insight:** Zoom only applies CSS `transform: scale()` to the screenshot element. It does NOT affect canvas dimensions or export resolution.

Each look component applies zoom independently:

### Peak Look (PopupGradient)
`components/looks/PopupGradient.tsx`

- Center variant (line 102): `transform: \`scale(${screenshotZoom})\``
  - `transformOrigin: "bottom center"`
- Side variants (line 140): `transform: \`scale(${screenshotZoom})\``
  - `transformOrigin`: "right bottom" or "left bottom"
- Additional internal scaling: `SIDE_SCREENSHOT_ZOOM = 1.35` (line 14)

### Spotlight Look (HeroCenter)
`components/looks/HeroCenter.tsx`

- Lines 125, 165: `transform: \`scale(${screenshotZoom})\``
- Applied to screenshot frame container

### Backdrop Look (AdaptiveScreenshot)
`components/looks/AdaptiveScreenshot.tsx`

- Line 68: `transform: \`scale(${screenshotZoom})\``
- Applied at the frame level with max-width/max-height constraints

---

## 3. Canvas Dimensions

**Files:**
- `domain/layout/screenshot-mode.ts` (lines 56-72)
- `hooks/atoms/derived.ts` (lines 27-31)

**Constants:**
- `BASE_CANVAS_WIDTH = 1280` (line 6)
- `DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720` = 1.777... (line 5)

**Canvas Calculation:**

```typescript
export function getCanvasDimensions(
  config: LayoutConfig,
  screenshotAsset?: Asset | null,
): { width: number; height: number; aspectRatio: number; mode: CanvasMode } {
  const effectiveMode = getEffectiveCanvasMode(config);
  const lockedAspect = treatment.lockedAspectRatio || DEFAULT_LOCKED_ASPECT_RATIO;
  const screenshotAspect = screenshotAsset?.metadata?.aspectRatio;

  // If locked mode, use 16:9. If adaptive, use screenshot's aspect ratio
  const aspectRatio = effectiveMode === "locked"
    ? lockedAspect
    : screenshotAspect || lockedAspect;

  return {
    width: BASE_CANVAS_WIDTH,  // Always 1280
    height: Math.round(BASE_CANVAS_WIDTH / aspectRatio),
    aspectRatio,
    mode: effectiveMode,
  };
}
```

### Two Canvas Modes

| Mode | Behavior | Default For |
|------|----------|-------------|
| **Locked** | Fixed 16:9 (1280x720) | Peak, Spotlight |
| **Adaptive** | Height varies by screenshot AR | Backdrop |

---

## 4. Three Levels of Scaling

### Level 1: PreviewViewport Scale
`components/preview-viewport.tsx` (lines 30-101)

- Responsive scale to fit screen
- Calculated: `containerWidth / surfaceWidth`
- Never exceeds 1.0 (no upscaling)
- Applied via CSS transform at the viewport level

```typescript
const updateScale = useCallback(() => {
  const width = containerRef.current.clientWidth;
  const nextScale = Math.min(width / surfaceWidth, 1);
  setScale(nextScale);
}, [surfaceWidth]);
```

### Level 2: Screenshot Zoom (User-Controlled)
- Range: 0.5 - 1.5
- Applied only to screenshot element via CSS transform
- Does NOT affect canvas/surface dimensions
- Each look applies this individually

### Level 3: Look-Specific Internal Scaling
- PopupGradient: `SIDE_SCREENSHOT_ZOOM = 1.35` for side variants
- Additional internal scaling of the image within containers

---

## 5. Current Zoom Behavior

Currently, zoom works the same way for all looks:

1. User adjusts slider (0.5 - 1.5)
2. Look component reads `screenshotZoom` atom
3. Look applies `transform: scale(screenshotZoom)` to screenshot container
4. Screenshot scales visually within the fixed canvas

**When switching looks:**
Zoom resets to 1.0 (`components/look-selector.tsx:105`):

```typescript
const handleSelect = () => {
  setConfig(...);
  setScreenshotZoom(1.0);  // RESETS ZOOM TO DEFAULT
};
```

---

## 6. Export Behavior

`hooks/use-playground-controller.ts` (lines 255-267)

Exports use canvas dimensions, NOT the zoom slider value:

```typescript
await exportLayoutAsPng("export-container", "cover-image.png", {
  width: canvas.width,   // Always 1280
  height: canvas.height, // 720 for locked, varies for adaptive
  maxImageScale,         // Prevents upscaling beyond native resolution
});
```

---

## 7. Peak Look Specifics

**Definition:** `domain/look/definitions.ts` (lines 47-106)

```typescript
{
  id: "popup-gradient",
  name: "Peak",
  variants: ["left", "right", "center"],
  capabilities: {
    canvasBehavior: "locked",  // Always 16:9
    // ...
  },
}
```

**Current Peak Zoom Behavior:**
- Applies `scale(screenshotZoom)` to the screenshot
- Uses `transformOrigin` to anchor the scaling (bottom center or bottom corners)
- The screenshot can "grow" or "shrink" visually, potentially overflowing

---

## 8. Proposed Behavior Differences

### Default Behavior (Current)
- Zoom scales the screenshot visually
- Screenshot dimensions change
- Layout may need to accommodate the scaled screenshot

### Peak Look Behavior (Desired)
- Zoom should change **perspective/depth**, not dimensions
- Screenshot dimensions stay locked
- Zooming out should make the screenshot appear "further away"
- This implies a **3D transform** rather than a simple 2D scale

---

## 9. Key Questions for Implementation

1. **How should "perspective change" work technically?**
   - CSS `perspective` + `translateZ`?
   - Scale with padding compensation?
   - Actual 3D transforms?

2. **What exactly stays "locked"?**
   - The container size?
   - The screenshot's visual footprint?
   - The relationship to other elements (text, gradient)?

3. **Should zoom-out add "depth" effects?**
   - Shadow changes?
   - Slight tilt/rotation?
   - Blur for depth-of-field effect?

---

## Summary Table

| Aspect | Current Value |
|--------|---------------|
| Zoom Range | 0.5 - 1.5 |
| Default Zoom | 1.0 |
| Canvas Width | Always 1280px |
| Canvas Height | Locked: 720px / Adaptive: Varies |
| Zoom Effect | CSS `transform: scale()` on screenshot |
| Export Resolution | Canvas dimensions (not affected by zoom) |
| Peak Look ID | "popup-gradient" |
| Peak Variants | left, right, center |
