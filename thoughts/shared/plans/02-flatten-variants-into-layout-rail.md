# Implementation Plan: Flatten Variants into Layout Rail

**Date:** 2025-12-16
**Research:** Based on `thoughts/shared/research/03-flatten-variants-into-layout-rail.md`

## Overview

Currently, users select layouts in two steps:
1. Pick a layout from the horizontal rail (4 thumbnails: Peak, Spotlight, Backdrop, Code)
2. Pick a variant from the toggle row below (Left/Center/Right)

This plan eliminates the Variants toggle row by making each layout+variant combination its own thumbnail in the rail. Users will pick both layout and variant in a single click.

**Result:** 7 thumbnails in the rail (Peak Left, Peak Right, Peak Center, Spotlight Left, Spotlight Right, Backdrop, Code) with the variant toggle row completely removed.

## Implementation Approach

We'll expand layout definitions to treat each variant as a separate layout entry. Since layout components already read `config.variant` and render accordingly, and the state management already stores both `layoutId` and `variant` in `configAtom`, most of the work is mechanical data transformation.

**Key Strategy:**
- Transform `LAYOUT_DEFINITIONS` array to flatten variants into individual entries
- Each flattened entry gets a composite ID (e.g., `popup-gradient-left`)
- Rail component automatically shows all entries as thumbnails
- Pattern controls (grain/glow/grid) move to sidebar for consistency
- No changes needed to layout components or state atoms

**Phases:**
1. Expand layout definitions to flatten variants
2. Simplify rail component (remove variant logic)
3. Remove variant toggle component entirely
4. Migrate pattern controls to sidebar
5. Verify and test

---

## Phase 1: Expand Layout Definitions

### Changes Required

#### 1. Add Helper Functions for Layout Expansion

**File**: `domain/layout-def/definitions.ts`
**Location**: Add before `LAYOUT_DEFINITIONS` array (around line 50)

```typescript
/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Expands a layout definition with multiple variants into separate layout entries.
 * Each variant becomes its own layout with a composite ID and updated name.
 *
 * Example:
 *   Input:  { id: "popup-gradient", name: "Peak", variants: ["left", "right", "center"] }
 *   Output: [
 *     { id: "popup-gradient-left", name: "Peak Left", variants: ["left"], ... },
 *     { id: "popup-gradient-right", name: "Peak Right", variants: ["right"], ... },
 *     { id: "popup-gradient-center", name: "Peak Center", variants: ["center"], ... }
 *   ]
 */
function expandLayoutVariants(layoutDef: LayoutDefinition): LayoutDefinition[] {
  // Layouts with 0 or 1 variant don't need expansion
  if (layoutDef.variants.length <= 1) {
    return [layoutDef];
  }

  // Create a separate layout entry for each variant
  return layoutDef.variants.map((variant) => {
    const baseConfig = layoutDef.createConfig();

    return {
      ...layoutDef,
      id: `${layoutDef.id}-${variant}`,
      name: `${layoutDef.name} ${capitalize(variant)}`,
      variants: [variant], // Single variant only
      createConfig: () => ({
        ...baseConfig,
        layoutId: `${layoutDef.id}-${variant}`, // Update layoutId to match new composite ID
        variant, // Bake in the variant
      }),
    };
  });
}
```

#### 2. Rename and Transform LAYOUT_DEFINITIONS

**File**: `domain/layout-def/definitions.ts`
**Location**: Line 51 (current `LAYOUT_DEFINITIONS` declaration)

**Before:**
```typescript
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    // ... rest of definition
  },
  // ... other layouts
];
```

**After:**
```typescript
/**
 * Raw layout definitions with variants array.
 * These will be expanded into individual layout+variant combinations.
 */
const RAW_LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    // ... rest of definition (unchanged)
  },
  // ... other layouts (unchanged)
];

/**
 * Exported layout definitions with variants flattened.
 * Each layout+variant combination is its own entry.
 *
 * Total: 7 layouts
 * - popup-gradient-left, popup-gradient-right, popup-gradient-center (Peak)
 * - hero-center-left, hero-center-right (Spotlight)
 * - adaptive-stage (Backdrop, no variants)
 * - code-snippet (Code, single variant)
 */
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = RAW_LAYOUT_DEFINITIONS.flatMap(expandLayoutVariants);
```

