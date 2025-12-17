# Implementation Plan: Fix Canvas-Slider Spacing Bug

## Overview

This plan addresses the excessive whitespace between the canvas and slider component on desktop orientation. The root cause is the `h-full` class on the canvas wrapper (`preview-viewport.tsx:113`) which expands to fill all available vertical space from the parent's `flex-1`, while the actual canvas inside is much smaller (scaled down). This creates a large gap that pushes the slider far below the canvas.

**Problem**: Desktop orientation (1280×720, 16:9 landscape) leaves excess vertical space that the `h-full` container fills, while mobile orientation (720×1280, 9:16 portrait) works correctly because the canvas naturally uses more vertical space.

## Implementation Approach

We'll use a **progressive fix-and-verify strategy** with automatic rollback capability:

1. **Phase 1**: Implement the primary fix (remove `h-full`) and verify it works
2. **Phase 2**: If Phase 1 causes issues, implement fallback (use `min-h-0`)
3. **Phase 3**: If Phase 2 still has issues, implement alternative (adjust parent container)
4. **Phase 4**: Comprehensive regression testing across all layouts
5. **Phase 5**: Documentation updates

**Why this approach?**
- The research identified `h-full` on `preview-viewport.tsx:113` as the root cause
- Removing it allows the container to shrink-wrap the canvas instead of expanding
- Canvas dimensions are already controlled by inline styles (`width: surfaceWidth * scale`, `height: surfaceHeight * scale`)
- This is the simplest fix with minimal side effects
- We have fallback options if this breaks other layouts

---

## Phase 1: Primary Fix - Remove h-full

### Changes Required

#### 1. Preview Viewport Component
**File**: `components/preview-viewport.tsx`
**Line**: 113

**Change**: Remove `h-full` from the outer container className

```tsx
// Before (line 113)
<div
  ref={containerRef}
  className={cn("flex h-full w-full justify-center", className)}
>

// After
<div
  ref={containerRef}
  className={cn("flex w-full justify-center", className)}
>
```

**Rationale**:
- The container currently takes full height of parent due to `h-full`
- Parent has `flex-1` (`playground-workspace.tsx:171`) which makes it grow to fill space
- Result: Container expands vertically but canvas inside doesn't fill it
- By removing `h-full`, container will shrink-wrap the canvas
- Canvas dimensions are already controlled by inline styles at lines 118-119

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm build`
- [ ] Types check: `pnpm typecheck`
- [ ] Tests pass (if any): `pnpm test`

#### Manual Verification
- [ ] **Desktop orientation (16:9)**: Slider appears directly below canvas with only 24px gap (gap-6)
- [ ] **Mobile orientation (9:16)**: Slider still positioned correctly (regression check)
- [ ] **Code snippet layout**: Canvas sizing unaffected (fluidLayout mode check)
- [ ] **Screenshot layout**: Canvas scaling works correctly with zoom slider
- [ ] **Window resize**: ResizeObserver updates scale without layout issues
- [ ] **No extra whitespace**: Between canvas bottom edge and slider top edge (beyond gap-6)

#### Visual Inspection Checklist
1. Open playground in desktop orientation
2. Measure distance between canvas and slider (should be ~24px)
3. Toggle to mobile orientation (should still work)
4. Switch to code snippet layout (should not break)
5. Resize browser window (canvas should scale, slider should stay close)
6. Use zoom slider (should not cause layout shift)

---

## Phase 2: Fallback Fix - Use min-h-0 (If Phase 1 Breaks Layouts)

**Trigger**: Only implement if Phase 1 causes issues like:
- Canvas becomes too small on large screens
- ResizeObserver stops working correctly
- Vertical centering breaks
- Code snippet layout breaks

### Changes Required

#### 1. Preview Viewport Component (Alternative)
**File**: `components/preview-viewport.tsx`
**Line**: 113

**Change**: Replace `h-full` with `min-h-0`

```tsx
// Rollback Phase 1 change first
// Before
<div
  ref={containerRef}
  className={cn("flex w-full justify-center", className)}
>

// After
<div
  ref={containerRef}
  className={cn("flex min-h-0 w-full justify-center", className)}
>
```

**Rationale**:
- `min-h-0` prevents container from expanding beyond content
- Allows canvas to dictate container height
- More explicit about height behavior than removing class entirely
- Commonly used in flex layouts to prevent overflow issues

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Same checks as Phase 1
- [ ] ResizeObserver still calculates scale correctly
- [ ] Canvas doesn't overflow or get cut off
- [ ] Initial render measurements still work

---

## Phase 3: Alternative Fix - Adjust Parent Container (If Phase 2 Fails)

**Trigger**: Only implement if Phase 2 still has issues

### Changes Required

#### 1. Playground Workspace Component
**File**: `components/playground-workspace.tsx`
**Line**: 171

**Change**: Remove `flex-1` from canvas container

```tsx
// Before (line 171)
<div className="relative flex min-h-0 flex-1 w-full justify-center">
  <PreviewViewport>
    {/* Canvas content */}
  </PreviewViewport>
