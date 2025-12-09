# Screenshot Zoom Slider Feature - Implementation Notes

## Goal
Add a beautiful, minimal screenshot zoom slider control that allows users to adjust the size of screenshots within design looks. The slider should be placed beneath the canvas preview and provide real-time visual feedback.

### Requirements
- Slider positioned beneath the canvas in PlaygroundWorkspace
- Universal zoom setting (applies to all looks)
- Range: 0.5 to 1.5 with default at 1.0 (center position)
- Zero text labels - pure visual interaction
- Self-explanatory through interaction alone
- Should work consistently across all three looks

## Architecture Overview

### State Management
- **File:** `domain/layout/types.ts`
  - Added `screenshotZoom?: number` property to `LayoutConfig` type
  - Optional field with default value of 1.0 when not set

### Slider Component
- **File:** `components/screenshot-zoom-slider.tsx` (NEW)
  - Native HTML range input with Tailwind styling
  - Props: `value: number`, `onChange: (value: number) => void`
  - Range: 0.5 to 1.5 (1.0 is center/no zoom)
  - Step: 0.05
  - No text labels, minimal design with hover effects

### State Management & Hooks
- **File:** `hooks/use-playground-controller.ts`
  - Added `screenshotZoom` to return value (defaults to 1.0)
  - Added `handleScreenshotZoomChange` callback handler
  - Uses `useScreenshotZoomHandler` to update config atom

### UI Integration
- **File:** `components/playground-workspace.tsx`
  - Added props: `screenshotZoom: number`, `onScreenshotZoomChange: (zoom: number) => void`
  - Renders `<ScreenshotZoomSlider />` beneath the canvas preview
  - Centered in a flex container

- **File:** `app/page.tsx`
  - Passes `screenshotZoom` and `handleScreenshotZoomChange` to PlaygroundWorkspace
  - Extracted from usePlaygroundController hook

## Look Implementations

### 1. PopupGradient (Peak Look)
**File:** `components/looks/PopupGradient.tsx`

**Constants:**
```typescript
SIDE_SCREENSHOT_ZOOM = 1.35        // Base zoom for side variants
SIDE_CONTENT_TOP = "30%"           // Text area positioning
CENTER_SCREENSHOT_TOP = "40%"      // Center screenshot positioning
CENTER_SCREENSHOT_GUTTER = 0.07    // Inset from sides
```

**Implementation Details:**
- Three variants: left, right, center
- Side variants: Screenshot positioned at 30% from top, fills 62% width, zoomed 1.35x
- Center variant: Text above screenshot, screenshot from 40% to bottom

**Current Approach:**
- Multiplies base zoom by `config.screenshotZoom`
- For side: `calculatedSideZoom = SIDE_SCREENSHOT_ZOOM * zoomMultiplier`
- Uses `transform: scale()` on images
- Outer container: `overflow: visible` to allow content to flow
- Inner wrapper (for rounded corners): `overflow: hidden` with `border-radius` applied

**Structure (center variant):**
```
<div overflow:visible borderRadius shadow>
  <div overflow:hidden borderRadius transform:scale>
    <img />
  </div>
</div>
```

**Issues Encountered:**
1. ✅ Initially had `overflow: hidden` on outer container - clipped zoomed-out content
2. ✅ Border-radius didn't apply when using `overflow: visible` - fixed with inner wrapper
3. ❌ **CURRENT ISSUE:** Screenshot is still cut at bottom edge even with overflow visible
   - When zooming out, users expect to see the full/more of the screenshot
   - Instead, the visible area is fixed and zooming just scales content within that area
   - The frame bottom boundary is hard-set and content is clipped there visually

### 2. HeroCenter (Spotlight Look)
**File:** `components/looks/HeroCenter.tsx`

**Implementation:**
- Two variants: left, right
- Portrait mode: 480px max-width, centers vertically
- Landscape locked: 640px max-width
- Landscape adaptive: 70% max-width

**Current Approach (CHANGED FROM SCALING):**
- Changed from `transform: scale()` to resizing container dimensions
- Container max-width multiplied by zoom: `${640 * zoomMultiplier}px`
- This makes container grow/shrink with zoom instead of scaling image within fixed container

**Issues:**
- Works correctly now (container resizes)
- Responsive constraints with `min()` ensure viewport limits are respected

### 3. AdaptiveScreenshot (Backdrop Look)
**File:** `components/looks/AdaptiveScreenshot.tsx`

**Implementation:**
- Full-width screenshot with 48px padding
- Base max-width: 1100px
- Padding is fixed (not multiplied by zoom)

**Current Approach:**
- Container max-width multiplied by zoom: `${1100 * zoomMultiplier}px`
- Similar to HeroCenter - container resizes instead of scaling