#### 3. Add Backward Compatibility Migration

**File**: `domain/layout-def/definitions.ts`
**Location**: Update `getLayoutDefinition()` function (currently at line 297)

**Before:**
```typescript
export function getLayoutDefinition(layoutId: string): LayoutDefinition | undefined {
  const byId = LAYOUT_DEFINITIONS.find((def) => def.id === layoutId);
  if (byId) {
    return byId;
  }

  // Legacy: "full-visual" was renamed to "adaptive-stage"
  if (layoutId === "full-visual") {
    return LAYOUT_DEFINITIONS.find((def) => def.id === "adaptive-stage");
  }

  return undefined;
}
```

**After:**
```typescript
export function getLayoutDefinition(layoutId: string): LayoutDefinition | undefined {
  const byId = LAYOUT_DEFINITIONS.find((def) => def.id === layoutId);
  if (byId) {
    return byId;
  }

  // Legacy: "full-visual" was renamed to "adaptive-stage"
  if (layoutId === "full-visual") {
    return LAYOUT_DEFINITIONS.find((def) => def.id === "adaptive-stage");
  }

  // Legacy: Handle old layout IDs without variant suffix
  // Map old base IDs to their default variant
  const legacyDefaults: Record<string, string> = {
    "popup-gradient": "popup-gradient-right", // Default was "right" in createConfig
    "hero-center": "hero-center-left",        // First variant was "left"
    "adaptive-stage": "adaptive-stage",       // No variants (unchanged)
    "code-snippet": "code-snippet",           // Single variant (unchanged)
  };

  const mappedId = legacyDefaults[layoutId];
  if (mappedId) {
    return LAYOUT_DEFINITIONS.find((def) => def.id === mappedId);
  }

  return undefined;
}
```

### Success Criteria

#### Automated Verification
```bash
# Type check passes
pnpm typecheck

# Build completes without errors
pnpm build
```

#### Manual Verification
- [ ] Open app in browser
- [ ] Check browser console for errors (should be none)
- [ ] Verify rail now shows 7 thumbnails instead of 4
- [ ] Verify thumbnail names include variant (e.g., "Peak Left", "Peak Right", "Peak Center")
- [ ] Click each thumbnail and verify it applies correct layout+variant
- [ ] Check that variant toggle still appears (will be removed in Phase 3)

---

## Phase 2: Simplify Rail Component

### Changes Required

#### 1. Remove Variant Logic from Preview Configs

**File**: `components/layout-selector.tsx`
**Location**: Around lines 62-126 in `previewConfigs` useMemo

The rail component currently extracts the first variant and builds preview configs. Since layouts are now pre-flattened, this logic can be simplified.

**Before:**
```typescript
const previewConfigs = useMemo(() => {
  return LAYOUT_DEFINITIONS
    .filter(matchesAssetType)
    .map((layoutDef) => {
      const defaultVariant = layoutDef.variants[0] || "default";
      const config = {
        ...layoutDef.createConfig(),
        layoutId: layoutDef.id,
        variant: defaultVariant,
      };
      // ... rest of logic
      return {
        key: layoutDef.id,
        displayName: layoutDef.name,
        layoutDef,
        previewConfig: config,
        // ...
      };
    });
}, [assetType, ...]);
```

**After:**
```typescript
const previewConfigs = useMemo(() => {
  return LAYOUT_DEFINITIONS
    .filter(matchesAssetType)
    .map((layoutDef) => {
      // Layout definitions now have pre-configured variant in createConfig()
      const config = layoutDef.createConfig();

      // ... rest of logic (background preservation, etc.)
      return {
        key: layoutDef.id, // Already includes variant (e.g., "popup-gradient-left")
        displayName: layoutDef.name, // Already includes variant (e.g., "Peak Left")
        layoutDef,
        previewConfig: config, // Already has correct layoutId and variant
        // ...
      };
    });
}, [assetType, ...]);
```

**Note:** The main simplification is removing the `defaultVariant` logic since each layout definition now has exactly one variant baked in.

### Success Criteria

#### Automated Verification
```bash
# Type check passes
pnpm typecheck

# Build completes without errors
pnpm build
```

