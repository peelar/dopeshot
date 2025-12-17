# Research: Canvas-Slider Spacing Bug (h-full Issue)

## Problem Statement

The slider component is positioned too far below the canvas due to excessive whitespace. The issue manifests specifically on desktop orientation but works correctly on mobile.

**Root Cause:** The parent container with `"flex h-full w-full justify-center"` (`preview-viewport.tsx:113`) is taking more vertical space than needed, pushing the slider down. On mobile, the layout adapts correctly, suggesting orientation-dependent layout issues.

---

## Overview

The bug involves three key components:
1. **Outer container** (`flex h-full w-full justify-center`) - Takes too much vertical space
2. **Inner canvas** (`relative overflow-hidden rounded-lg shadow-sm`) - Dynamically sized via ResizeObserver
3. **Slider component** (`flex items-center justify-center`) - Pushed down by excessive container height

The layout works correctly on mobile (`orientation === "mobile"`) but fails on desktop (`orientation === "desktop"`), indicating orientation-specific CSS or dimension calculations are involved.

---

## Key Files & Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| `components/preview-viewport.tsx` | Canvas rendering & scaling logic | 113 (outer container), 116 (inner canvas), 37-85 (ResizeObserver) |
| `components/playground-workspace.tsx` | Parent layout managing canvas + slider | 117 (gap-6 spacing), 171 (canvas container), 191 (slider placement) |
| `components/screenshot-zoom-slider.tsx` | Slider component definition | 26 (flex container), 37 (fixed width w-32) |
| `components/playground-page.tsx` | Top-level responsive layout | 114 (mobile/desktop flex direction), 138 (sidebar w-80) |
| `domain/layout/screenshot-mode.ts` | Canvas dimension calculations | 10-13 (ORIENTATION_DIMENSIONS), 69-125 (getCanvasDimensions) |
| `hooks/atoms/derived.ts` | Canvas atom state management | 27-32 (canvasAtom) |
| `hooks/use-mobile-detection.ts` | Mobile breakpoint detection | 11 (768px breakpoint) |

---

## Architecture & Data Flow

### Layout Hierarchy

```
playground-page.tsx (line 114)
└─ Two-column layout (flex-row on desktop, flex-col on mobile)
   ├─ Sidebar (w-80, hidden on mobile) [line 138]
   └─ Main content area [line 123]
      └─ playground-workspace.tsx [line 117]
         └─ Container (flex flex-col gap-6 max-w-4xl)
            ├─ Orientation toggle controls [lines 118-169]
            ├─ Canvas container (flex min-h-0 flex-1) [line 171]
            │  └─ preview-viewport.tsx [line 113]
            │     └─ Outer div (flex h-full w-full justify-center) ⚠️ PROBLEM
            │        └─ Inner div (relative overflow-hidden rounded-lg shadow-sm) [line 116]
            │           └─ Scaled content (transform: scale) [line 130]
            └─ Slider (conditional) [line 191]
               └─ screenshot-zoom-slider.tsx [line 26]
```

### Dimension Calculation Flow

```
1. screenshot-mode.ts:getCanvasDimensions()
   ├─ Code Snippet: 1280×720 (fixed)
   ├─ Locked Mode: ORIENTATION_DIMENSIONS (desktop: 1280×720, mobile: 720×1280)
   └─ Adaptive Mode: screenshotAsset.metadata dimensions

2. canvasAtom (hooks/atoms/derived.ts:27-32)
   └─ Derives dimensions from config, screenshotAsset, orientation

3. preview-viewport.tsx
   ├─ ResizeObserver tracks container size [lines 57-85]
   ├─ Calculates scale factor: min(scaleX, scaleY, 1) [lines 48-50]
   └─ Applies scale via inline styles [lines 117-123]

4. Canvas rendered with:
   width: surfaceWidth * scale
   height: surfaceHeight * scale
```

### Spacing Logic

**`playground-workspace.tsx:117`**
```tsx
<div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
```

- **`gap-6`**: 24px vertical spacing between canvas and slider
- **`pb-8`**: 32px bottom padding
- **`h-full`**: Takes full height of parent
- **`max-w-4xl`**: 896px max width constraint

**`preview-viewport.tsx:113`**
```tsx
<div className={cn("flex h-full w-full justify-center", className)}>
```

- **`h-full`**: ⚠️ **Takes full height of parent container** - This is the problem
- Canvas inside is scaled to fit, leaving extra vertical space
- Extra space pushes slider down

---

## Orientation Handling

### State Management
- **File:** `hooks/atoms.ts:87` - `orientationAtom` stores `"mobile"` or `"desktop"`
- **File:** `hooks/use-mobile-detection.ts:11` - Mobile breakpoint at `768px`

### Responsive Behavior

| Orientation | Canvas Dimensions | Layout | Slider Behavior |
|-------------|------------------|--------|-----------------|
| Desktop | 1280×720 (16:9) | Two-column (sidebar + content) | ⚠️ Pushed down by h-full |
| Mobile | 720×1280 (9:16) | Single column (stacked) | ✅ Fits correctly |