</div>

// After
<div className="relative flex min-h-0 w-full justify-center">
  <PreviewViewport>
    {/* Canvas content */}
  </PreviewViewport>
</div>
```

**Rationale**:
- Prevents canvas container from growing to fill all available space
- Stops `h-full` in PreviewViewport from expanding unnecessarily
- Revert changes to `preview-viewport.tsx` (restore `h-full`)

#### 2. Revert Preview Viewport
**File**: `components/preview-viewport.tsx`
**Line**: 113

**Change**: Restore original `h-full` className

```tsx
// Restore original
<div
  ref={containerRef}
  className={cn("flex h-full w-full justify-center", className)}
>
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Canvas not too small on large screens
- [ ] Slider positioned correctly on both orientations
- [ ] Layout flow not broken
- [ ] Vertical centering still works

---

## Phase 4: Comprehensive Regression Testing

### Test Matrix

| Test Case | Desktop (16:9) | Mobile (9:16) | Expected Result |
|-----------|----------------|---------------|-----------------|
| Screenshot layout | ✓ | ✓ | Slider directly below canvas (gap-6) |
| Code snippet layout | ✓ | ✓ | Canvas sizing unaffected |
| Zoom slider interaction | ✓ | ✓ | No layout shift when zooming |
| Window resize | ✓ | ✓ | Canvas scales, slider stays close |
| Orientation toggle | ✓ | ✓ | Switching works smoothly |
| Sidebar visibility | ✓ (visible) | ✓ (hidden) | No spacing interference |
| Responsive breakpoints | 768px | 640px | Layout adapts correctly |

### Manual Testing Steps

#### 1. Desktop Orientation Tests
```bash
# 1. Start dev server
pnpm dev

# 2. Open http://localhost:3000 in browser
# 3. Open DevTools (F12)
# 4. Set viewport to 1440x900 (desktop size)
```

**Check**:
- [ ] Canvas displays at correct aspect ratio (16:9)
- [ ] Slider appears directly below canvas
- [ ] Gap between canvas and slider is ~24px (gap-6)
- [ ] No extra whitespace pushing slider down
- [ ] Sidebar visible on left (w-80, 320px)

#### 2. Mobile Orientation Tests
**Check**:
- [ ] Switch orientation toggle to mobile (9:16)
- [ ] Canvas switches to portrait (720×1280)
- [ ] Slider still positioned correctly
- [ ] Layout doesn't break

**Browser resize**:
- [ ] Resize browser to 768px width (mobile breakpoint)
- [ ] Sidebar should hide
- [ ] Canvas should remain properly spaced from slider

#### 3. Code Snippet Layout Tests
**Check**:
- [ ] Switch layout to Code Snippet
- [ ] Canvas uses fluid layout mode (content-based sizing)
- [ ] No zoom slider shown (conditional: `!useFluidLayout`)
- [ ] Canvas sizing unaffected by h-full removal

#### 4. Zoom Slider Tests
**Check**:
- [ ] Switch back to screenshot layout
- [ ] Zoom slider appears
- [ ] Adjust zoom from 0.5 to 1.5
- [ ] Canvas scales but position relative to slider doesn't shift
- [ ] No layout jump or whitespace changes

#### 5. Window Resize Tests
**Check**:
- [ ] Resize browser window from 1920px to 1024px width
- [ ] Canvas scales down proportionally
- [ ] Slider maintains gap-6 distance
- [ ] ResizeObserver updates scale correctly
- [ ] No layout flickering or jumping

#### 6. Responsive Breakpoint Tests
**Check**:
- [ ] Test at 768px width (mobile detection breakpoint)
- [ ] Test at 640px width (sm: Tailwind breakpoint)
- [ ] Sidebar hides/shows correctly
- [ ] Padding adjusts (`px-2 sm:px-4`, `pt-4 sm:pt-6`)
- [ ] Layout remains functional

### Success Criteria

#### All Tests Must Pass
- [ ] No visual regressions in any layout
- [ ] Canvas-slider spacing correct on desktop
- [ ] Mobile orientation still works
- [ ] Code snippet layout unaffected
- [ ] Zoom slider functions without layout shift
- [ ] Window resize doesn't break layout
- [ ] ResizeObserver calculates scale correctly
- [ ] No console errors or warnings

#### Performance Checks
- [ ] No excessive re-renders (check React DevTools)
- [ ] ResizeObserver throttling still works (rafRef at line 41)
- [ ] Initial render measurements complete (<150ms)

---

## Phase 5: Documentation

### Changes Required

#### 1. Add Inline Code Comments
**File**: `components/preview-viewport.tsx`
**Line**: 111-114

**Change**: Add comment explaining why we removed `h-full`

```tsx
// Fixed canvas: scale to fit container
return (
  <div
    ref={containerRef}
    // Note: No h-full class - we let the canvas dictate container height
    // to prevent excess vertical space between canvas and slider.
    // Canvas dimensions are controlled by inline styles below (surfaceWidth * scale).
    className={cn("flex w-full justify-center", className)}
  >
```