#### Manual Verification
- [ ] All 7 thumbnails still render correctly
- [ ] Clicking each thumbnail still applies the correct layout+variant
- [ ] Thumbnails show variant-specific geometry in preview
- [ ] Rail scrolls horizontally on small screens (expected behavior)
- [ ] No console errors

---

## Phase 3: Remove Variant Toggle Component

### Changes Required

#### 1. Remove VariantToggle from PlaygroundWorkspace

**File**: `components/playground-workspace.tsx`

**Remove import (line 4):**
```typescript
import { VariantToggle } from "@/components/variant-toggle";
```

**Remove prop (line 25):**
```typescript
interface PlaygroundWorkspaceProps {
  isMobile: boolean;
  onVariantChange: (variant: string) => void; // ← REMOVE THIS
  // ... other props
}
```

**Remove parameter (line 37):**
```typescript
export function PlaygroundWorkspace({
  isMobile,
  onVariantChange, // ← REMOVE THIS
  shouldShowAspectLock,
  // ... other parameters
}: PlaygroundWorkspaceProps) {
```

**Remove render (line 55):**
```typescript
<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
  <VariantToggle onVariantChange={onVariantChange} /> {/* ← REMOVE THIS LINE */}

  {shouldShowAspectLock ? (
```

#### 2. Remove Variant Change Handler from Controller

**File**: `hooks/use-playground-controller.ts`
**Location**: Around line 301-318

Find and remove the `useVariantChangeHandler` function:

```typescript
// ← REMOVE THIS ENTIRE FUNCTION
function useVariantChangeHandler(setConfig: Setter<LayoutConfig>) {
  return useCallback(
    (variant: string) => {
      setConfig((currentConfig) => {
        const layout = getLayoutDefinition(currentConfig.layoutId);
        if (!layout || !layout.variants.includes(variant) || currentConfig.variant === variant) {
          return currentConfig;
        }

        return {
          ...currentConfig,
          variant,
        };
      });
    },
    [setConfig],
  );
}
```

Find where `useVariantChangeHandler` is called and remove it from the return object.

**Before:**
```typescript
export function usePlaygroundController() {
  // ... other hooks
  const handleVariantChange = useVariantChangeHandler(setConfig);

  return {
    // ... other values
    handleVariantChange,
  };
}
```

**After:**
```typescript
export function usePlaygroundController() {
  // ... other hooks
  // (removed useVariantChangeHandler call)

  return {
    // ... other values
    // (removed handleVariantChange)
  };
}
```

#### 3. Remove onVariantChange Prop from Page

**File**: `app/page.tsx`

Find where `PlaygroundWorkspace` is rendered and remove the `onVariantChange` prop:

**Before:**
```typescript
<PlaygroundWorkspace
  isMobile={isMobile}
  onVariantChange={controller.handleVariantChange}
  shouldShowAspectLock={shouldShowAspectLock}
  // ... other props
/>
```

**After:**
```typescript
<PlaygroundWorkspace
  isMobile={isMobile}
  shouldShowAspectLock={shouldShowAspectLock}
  // ... other props
/>
```

#### 4. Delete Variant Toggle Component File

**File**: `components/variant-toggle.tsx`

**Action:** Delete the entire file (308 lines)

```bash
rm components/variant-toggle.tsx
```

### Success Criteria

#### Automated Verification
```bash
# Type check passes (no references to deleted file)
pnpm typecheck

# Lint passes
pnpm lint

# Build completes without errors
pnpm build
```

#### Manual Verification
- [ ] Variant toggle row is completely gone from UI
- [ ] All 7 thumbnails still work correctly
- [ ] Clicking a thumbnail applies both layout and variant in one action
- [ ] Pattern controls are missing (expected - will be restored in Phase 4)
- [ ] No console errors
- [ ] Export functionality still works

---

## Phase 4: Migrate Pattern Controls to Sidebar

Pattern style controls (grain/glow/grid) were in the variant toggle component. We'll move them to the sidebar Effects section for consistency with other styling controls.

### Changes Required

#### 1. Extract Pattern Control Logic

**File**: `components/sidebar-sections/effects-section.tsx`

Add the pattern control constants and hook at the top of the file:

```typescript
const PATTERN_OPTIONS = ["none", "grain", "glow", "grid"] as const;
type PatternOption = (typeof PATTERN_OPTIONS)[number];

/**
 * Hook for managing pattern selection
 */
function usePatternControls(
  config: LayoutConfig,
  screenshotAsset: Asset | undefined,
  setConfig: (update: (current: LayoutConfig) => LayoutConfig) => void,
) {
  const backgroundType = config.background?.type;
  const isImageBackground = backgroundType === "image";
  const resolvedPattern = resolvePatternChoice(config, screenshotAsset?.colorPalette) as PatternOption;
  const shouldShowStyle = !isImageBackground;

  const handlePatternSelect = useCallback(
    (patternId: PatternOption) => {
      track("pattern_changed", {
        pattern: patternId,
        look_id: config.layoutId,
      });

      setConfig((current) => {
        const background =
          current.background ?? ({
            type: "gradient",
            value: "custom",
          } as typeof current.background);
        return {
          ...current,
          background: {
            ...background,
            patternMode: "manual",
            patternId,
            grainEnabled: patternId === "grain",
          },
        };
      });
    },
    [setConfig, config.layoutId],
  );

  const getPatternLabel = useCallback((id: PatternOption) => {
    return id === "none" ? "Off" : id.charAt(0).toUpperCase() + id.slice(1);
  }, []);

  return { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel };
}
```

#### 2. Add Pattern Controls to Effects Section

**File**: `components/sidebar-sections/effects-section.tsx`

Add required imports:

```typescript
import { useAtom } from "jotai";
import { configAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { resolvePatternChoice } from "@/domain/layout/patterns";
import { track } from "@/lib/analytics";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
```

Update the EffectsSection component to include pattern controls:

```typescript
export function EffectsSection() {
  const [config, setConfig] = useAtom(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel } =
    usePatternControls(config, screenshotAsset, setConfig);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Existing effects controls (shadow, soft glass, etc.) */}

      {/* Pattern Style Controls - Only show for gradient backgrounds */}
      {shouldShowStyle && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Pattern Style</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {PATTERN_OPTIONS.map((pattern) => (
              <Button
                key={pattern}
                variant={resolvedPattern === pattern ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePatternSelect(pattern)}
                className="text-xs"
              >
                {getPatternLabel(pattern)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Success Criteria

#### Automated Verification
```bash
# Type check passes
pnpm typecheck

# Build completes without errors
pnpm build
```

#### Manual Verification
- [ ] Pattern controls appear in sidebar Effects section
- [ ] Pattern controls only show when background type is gradient
- [ ] Pattern controls hide when background type is image or solid
- [ ] Clicking pattern buttons (Off/Grain/Glow/Grid) changes the pattern
- [ ] Pattern selection persists when switching layouts
- [ ] Analytics event "pattern_changed" fires correctly
- [ ] No console errors

---

## Phase 5: Verification and Testing

### Changes Required

#### 1. Manual Testing Checklist

**Layout Selection:**
- [ ] All 7 thumbnails render in the rail
- [ ] Thumbnails show correct names:
  - Peak Left
  - Peak Right
  - Peak Center
  - Spotlight Left
  - Spotlight Right
  - Backdrop
  - Code
- [ ] Clicking each thumbnail applies the correct layout+variant
- [ ] Thumbnails show variant-specific geometry in preview (e.g., Peak Left shows text on left, image on right)

**Variant Toggle Removal:**
- [ ] Variant toggle row is completely gone
- [ ] No layout has a variant toggle (even layouts with multiple variants)
- [ ] One-click selection works (no second step required)

**Pattern Controls Migration:**
- [ ] Pattern controls appear in sidebar Effects section
- [ ] Pattern controls work correctly (Off/Grain/Glow/Grid)
- [ ] Pattern controls only show for gradient backgrounds

**Edge Cases:**
- [ ] Horizontal scroll works on mobile/small screens
- [ ] Export functionality works with new layout IDs
- [ ] Switching between Screenshot and Code asset types still works
- [ ] Background preservation works when switching layouts

**Backward Compatibility:**
- [ ] Opening app with old localStorage (if applicable) doesn't crash
- [ ] Legacy layout IDs are handled correctly

#### 2. Analytics Verification

Check that analytics events fire correctly:

```typescript
// Layout selection should track:
track("look_changed", {
  from_look: "popup-gradient-left",
  to_look: "popup-gradient-right",
  look_name: "Peak Right",
});

