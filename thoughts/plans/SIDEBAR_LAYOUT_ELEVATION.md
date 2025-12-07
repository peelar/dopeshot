# Implementation Plan: Elevate Sidebar to Looks Rail Level

## Overview

Move the sidebar from being nested inside `PlaygroundWorkspace` to the page-level layout, positioning it to start at the same vertical height as the looks rail. This creates a cleaner visual hierarchy and better utilizes vertical space.

## Implementation Approach

Following **Approach A** from research: Keep looks rail spanning full width, then create a two-column layout below it containing the preview column and sidebar. This approach:
- Minimizes disruption to existing looks rail behavior
- Maintains clear separation of concerns
- Preserves responsive behavior more easily
- Reduces the scope of changes

## Phase 1: Extract Sidebar to Standalone Component

### Changes Required

#### 1. Update PlaygroundWorkspace Component

**File**: `components/playground-workspace.tsx`
**Changes**: Remove sidebar rendering from workspace, simplify to only handle preview column

Remove lines 272-274 (the sidebar div and LayoutConfigPanel):
```typescript
// DELETE THIS:
<div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
  <LayoutConfigPanel onUploadAsset={onUploadAsset} />
</div>
```

Update the component interface to remove `onUploadAsset` prop:
```typescript
interface PlaygroundWorkspaceProps {
  isMobile: boolean;
  onVariantChange: () => void;
  shouldShowAspectLock: boolean;
  isAspectLocked: boolean;
  onToggleAspect: () => void;
  canvasHeight: number;
  canvasWidth: number;
  isAnalyzingColors: boolean;
  showFocusHint: boolean;
  // REMOVE: onUploadAsset: (file: File) => Promise<void>;
}
```

Update the main container to remove horizontal flex behavior (no longer two-column):
```typescript
// Change from:
<div className={cn("flex flex-1 min-h-0", isMobile ? "flex-col gap-4" : "overflow-hidden")}>

// To:
<div className="flex flex-1 flex-col overflow-hidden bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
```

The entire workspace now becomes just the preview column content (lines 36-269).

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`
- [ ] No linter errors: `pnpm lint`

#### Manual Verification
- [ ] Page still renders without sidebar
- [ ] Preview column takes full width
- [ ] No TypeScript errors in IDE

---

## Phase 2: Create Two-Column Layout at Page Level

### Changes Required

#### 1. Restructure Main Content Area in page.tsx

**File**: `app/page.tsx`
**Changes**: Transform single-column layout into three-part structure: looks rail above, two columns below

Replace the current main content div (lines 86-101) with:

```typescript
<div className="flex flex-1 min-h-0 flex-col gap-4 px-4 pb-12 pt-4 sm:px-8 sm:pb-10 overflow-hidden">
  <LookSelector />

  {/* Two-column layout: Preview Column | Sidebar */}
  <div className={cn("flex flex-1 min-h-0", isMobile ? "flex-col gap-4" : "overflow-hidden")}>
    {/* Left: Preview Column */}
    <PlaygroundWorkspace
      isMobile={isMobile}
      onVariantChange={handleVariantChange}
      shouldShowAspectLock={shouldShowAspectLock}
      isAspectLocked={isAspectLocked}
      onToggleAspect={toggleCanvasMode}
      canvasHeight={canvas.height}
      canvasWidth={canvas.width}
      isAnalyzingColors={isAnalyzingColors}
      showFocusHint={showFocusHint}
    />

    {/* Right: Sidebar */}
    <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
      <LayoutConfigPanel onUploadAsset={handleFileProcess} />
    </div>
  </div>
</div>
```

Add import for LayoutConfigPanel at the top of page.tsx:
```typescript
import { LayoutConfigPanel } from '@/components/layout-config';
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`
- [ ] No linter errors: `pnpm lint`

#### Manual Verification
- [ ] Sidebar appears at same height as looks rail
- [ ] Preview column and sidebar are side-by-side on desktop
- [ ] Both columns scroll independently
- [ ] Looks rail spans full width above both columns
- [ ] Mobile layout still uses drawer (MobileActions)

---

## Phase 3: Adjust Responsive Behavior

### Changes Required

#### 1. Verify Mobile Layout

**File**: `app/page.tsx`
**Changes**: None needed - mobile already uses `MobileActions` component

The conditional rendering of `MobileActions` (already in page.tsx around line 102-110) handles mobile sidebar display. The new sidebar div has `hidden sm:flex` which hides it on mobile.

#### 2. Test Edge Cases

**Manual testing required**:
- Tablet breakpoint (640px - sm breakpoint)
- Narrow desktop windows
- Sidebar content overflow scrolling
- Preview column scrolling behavior

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] E2E tests pass: `pnpm test:e2e`

#### Manual Verification
- [ ] Mobile (<640px): Sidebar hidden, MobileActions visible
- [ ] Desktop (≥640px): Sidebar visible, fixed 320px width
- [ ] Sidebar scrolls independently when content overflows
- [ ] Preview column maintains proper spacing and centering
- [ ] No horizontal scroll at any breakpoint
- [ ] Aspect lock button still works correctly

---

## Phase 4: Polish and Cleanup

### Changes Required

#### 1. Remove Unused Props from PlaygroundWorkspace

**File**: `components/playground-workspace.tsx`
**Changes**: Clean up any remaining references to removed props

Verify these are removed:
- `onUploadAsset` prop definition
- Any unused imports

#### 2. Update Component Documentation

**File**: `components/playground-workspace.tsx`
**Changes**: Update any JSDoc comments to reflect new single-column responsibility

Add comment at top of component:
```typescript
/**
 * PlaygroundWorkspace
 * 
 * Renders the main preview column containing:
 * - Variant toggle controls
 * - Aspect lock button (conditional)
 * - Preview viewport with cover
 * 
 * Note: This is now only the preview column. The sidebar
 * is rendered at the page level in app/page.tsx
 */
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] All tests pass: `pnpm test`
- [ ] Types check: `pnpm typecheck`
- [ ] No linter warnings: `pnpm lint`

#### Manual Verification
- [ ] All interactive features work (variant toggle, aspect lock, uploads)
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no janky scrolling)
- [ ] Visual design matches expectations
- [ ] Dark mode works correctly

---

## Rollback Plan

If issues arise:

1. **Immediate revert**: 
   ```bash
   git checkout components/playground-workspace.tsx app/page.tsx
   ```

2. **Partial rollback**: Keep Phase 1 changes (extracted sidebar component) but revert Phase 2 layout changes if the two-column approach has issues

3. **Alternative approach**: Switch to Approach B (looks rail in left column only) if full-width looks rail causes problems

## Risk Assessment

**Low Risk**:
- Changes are isolated to layout structure
- No state management changes
- No new dependencies
- Existing functionality preserved

**Potential Issues**:
- Height calculation edge cases with `min-h-0` and `flex-1`
- Scroll behavior differences across browsers
- Breakpoint transitions may need fine-tuning

## Testing Strategy

1. **Visual regression**: Compare before/after screenshots at multiple breakpoints
2. **Interactive testing**: Verify all controls work (variants, uploads, toggles)
3. **Browser testing**: Test in Chrome, Firefox, Safari
4. **Mobile testing**: Test on actual mobile devices or emulator

