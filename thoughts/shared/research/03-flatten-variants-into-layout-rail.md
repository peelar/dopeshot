# Research: Flatten Variants into Layout Rail

**Date:** 2025-12-16
**Goal:** Eliminate the Variants toggle row by making each variant its own layout thumbnail in the rail

## Overview

The current implementation separates layout selection (thumbnails in rail) from variant selection (toggle buttons below rail). This creates a two-step selection process. The goal is to flatten this into a single-step selection where each layout+variant combination is its own thumbnail.

## Key Files & Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| `domain/layout-def/definitions.ts` | Layout definitions with variants array | 51-295 |
| `components/layout-selector.tsx` | Main rail component showing thumbnails | 50-256 |
| `components/variant-toggle.tsx` | Variants toggle row (to be removed) | 146-308 |
| `hooks/atoms.ts` | State management atoms | 16-37 |
| `hooks/atoms/derived.ts` | Derived atoms for current layout | 11-14 |
| `components/layouts/PopupGradient.tsx` | Example layout using variants | 76-295 |
| `components/layouts/HeroCenter.tsx` | Example layout using variants | 47, 202-218 |
| `domain/layout/types.ts` | LayoutConfig type definition | 81-111 |

## Current Architecture & Data Flow

### 1. Layout Definitions Structure

**File:** `domain/layout-def/definitions.ts:51-295`

Currently, layouts are defined with a `variants` array:

```typescript
export interface LayoutDefinition {
  id: string;              // e.g., "popup-gradient"
  name: string;            // e.g., "Peak"
  description: string;
  variants: string[];      // e.g., ["left", "right", "center"]
  createConfig: () => LayoutConfig;
  capabilities: LayoutCapabilities;
}

// Current definitions:
{
  id: "popup-gradient",
  name: "Peak",
  variants: ["left", "right", "center"],  // 3 variants
  // ...
}
{
  id: "hero-center",
  name: "Spotlight",
  variants: ["left", "right"],            // 2 variants
  // ...
}
{
  id: "adaptive-stage",
  name: "Backdrop",
  variants: [],                           // No variants
  // ...
}
{
  id: "code-snippet",
  name: "Code",
  variants: ["center"],                   // 1 variant
  // ...
}
```

### 2. Current Selection Flow (Two-Step)

**Step 1: Layout Selection** (`layout-selector.tsx:143-168`)
```typescript
const applyLayoutSelection = useCallback(
  (layoutId: string, displayName?: string) => {
    const nextConfig = previewConfigByLayoutId.get(layoutId);
    setConfig({
      ...nextConfig,
      variant: nextConfig.variant,  // Uses default variant
    });
  },
  [...]
);
```

**Step 2: Variant Selection** (`variant-toggle.tsx:146-308`)
```typescript
// User then clicks variant toggle to change variant
<ButtonGroup>
  {displayVariants.map((variant) => (
    <Button onClick={() => handleVariantChange(variant)}>
      {variant}
    </Button>
  ))}
</ButtonGroup>
```

### 3. State Management

**Current State:** (`hooks/atoms.ts:16`)
```typescript
export const configAtom = atom<LayoutConfig>({
  layoutId: string;    // e.g., "popup-gradient"
  variant: string;     // e.g., "left", "right", "center"
  // ... other config
});
```

Variant is stored separately in `config.variant` and requires a second user action to change.

### 4. Rail Component Structure

**Current Rail:** (`layout-selector.tsx:62-126`)
```typescript
// Creates one preview per layout (4 thumbnails total)
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
      return {
        key: layoutDef.id,
        displayName: layoutDef.name,
        layoutDef,
        previewConfig: config,
      };
    });
}, [assetType, ...]);
```

Shows 4 thumbnails:
- Peak (defaults to "left")
- Spotlight (defaults to "left")
- Backdrop (no variant)
- Code (defaults to "center")

### 5. Variant Toggle Component Location

**Rendered in:** `components/playground-workspace.tsx:55`
```typescript
<div className="flex flex-col gap-2">
  <VariantToggle />  {/* This row needs to be removed */}
  <PreviewViewport>
    <CoverPreview />
  </PreviewViewport>
</div>
```

**Component:** `variant-toggle.tsx:146-308`
- Conditionally rendered only if `layout.variants.length > 1`
- Shows button group on desktop, select dropdown on mobile
- Includes pattern style controls (grain/glow/grid)

## Target Architecture

### 1. Flattened Layout Definitions

**Approach:** Expand layouts with variants into multiple layout entries

**Before:**
```typescript
{
  id: "popup-gradient",
  variants: ["left", "right", "center"]
}
```

