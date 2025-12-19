# Implementation Plan: Per-Look Zoom Behaviors

## Goal

Implement different zoom behaviors per look:
- **Default (Spotlight, Backdrop)**: Current behavior - zoom scales the container
- **Peak**: Zoom controls how much of the screenshot is visible (container stays fixed, zooming out reveals more content)

---

## Current State Analysis

### How Zoom Works Now (All Looks)

```
Container (with transform: scale(screenshotZoom))
  └── Image (object-fit: cover, cropped)
```

- Zoom slider: 0.5 to 1.5, default 1.0
- All looks apply `transform: scale(screenshotZoom)` to the **container**
- Result: Container grows/shrinks, but the same crop of the image is shown

### Peak's Additional Internal Scale

Peak has `SIDE_SCREENSHOT_ZOOM = 1.35` for side variants, applied to the image:
```tsx
// Line 149 in PopupGradient.tsx
transform: `scale(${SIDE_SCREENSHOT_ZOOM})`
```

This means side screenshots are pre-zoomed in by 1.35x.

---

## Desired Behavior

### Default Looks (Spotlight, Backdrop)
Keep current behavior:
- Zoom slider scales the container
- Visual size changes, crop stays the same

### Peak Look (New Behavior)
- Container size stays **fixed**
- Zoom controls the **internal image scale**
- Zoom out (0.5) → smaller image scale → shows MORE of the screenshot
- Zoom in (1.5) → larger image scale → shows LESS of the screenshot (more crop)

---

## Implementation Steps

### Step 1: Add Zoom Behavior Type to Domain

**File:** `domain/look/definitions.ts`

Add a new capability type:

```typescript
export type LookZoomBehavior = "scale-container" | "scale-content";

export interface LookCapabilities {
  // ... existing fields
  zoomBehavior: LookZoomBehavior;
}
```

Update look definitions:
- Peak (`popup-gradient`): `zoomBehavior: "scale-content"`
- Spotlight (`hero-center`): `zoomBehavior: "scale-container"`
- Backdrop (`adaptive-stage`): `zoomBehavior: "scale-container"`

---

### Step 2: Export Zoom Behavior via `useLookPrimitives`

**File:** `components/looks/shared/look-primitives.tsx`

Add `zoomBehavior` to the hook's return value:

```typescript
const lookDefinition = getLookDefinition(config.lookId);
const zoomBehavior = lookDefinition?.capabilities.zoomBehavior ?? "scale-container";

return {
  // ... existing fields
  screenshotZoom,
  zoomBehavior,
};
```

---

### Step 3: Update Peak Look (PopupGradient)

**File:** `components/looks/PopupGradient.tsx`

#### For Center Variant (lines 91-116):

Current:
```tsx
<div style={{ transform: `scale(${screenshotZoom})` }}>
  <img className="object-cover" />
</div>
```

New:
```tsx
<div style={{ /* no container transform */ }}>
  <img
    className="object-cover"
    style={{ transform: `scale(${screenshotZoom})` }}
  />
</div>
```

#### For Side Variants (lines 127-155):

Current:
```tsx
<div style={{ transform: `scale(${screenshotZoom})` }}>
  <img style={{ transform: `scale(${SIDE_SCREENSHOT_ZOOM})` }} />
</div>
```

New:
```tsx
<div style={{ /* no container transform */ }}>
  <img style={{ transform: `scale(${SIDE_SCREENSHOT_ZOOM * screenshotZoom})` }} />
</div>
```

The formula `SIDE_SCREENSHOT_ZOOM * screenshotZoom`:
- At zoom 1.0: `1.35 * 1.0 = 1.35` (same as current)
- At zoom 0.5: `1.35 * 0.5 = 0.675` (shows more content)
- At zoom 1.5: `1.35 * 1.5 = 2.025` (shows less content, more crop)

---

### Step 4: Verify Other Looks Unchanged

**Files:**
- `components/looks/HeroCenter.tsx` - No changes needed (uses `scale-container`)
- `components/looks/AdaptiveScreenshot.tsx` - No changes needed (uses `scale-container`)

These looks already apply `transform: scale(screenshotZoom)` to the container, which is the desired default behavior.

---

### Step 5: Consider Edge Cases

#### Center Variant Base Scale
Center variant currently has no internal scale. We may need a base scale constant:

```typescript
const CENTER_SCREENSHOT_ZOOM = 1.0; // or adjust as needed
```

Then apply: `transform: scale(${CENTER_SCREENSHOT_ZOOM * screenshotZoom})`

#### Transform Origin
Ensure `transformOrigin` on the image matches the desired anchor point:
- Center: `center center` or `top center`
- Left side: `left top` (already set)
- Right side: `right top` (already set)

---

## Files to Modify

| File | Changes |
|------|---------|
| `domain/look/definitions.ts` | Add `LookZoomBehavior` type, add `zoomBehavior` to capabilities |
| `components/looks/shared/look-primitives.tsx` | Expose `zoomBehavior` from hook |
| `components/looks/PopupGradient.tsx` | Remove container scale, apply zoom to image scale |

---

## Testing Checklist

1. **Peak - Center variant:**
   - [ ] Zoom slider at 1.0 shows same crop as before
   - [ ] Zoom out (0.5) reveals more of the screenshot
   - [ ] Zoom in (1.5) shows more crop (less content)
   - [ ] Container size doesn't change during zoom

2. **Peak - Side variants (left/right):**
   - [ ] Same behavior as center
   - [ ] Transform origin anchors correctly (top-left, top-right)

3. **Spotlight & Backdrop:**
   - [ ] Zoom behavior unchanged (container scales)
   - [ ] No visual regression

4. **Export:**
   - [ ] Exported images reflect the zoom setting correctly
   - [ ] Resolution unchanged

---

## Alternative Approach Considered

Instead of modifying each look component, we could create a `ZoomableScreenshot` wrapper component that handles zoom behavior based on the look's capability. However, since Peak has unique layout requirements (the screenshot container positioning is integral to the look), modifying the component directly is cleaner.

---

## Summary

The key insight is that Peak's zoom should control the **image scale within a fixed container**, while other looks scale the **container itself**. This is achieved by:

1. Adding a `zoomBehavior` capability to distinguish looks
2. Moving the `scale()` transform from container to image in Peak
3. Combining zoom with existing internal scale constants