// Pattern selection should track:
track("pattern_changed", {
  pattern: "grain",
  look_id: "popup-gradient-left",
});
```

#### 3. Performance Check

- [ ] Rail renders 7 thumbnails without performance issues
- [ ] Scrolling is smooth
- [ ] Thumbnail previews render without lag
- [ ] No memory leaks (check browser DevTools)

### Success Criteria

#### Automated Verification
```bash
# All checks pass
pnpm check

# Specific checks:
pnpm lint          # No linting errors
pnpm typecheck     # No type errors
pnpm test:domain   # Domain tests pass
pnpm test:ui       # UI tests pass
pnpm build         # Production build succeeds
```

#### Manual Verification
- [ ] All manual testing checklist items pass
- [ ] Analytics events fire correctly
- [ ] Performance is acceptable
- [ ] No regressions in existing functionality
- [ ] User experience is improved (one-click selection)

---

## Rollback Plan

If issues arise during implementation, rollback is straightforward:

### Phase-by-Phase Rollback

**If Phase 1 fails:**
```bash
git checkout HEAD -- domain/layout-def/definitions.ts
```

**If Phase 2 fails:**
```bash
git checkout HEAD -- components/layout-selector.tsx
```

**If Phase 3 fails:**
```bash
git checkout HEAD -- components/playground-workspace.tsx hooks/use-playground-controller.ts app/page.tsx
git restore components/variant-toggle.tsx
```

**If Phase 4 fails:**
```bash
git checkout HEAD -- components/sidebar-sections/effects-section.tsx
```

### Complete Rollback

```bash
# Revert all changes
git reset --hard HEAD

# Or revert specific commit
git revert <commit-hash>
```

### Partial Rollback Strategy

If only pattern controls migration fails (Phase 4), we can:
1. Revert Phase 4 changes
2. Keep Phases 1-3 (flattened layouts, removed variant toggle)
3. Pattern controls temporarily unavailable (acceptable trade-off)
4. Fix and re-deploy Phase 4 later

---

## Files Summary

### Files to Create
- None (all changes are modifications)

### Files to Modify
1. `domain/layout-def/definitions.ts` - Expand layouts with variants
2. `components/layout-selector.tsx` - Simplify preview configs
3. `components/playground-workspace.tsx` - Remove VariantToggle import/render
4. `hooks/use-playground-controller.ts` - Remove variant change handler
5. `app/page.tsx` - Remove onVariantChange prop
6. `components/sidebar-sections/effects-section.tsx` - Add pattern controls

### Files to Delete
1. `components/variant-toggle.tsx` - Entire file (308 lines)

---

## Notes

### Why This Approach?

1. **Minimal Changes**: Most of the work is data transformation. Layout components and state management already support this pattern.

2. **Backward Compatible**: Old layout IDs are handled via migration logic in `getLayoutDefinition()`.

3. **Better UX**: One-click selection is faster and more intuitive than two-step selection.

4. **Consistent Patterns**: Moving pattern controls to sidebar matches existing control organization.

5. **Low Risk**: Each phase is independent and can be tested/rolled back separately.

### Estimated Effort

- **Phase 1**: 30 minutes (layout expansion)
- **Phase 2**: 15 minutes (rail simplification)
- **Phase 3**: 20 minutes (variant toggle removal)
- **Phase 4**: 30 minutes (pattern controls migration)
- **Phase 5**: 45 minutes (testing and verification)

**Total**: ~2.5 hours implementation + testing

### Post-Implementation

After successful deployment:

1. Monitor analytics for:
   - Layout selection patterns
   - Pattern usage
   - Any errors or unexpected behavior

2. Gather user feedback:
   - Is one-click selection clearer?
   - Are pattern controls easy to find in sidebar?
   - Any missing functionality?

3. Consider future enhancements:
   - Add layout search/filter if rail becomes too long
   - Add layout categories or grouping
   - Keyboard shortcuts for layout selection