**After:**
```typescript
{
  id: "popup-gradient-left",
  parentId: "popup-gradient",     // Track original layout
  variant: "left",                 // Baked into definition
  variants: ["left"],              // Single variant
  name: "Peak Left",
}
{
  id: "popup-gradient-right",
  parentId: "popup-gradient",
  variant: "right",
  variants: ["right"],
  name: "Peak Right",
}
{
  id: "popup-gradient-center",
  parentId: "popup-gradient",
  variant: "center",
  variants: ["center"],
  name: "Peak Center",
}
```

### 2. Updated Rail Component

**New Rail Logic:**
```typescript
// Rail now shows all layout+variant combinations (9 thumbnails total)
const previewConfigs = useMemo(() => {
  return LAYOUT_DEFINITIONS
    .filter(matchesAssetType)
    .flatMap((layoutDef) => {
      // For each layout, create a thumbnail per variant
      return layoutDef.variants.map((variant) => ({
        key: `${layoutDef.id}-${variant}`,
        displayName: `${layoutDef.name} ${capitalize(variant)}`,
        layoutDef,
        previewConfig: {
          ...layoutDef.createConfig(),
          layoutId: layoutDef.id,
          variant: variant,
        },
      }));
    });
}, [assetType, ...]);
```

### 3. Single-Step Selection

**New Selection Flow:**
```typescript
const applyLayoutSelection = useCallback(
  (layoutId: string, variant: string, displayName?: string) => {
    // Both layout and variant applied in one action
    setConfig({
      ...layoutDef.createConfig(),
      layoutId,
      variant,
    });
  },
  [...]
);
```

### 4. Variant Toggle Removal

**Files to Modify:**
- **Remove import:** `components/playground-workspace.tsx:4`
- **Remove render:** `components/playground-workspace.tsx:55`
- **Delete file:** `components/variant-toggle.tsx` (entire file)

**Pattern Controls Migration:**
The pattern style controls (grain/glow/grid) currently in `variant-toggle.tsx:88-140` need to be moved. Options:
1. Move to sidebar (Design section)
2. Add to rail as separate controls
3. Keep above preview but separate from variant selection

## Implementation Plan

### Phase 1: Expand Layout Definitions

**File:** `domain/layout-def/definitions.ts`

1. **Add helper function** to expand layouts with variants:
   ```typescript
   function expandLayoutVariants(layoutDef: LayoutDefinition): LayoutDefinition[] {
     if (layoutDef.variants.length <= 1) {
       return [layoutDef];
     }

     return layoutDef.variants.map((variant) => ({
       ...layoutDef,
       id: `${layoutDef.id}-${variant}`,
       name: `${layoutDef.name} ${capitalize(variant)}`,
       variant,
       variants: [variant],  // Single variant only
     }));
   }
   ```

2. **Update LAYOUT_DEFINITIONS export:**
   ```typescript
   export const LAYOUT_DEFINITIONS = RAW_LAYOUT_DEFINITIONS.flatMap(expandLayoutVariants);
   ```

### Phase 2: Update Rail Component

**File:** `components/layout-selector.tsx`

1. **Update preview configs** (already handles multiple variants via flatMap)
2. **Update thumbnail rendering** to show variant-specific geometry
3. **Update selection handler** to pass variant to tracking

### Phase 3: Remove Variant Toggle

**Files:**
- `components/playground-workspace.tsx` - Remove `<VariantToggle />` import and render
- `components/variant-toggle.tsx` - Delete entire file
- `hooks/use-playground-controller.ts` - Remove `useVariantChangeHandler` if no longer needed

### Phase 4: Migrate Pattern Controls

**Option A: Move to Sidebar**
- Add pattern controls to `components/sidebar-sections/layout-section.tsx`
- Show only when `config.background.type === "gradient"`

**Option B: Separate Rail Controls**
- Create new `PatternStyleToggle` component
- Render in `playground-workspace.tsx` above preview

### Phase 5: Update State Management

**File:** `hooks/atoms.ts`

No changes needed! `configAtom` already stores both `layoutId` and `variant`.

### Phase 6: Update Layout Components

**Files:** Layout component implementations

**No changes needed!** Layout components already read `config.variant` and render accordingly:
- `PopupGradient.tsx:76-80` - Reads variant for text placement
- `HeroCenter.tsx:47` - Reads variant for flex direction

### Phase 7: Update Analytics Tracking

**Files:** Event tracking calls

Update tracking to include variant in layout selection:
```typescript
track("look_changed", {
  from_look: currentConfig.layoutId,
  to_look: layoutId,
  variant: variant,
  look_name: displayName,
});
```