**Why mobile works:**
- `playground-page.tsx:114`: Mobile uses `flex-col` (vertical stacking)
- `playground-page.tsx:138`: Sidebar hidden on mobile (`hidden sm:flex`)
- Portrait aspect ratio (9:16) better utilizes vertical space
- Fewer horizontal constraints allow better vertical distribution

**Why desktop fails:**
- Landscape aspect ratio (16:9) creates more horizontal space
- `h-full` on `preview-viewport.tsx:113` expands to fill parent
- Canvas scales down but container maintains full height
- Extra vertical space appears between canvas and slider

---

## Code Examples

### Problem Area: preview-viewport.tsx

```tsx
// Line 113: Outer container with h-full (TOO MUCH HEIGHT)
<div className={cn("flex h-full w-full justify-center", className)}>
  {/* Line 116: Inner canvas with dynamic dimensions */}
  <div
    ref={combinedRef}
    className="relative overflow-hidden rounded-lg shadow-sm"
    style={{
      width: hasMeasured ? surfaceWidth * scale : undefined,
      height: hasMeasured ? surfaceHeight * scale : undefined, // ← Actual height is smaller than h-full parent
      aspectRatio: `${surfaceWidth} / ${surfaceHeight}`,
      maxWidth: "100%",
      maxHeight: "100%",
    }}
  >
    {/* Line 125-133: Content scaled via transform */}
    <div
      style={{
        width: surfaceWidth,
        height: surfaceHeight,
        transform: `scale(${scale})`, // ← Content is scaled down
      }}
    >
      {children}
    </div>
  </div>
</div>
```

### Parent Container: playground-workspace.tsx

```tsx
// Line 117: Parent with gap-6 spacing
<div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
  {/* Orientation toggle controls */}

  {/* Line 171: Canvas container with flex-1 (GROWS TO FILL SPACE) */}
  <div className="relative flex min-h-0 flex-1 w-full justify-center">
    <PreviewViewport> {/* This has h-full inside */}
      {/* Canvas content */}
    </PreviewViewport>
  </div>

  {/* Line 191: Slider pushed down by gap-6 + extra h-full space */}
  {!useFluidLayout && (
    <ScreenshotZoomSlider value={screenshotZoom} onChange={setScreenshotZoom} />
  )}
</div>
```

---

## Root Cause Analysis

### The h-full Chain

1. **`playground-workspace.tsx:117`** - Parent has `h-full` (takes full viewport height)
2. **`playground-workspace.tsx:171`** - Canvas container has `flex-1` (grows to fill available space)
3. **`preview-viewport.tsx:113`** - Canvas wrapper has `h-full` (takes full height from parent)
4. **`preview-viewport.tsx:116`** - Actual canvas has `height: surfaceHeight * scale` (smaller than parent)

**Result:** The canvas wrapper (`h-full`) expands to fill all available vertical space from `flex-1`, but the actual canvas inside is much smaller (scaled down). This creates a large gap between the canvas and slider.

### Why Mobile Works

On mobile orientation (720×1280):
- Portrait aspect ratio uses vertical space efficiently
- `flex-col` layout in `playground-page.tsx` reduces vertical stretching
- Sidebar hidden, more space for content area
- Canvas naturally fills more of the `h-full` container

On desktop orientation (1280×720):
- Landscape aspect ratio leaves excess vertical space
- Canvas is wider but shorter (16:9)
- `h-full` container stretches vertically but canvas doesn't fill it
- Gap appears between canvas bottom and slider

---

## Potential Solutions

### Option 1: Remove h-full from preview-viewport.tsx (Recommended)

**File:** `components/preview-viewport.tsx:113`

**Change:**
```tsx
// Before
<div className={cn("flex h-full w-full justify-center", className)}>

// After
<div className={cn("flex w-full justify-center", className)}>
```

**Rationale:**
- Container will shrink-wrap the canvas instead of expanding to fill parent
- Removes extra vertical space
- Canvas dimensions already controlled by inline styles
- Simplest fix with least side effects

**Risks:**
- May affect other layouts that depend on `h-full` behavior
- Need to test code snippet layout (`fluidLayout` mode)

---

### Option 2: Change flex-1 to flex-none in playground-workspace.tsx

**File:** `components/playground-workspace.tsx:171`

**Change:**
```tsx
// Before
<div className="relative flex min-h-0 flex-1 w-full justify-center">

// After
<div className="relative flex min-h-0 w-full justify-center">
```

**Rationale:**
- Prevents canvas container from growing to fill all available space
- Stops `h-full` in child from expanding unnecessarily
- Maintains existing canvas sizing logic

**Risks:**
- May cause canvas to be too small on large screens
- Could break vertical centering expectations
- Affects parent-level layout flow

---