#### 2. Update Research Document
**File**: `thoughts/research/008-canvas-slider-spacing-bug.md`

**Change**: Add resolution section at end

```markdown
## Resolution

**Date**: [Current Date]
**Status**: ✅ Fixed

### Implementation
- **Fix Applied**: Option 1 (Remove h-full from preview-viewport.tsx:113)
- **Phases Completed**: 1, 4, 5
- **Fallbacks Used**: None (primary fix worked)

### Results
- Desktop orientation: Slider positioned directly below canvas ✓
- Mobile orientation: No regression ✓
- Code snippet layout: Unaffected ✓
- Screenshot layout: Zoom slider works correctly ✓
- Window resize: ResizeObserver still functional ✓

### Files Modified
- `components/preview-viewport.tsx` (line 113: removed h-full)
```

### Success Criteria

#### Automated Verification
- [ ] Markdown renders correctly in preview

#### Manual Verification
- [ ] Code comments explain the fix clearly
- [ ] Research document updated with resolution
- [ ] Future developers can understand why h-full was removed

---

## Rollback Plan

If the fix causes critical issues:

### Quick Rollback (Revert Phase 1)

```bash
# Option A: Git revert
git revert HEAD

# Option B: Manual revert
# Edit components/preview-viewport.tsx line 113
# Change:
className={cn("flex w-full justify-center", className)}
# Back to:
className={cn("flex h-full w-full justify-center", className)}
```

### When to Rollback
- [ ] Canvas becomes unusably small on desktop
- [ ] Code snippet layout breaks completely
- [ ] ResizeObserver stops working
- [ ] Critical visual regressions in production

### After Rollback
1. Move to Phase 2 (min-h-0 approach)
2. If Phase 2 fails, move to Phase 3 (adjust parent)
3. If all phases fail, investigate deeper issues (may need refactor)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Canvas too small on desktop | Low | Medium | Phase 2 fallback (min-h-0) |
| Code snippet layout breaks | Low | High | Test fluidLayout mode thoroughly |
| ResizeObserver stops working | Very Low | High | Inline styles still control dimensions |
| Mobile regression | Very Low | Medium | Mobile already works, minimal change |
| Vertical centering breaks | Low | Low | `justify-center` still present |

---

## Timeline (Estimated Phases)

This is an implementation sequence, not a timeline. Focus on completing each phase before moving to the next:

1. **Phase 1**: Primary fix implementation
2. **Phase 2** (conditional): Fallback if needed
3. **Phase 3** (conditional): Alternative if Phase 2 fails
4. **Phase 4**: Regression testing (all scenarios)
5. **Phase 5**: Documentation updates

Each phase should be completed and verified before proceeding to the next. If Phase 1 succeeds, skip Phases 2-3.

---

## Related Files Reference

Quick reference for debugging:

| File | Purpose | Critical Lines |
|------|---------|----------------|
| `components/preview-viewport.tsx` | Canvas rendering & scaling | 113 (fix target), 37-85 (ResizeObserver) |
| `components/playground-workspace.tsx` | Parent layout | 117 (spacing), 171 (flex-1 container) |
| `components/screenshot-zoom-slider.tsx` | Slider component | 26 (container), 37 (width) |
| `domain/layout/screenshot-mode.ts` | Dimension calculations | 10-13 (ORIENTATION_DIMENSIONS) |
| `hooks/atoms/derived.ts` | Canvas state | 27-32 (canvasAtom) |

---

## Post-Implementation Monitoring

After deploying the fix:

### Analytics Tracking
- [ ] Monitor canvas/slider interactions (already tracked via `track()`)
- [ ] Check for error spikes in Sentry (canvas rendering errors)
- [ ] Track orientation toggle usage (desktop vs mobile)

### User Feedback
- [ ] Watch for reports of layout issues
- [ ] Monitor support channels for spacing complaints
- [ ] Check if users notice the improvement

### Performance Metrics
- [ ] Measure initial render time (should be <150ms)
- [ ] Check ResizeObserver throttling (no excessive calls)
- [ ] Monitor layout shift metrics (CLS)

---

## Success Metrics

**This fix is successful when:**

1. ✅ Desktop orientation: Slider appears 24px (gap-6) below canvas, no extra whitespace
2. ✅ Mobile orientation: No regression, slider still positioned correctly
3. ✅ Code snippet layout: Unaffected by h-full removal
4. ✅ Screenshot layout: Zoom slider works without layout shift
5. ✅ Window resize: Canvas scales, slider stays close
6. ✅ All automated checks pass (build, typecheck, tests)
7. ✅ No console errors or warnings
8. ✅ No user complaints about layout issues

**The bug is fixed when**: On desktop orientation (1280×720), the slider component appears directly below the canvas with only the intended 24px gap (gap-6), with no excessive whitespace between them.