## Thumbnail Wireframe Strategy

### Current Thumbnails
All variants show the same thumbnail (first variant's geometry).

### Target Thumbnails
Each thumbnail shows its specific variant geometry:

**Peak Left:**
```
┌────────────────┐
│ TEXT    [IMG]  │
│                │
└────────────────┘
```

**Peak Right:**
```
┌────────────────┐
│ [IMG]    TEXT  │
│                │
└────────────────┘
```

**Peak Center:**
```
┌────────────────┐
│     TEXT       │
│    [IMG]       │
└────────────────┘
```

**Implementation:**
Each preview card already renders `<CoverPreview />` with isolated Jotai store, so thumbnails will automatically reflect variant-specific geometry once variant is baked into preview config.

## Edge Cases & Considerations

### 1. Backward Compatibility

**Layout IDs Change:**
- Old: `popup-gradient`
- New: `popup-gradient-left`, `popup-gradient-right`, `popup-gradient-center`

**Solution:**
Add migration logic in `getLayoutDefinition()`:
```typescript
export function getLayoutDefinition(layoutId: string): LayoutDefinition | undefined {
  // Handle legacy IDs without variant suffix
  if (layoutId === "popup-gradient") {
    return LAYOUT_DEFINITIONS.find(d => d.id === "popup-gradient-left");
  }
  return LAYOUT_DEFINITIONS.find(d => d.id === layoutId);
}
```

### 2. Saved Configs with Old Layout IDs

**Problem:** User's saved configs may have old layout IDs

**Solution:**
Add migration in config loader:
```typescript
function migrateConfig(config: LayoutConfig): LayoutConfig {
  const needsMigration = !config.layoutId.includes("-");
  if (needsMigration && config.variant) {
    return {
      ...config,
      layoutId: `${config.layoutId}-${config.variant}`,
    };
  }
  return config;
}
```

### 3. Total Thumbnail Count

**Before:** 4 thumbnails
- Peak (1)
- Spotlight (1)
- Backdrop (1)
- Code (1)

**After:** 7 thumbnails
- Peak Left (1)
- Peak Right (1)
- Peak Center (1)
- Spotlight Left (1)
- Spotlight Right (1)
- Backdrop (1)
- Code (1)

**Impact:** Horizontal scroll required on small screens (already handled by rail component)

### 4. Mobile Experience

**Current:** Variants shown in Select dropdown on mobile

**After:** All variants as thumbnails (may require horizontal scroll)

**Solution:** Rail already has horizontal scroll (`overflow-x-auto`)

### 5. Pattern Controls Location

**Current:** In VariantToggle component below rail

**Options:**
1. **Sidebar Design section** - Most consistent with other controls
2. **Separate toggle above preview** - Preserves current location
3. **Rail itself** - Inline with thumbnails

**Recommendation:** Move to sidebar Design section for consistency

## Patterns to Follow

### 1. Layout Definition Pattern
- Keep layout definitions as pure data (no React components)
- Use `createConfig()` factory function for default values
- Store capabilities for UI control visibility

### 2. State Management Pattern
- Use Jotai atoms for global state
- Derived atoms for computed values
- Immutable updates via spread operators

### 3. Component Composition
- Rail shows all layout options
- Layout components read from atoms
- Preview thumbnails use isolated stores

### 4. Naming Convention
- Layout IDs: `{base-id}-{variant}` (e.g., `popup-gradient-left`)
- Display names: `{Base Name} {Variant}` (e.g., "Peak Left")

## Code Examples

### Example 1: Expanded Layout Definition

**Before:**
```typescript
{
  id: "popup-gradient",
  name: "Peak",
  variants: ["left", "right", "center"],
  createConfig: () => ({ ... }),
  capabilities: { ... },
}
```

**After:**
```typescript
[
  {
    id: "popup-gradient-left",
    name: "Peak Left",
    variants: ["left"],
    variant: "left",
    createConfig: () => ({ ...baseConfig, variant: "left" }),
    capabilities: { ... },
  },
  {
    id: "popup-gradient-right",
    name: "Peak Right",
    variants: ["right"],
    variant: "right",
    createConfig: () => ({ ...baseConfig, variant: "right" }),
    capabilities: { ... },
  },
  {
    id: "popup-gradient-center",
    name: "Peak Center",
    variants: ["center"],
    variant: "center",
    createConfig: () => ({ ...baseConfig, variant: "center" }),
    capabilities: { ... },
  }
]
```

### Example 2: Updated Rail Preview Configs

**File:** `components/layout-selector.tsx:62-126`

**Before:**
```typescript
const previewConfigs = useMemo(() => {
  return LAYOUT_DEFINITIONS
    .filter(matchesAssetType)
    .map((layoutDef) => ({
      key: layoutDef.id,
      displayName: layoutDef.name,
      previewConfig: {
        ...layoutDef.createConfig(),
        layoutId: layoutDef.id,
        variant: layoutDef.variants[0],  // Default variant
      },
    }));
}, [...]);
```

**After:**
```typescript
const previewConfigs = useMemo(() => {
  return LAYOUT_DEFINITIONS
    .filter(matchesAssetType)
    .map((layoutDef) => ({
      key: layoutDef.id,  // Already includes variant in ID
      displayName: layoutDef.name,  // Already includes variant in name
      previewConfig: layoutDef.createConfig(),  // Already has correct variant
    }));
}, [...]);
```

### Example 3: Pattern Controls Migration

**Current Location:** `variant-toggle.tsx:88-140`

**Move to:** `components/sidebar-sections/effects-section.tsx`

```typescript
export function EffectsSection() {
  const [config, setConfig] = useAtom(configAtom);
  const { handlePatternSelect, resolvedPattern } = usePatternControls(config, setConfig);

  const showPatternControls = config.background?.type === "gradient";

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Existing effects controls */}

      {showPatternControls && (
        <div className="flex flex-col gap-2">
          <Label>Pattern Style</Label>
          <div className="flex gap-2">
            {PATTERN_OPTIONS.map((pattern) => (
              <Button
                variant={resolvedPattern === pattern ? "default" : "ghost"}
                onClick={() => handlePatternSelect(pattern)}
              >
                {capitalize(pattern)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Recommendations

### 1. Phased Rollout

**Phase 1:** Expand layout definitions + update rail (core functionality)
**Phase 2:** Remove variant toggle component
**Phase 3:** Migrate pattern controls to sidebar
**Phase 4:** Add backward compatibility migration

### 2. Testing Strategy

**Manual Testing:**
- [ ] All 7 thumbnails render correctly
- [ ] Clicking each thumbnail applies correct layout+variant
- [ ] Thumbnails show variant-specific geometry
- [ ] Pattern controls still work (if moved to sidebar)
- [ ] Export works with new layout IDs
- [ ] Analytics tracking includes variant

**Automated Testing:**
- [ ] Unit tests for layout definition expansion
- [ ] Component tests for rail rendering
- [ ] E2E tests for selection flow

### 3. Analytics Considerations

**Update Events:**
- `look_changed` - Add `variant` field
- `export_button_clicked` - Already includes `variant`

**New Events:**
- `layout_variant_selected` - Track individual variant selections

### 4. Performance

**Impact:** Minimal
- Renders 7 thumbnails instead of 4 (75% increase)
- Each thumbnail already uses isolated Jotai store (no re-render interference)
- Preview configs already memoized

### 5. UX Improvements

**Benefits:**
- ✅ One-click selection (faster workflow)
- ✅ Visual preview of each variant (better discoverability)
- ✅ Clearer mental model (no hidden options)

**Considerations:**
- ⚠️ More horizontal scrolling on mobile
- ⚠️ Rail takes more vertical space (more thumbnails)

## Files to Create/Modify/Delete

### Create
- None (expansion happens within existing files)

### Modify
1. `domain/layout-def/definitions.ts` - Expand layouts with variants
2. `components/layout-selector.tsx` - Update preview configs (minimal changes)
3. `components/playground-workspace.tsx` - Remove VariantToggle
4. `components/sidebar-sections/effects-section.tsx` - Add pattern controls
5. `hooks/use-playground-controller.ts` - Remove useVariantChangeHandler

### Delete
1. `components/variant-toggle.tsx` - Entire file (308 lines)

## Success Criteria

- [ ] Variant toggle row completely removed
- [ ] All layout+variant combinations appear as individual thumbnails in rail
- [ ] Selecting a thumbnail applies both layout and variant in one action
- [ ] Total thumbnail count = 7 (was 4)
- [ ] Thumbnails show variant-specific geometry in preview
- [ ] Pattern controls still functional (moved to sidebar)
- [ ] No regressions in export functionality
- [ ] Analytics tracking updated with variant info
- [ ] Backward compatibility for saved configs with old layout IDs

## Estimated Complexity

**Low-Medium Complexity:**
- Most changes are mechanical (expanding definitions)
- State management already supports this pattern
- Layout components already read variant from config
- Main risk: backward compatibility for saved configs

**Time Estimate:** 2-4 hours for implementation + testing