### Option 3: Use items-center on parent container (Alignment Fix)

**File:** `components/playground-workspace.tsx:117`

**Change:**
```tsx
// Before
<div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">

// After
<div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
```

**Rationale:**
- Centers canvas and slider horizontally
- Doesn't fix vertical spacing but improves alignment
- Minimal risk of breaking existing layout

**Risks:**
- Doesn't solve the core `h-full` issue
- Only cosmetic improvement

---

### Option 4: Replace h-full with min-h-0 + fit-content

**File:** `components/preview-viewport.tsx:113`

**Change:**
```tsx
// Before
<div className={cn("flex h-full w-full justify-center", className)}>

// After
<div className={cn("flex min-h-0 w-full justify-center", className)}>
```

**Rationale:**
- `min-h-0` prevents container from expanding beyond content
- Allows canvas to dictate container height
- More explicit about height behavior

**Risks:**
- Need to verify ResizeObserver still works correctly
- May affect initial render measurements

---

### Option 5: Add max-h constraint based on canvas dimensions

**File:** `components/preview-viewport.tsx:113`

**Change:**
```tsx
<div
  className={cn("flex w-full justify-center", className)}
  style={{ maxHeight: hasMeasured ? `${surfaceHeight * scale}px` : undefined }}
>
```

**Rationale:**
- Explicitly limits container height to canvas height
- Prevents extra vertical space
- Preserves ResizeObserver functionality

**Risks:**
- Adds complexity with inline styles
- Requires tracking scale state in outer div

---

## Recommended Implementation Plan

### Phase 1: Verify Root Cause
1. Inspect `preview-viewport.tsx:113` in browser DevTools
2. Check computed height of container vs actual canvas height
3. Confirm whitespace is caused by `h-full` + `flex-1` interaction

### Phase 2: Implement Fix (Option 1)
1. Remove `h-full` from `preview-viewport.tsx:113`
2. Test desktop orientation (1280×720)
3. Test mobile orientation (720×1280)
4. Test code snippet layout (fluidLayout mode)
5. Verify slider positioning

### Phase 3: Fallback (If Option 1 Breaks Layouts)
1. Implement Option 4 (`min-h-0` instead of `h-full`)
2. Or implement Option 2 (remove `flex-1` from parent)

### Phase 4: Regression Testing
1. Test all layout types (screenshot, code snippet)
2. Test both orientations (mobile, desktop)
3. Test responsive breakpoints (768px, 640px)
4. Test zoom slider functionality
5. Test ResizeObserver behavior on window resize

---

## Related Issues & Patterns

### Previous Fix Attempts
The user mentioned "you've had problems fixing that previously", suggesting:
- Multiple attempts to fix layout spacing
- Likely tried adjusting `gap-6` or padding values
- May have modified slider positioning directly
- Root cause (`h-full`) was not addressed

### CSS Flexbox Patterns in Codebase
- Heavy use of `flex h-full` for full-height containers
- `flex-1` for growing items to fill space
- `min-h-0` for preventing flex overflow issues
- `gap-*` for consistent spacing (24px = gap-6)

### Orientation-Dependent Styling
- Layout switches between `flex-row` and `flex-col` at mobile breakpoint
- Sidebar hidden on mobile (`hidden sm:flex`)
- Canvas dimensions swap between 16:9 and 9:16
- No orientation-specific height constraints (opportunity for improvement)

---

## Testing Checklist

After implementing fix:

- [ ] Desktop orientation: Slider directly below canvas (no whitespace)
- [ ] Mobile orientation: Slider still positioned correctly
- [ ] Code snippet layout: Canvas sizing unaffected
- [ ] Screenshot layout: Canvas scaling works correctly
- [ ] Window resize: ResizeObserver updates scale properly
- [ ] Zoom slider: Changes canvas scale without layout shift
- [ ] Orientation toggle: Switching doesn't break layout
- [ ] Responsive breakpoints: Layout adapts at 768px, 640px
- [ ] Sidebar: Doesn't interfere with canvas/slider spacing
- [ ] Gap spacing: 24px between canvas and slider maintained
- [ ] Vertical centering: Canvas still centered when small

---

## Next Steps

1. **Review this research with team** to confirm understanding
2. **Choose fix strategy** (recommend Option 1: remove h-full)
3. **Implement fix** in `preview-viewport.tsx:113`
4. **Run tests** via `pnpm typecheck` and `pnpm test`
5. **Manual QA** across orientations and layouts
6. **Track analytics** to monitor canvas/slider interactions after fix
7. **Consider adding unit tests** for layout constraints

---

## Files to Monitor

If the fix causes issues, check these files:
- `components/preview-viewport.tsx` (canvas rendering)
- `components/playground-workspace.tsx` (parent layout)
- `components/layouts/CodeSnippet.tsx` (code snippet mode)
- `domain/layout/screenshot-mode.ts` (dimension calculations)
- `hooks/atoms/derived.ts` (canvas state)