## What We Tried

### Approach 1: Transform Scale (INITIAL)
- Applied `transform: scale()` to images within fixed containers
- **Problem:** Zooming in scaled image within fixed space (counterintuitive)
- **Problem:** Zooming out showed less content, not more
- **Result:** Discarded for most looks (except Peak view base zoom)

### Approach 2: Container Resizing (CURRENT for Spotlight & Backdrop)
- Multiply container max-width/max-height by zoom multiplier
- Images fill container at normal size, no transform scaling
- **Benefit:** Intuitive - zoom in = larger container, zoom out = smaller container
- **Status:** Works well for HeroCenter and AdaptiveScreenshot

### Approach 3: Dynamic Overflow Handling (TRIED IN PEAK)
- Conditionally set `overflow: hidden` when zoomed out, `visible` when zoomed in
- **Problem:** Border-radius doesn't clip overflowing content with visible overflow
- **Result:** Fixed with inner wrapper approach

### Approach 4: Inner Wrapper for Clipping (CURRENT FOR PEAK)
- Outer container: `overflow: visible` (allows content to flow)
- Inner wrapper: `overflow: hidden` + `border-radius` (clips and rounds)
- **Status:** Corners now properly rounded
- **Problem:** Still doesn't solve the main clipping issue at bottom edge

## Current Problem: Peak View Screenshot Clipping

### The Issue
In PopupGradient (Peak) view:
- When user zooms out, they expect to see MORE of the screenshot
- Instead, the visible height is limited by the frame's bottom boundary
- The screenshot content extends beyond the bottom of the frame but is not visible
- It appears "cut" at the frame edge

### Why It Happens
The frame container has:
```typescript
top: CENTER_SCREENSHOT_TOP  // "40%" from top
bottom: 0                   // Fixed to bottom of viewport/container
```

When the screenshot is scaled down (zoomed out), it occupies less space, but the available space is still limited by the frame height. The overflow is technically visible, but the container itself doesn't grow tall enough or the viewport constraint prevents seeing the extended content.

### What Needs to Happen
When zooming out in Peak view:
- The viewport area showing the screenshot should shrink (showing less height)
- This would reveal more of the screenshot vertically
- The frame should potentially become smaller or allow scrolling

**OR**

- The screenshot should be positioned to show the full height even when scaled down
- Might need to adjust `top: 40%` positioning when zoomed out
- Could use `height` constraints instead of `bottom: 0`

## Files Structure Summary

```
dopeshot/
├── domain/
│   └── layout/
│       └── types.ts                    (LayoutConfig type)
├── components/
│   ├── screenshot-zoom-slider.tsx      (NEW - slider component)
│   ├── playground-workspace.tsx        (UI integration)
│   ├── looks/
│   │   ├── PopupGradient.tsx          (Peak look - PROBLEMATIC)
│   │   ├── HeroCenter.tsx             (Spotlight look - WORKING)
│   │   └── AdaptiveScreenshot.tsx     (Backdrop look - WORKING)
│   └── (other look files)
├── hooks/
│   └── use-playground-controller.ts   (State management)
└── app/
    └── page.tsx                        (Page integration)
```

## Git Commits Made
```
8a787da - Add screenshot zoom slider control beneath canvas
116a9a7 - Fix screenshot overflow and container scaling in PopupGradient
bb6a793 - Fix zoom slider centering and behavior
c7b3ef0 - Allow screenshot overflow in Peak view for full content visibility
1bd84e0 - Keep rounded corners clipped in Peak view during zoom
```

## Recommendations for Next Steps

1. **Investigate Peak View Layout Logic**
   - The fixed `bottom: 0` positioning may be the root cause
   - Consider using `height` or `maxHeight` instead
   - May need to dynamically adjust frame height based on zoom

2. **Consider Responsive Zoom Behavior**
   - Different looks might need different zoom strategies
   - Peak view might need special handling for scrolling/overflow
   - Spotlight and Backdrop work well with container resizing

3. **Test Edge Cases**
   - Very tall screenshots at 0.5 zoom
   - Very wide screenshots at 1.5 zoom
   - Different viewport sizes

4. **Possible Solutions for Peak View**
   - Use CSS `max-height` with responsive constraints instead of `bottom: 0`
   - Implement vertical scrolling within the frame when zoomed out
   - Adjust the frame positioning/sizing dynamically based on zoom
   - Use absolute/relative positioning hierarchy differently

## Notes
- The slider range (0.5-1.5) is now correctly centered at 1.0
- All looks receive the zoom value via config
- The zoom multiplier approach works well for Spotlight and Backdrop
- Peak view needs special handling due to its complex layout constraints
