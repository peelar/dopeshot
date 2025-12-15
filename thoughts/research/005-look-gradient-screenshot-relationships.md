# Research: Look-Gradient-Screenshot Relationships & Decoupling Analysis

## Overview

This research investigates the relationships between looks, gradients, and screenshots in the codebase, focusing on identifying coupling points and evaluating the effort required to decouple screenshot-derived gradient generation from looks that don't use screenshots (specifically the "code-snippet" look).

**Key Finding:** The code-snippet look is already partially decoupled from screenshots, but gradient synchronization still occurs through shared configuration state. Full decoupling would require minimal changes to the color analysis pipeline.

---

## Executive Summary

### Current State
- **4 looks total:** 3 use screenshots (Peak, Spotlight, Backdrop), 1 does not (Code)
- **All looks use gradients** - including the code-snippet look
- **Screenshot uploads trigger gradient generation** for ALL looks via shared config state
- **Code-snippet look has partial protection** - screenshot gradients are hidden in UI, but color analysis still runs

### Coupling Points
1. **Shared Config State** (`configAtom`) - all looks share the same `background` config
2. **Automatic Color Analysis** - `useColorAnalysis` hook runs on screenshot upload regardless of look
3. **Gradient Application** - Generated gradients are applied to `config.background.customGradient`
4. **UI Gradient Picker** - Screenshot-derived gradients are filtered out for code-snippet, but still exist

### Decoupling Effort: **LOW to MEDIUM**
- **Low effort:** Prevent color analysis from running for code-snippet look
- **Medium effort:** Complete separation of screenshot and non-screenshot look configs

---

## Architecture Overview

### Data Flow

```
Screenshot Upload
    ↓
processFileUpload()
domain/asset/upload-orchestrator.ts:16-66
    ↓
├─→ assetsAtom (stores screenshot metadata)
├─→ configAtom.assets.screenshot = assetId
├─→ hasCustomScreenshotAtom = true
│
└─→ processColorAnalysis()
    hooks/use-color-analysis.ts:27-108
    ↓
    ├─→ analyzeImageColors() - extracts palette
    ├─→ generateGradientOptions() - creates 4 variations
    ├─→ applyPreferredAngle() - adjusts for look variant
    └─→ configAtom.background.customGradient = gradient
        configAtom.colors.text = contrastColor
```

### State Management

| Atom | Location | Purpose | Affects Code Look? |
|------|----------|---------|-------------------|
| `configAtom` | hooks/atoms.ts:13 | Central config with lookId, background, assets | **YES** - shared state |
| `assetsAtom` | hooks/atoms.ts:14 | Screenshot/logo/background assets | **YES** - contains screenshot |
| `screenshotAssetAtom` | hooks/atoms/derived.ts:21-25 | Derived: current screenshot | **YES** - read by primitives |
| `hasCustomScreenshotAtom` | hooks/atoms.ts:20 | Flag: user uploaded screenshot | **YES** - triggers analysis |

---

## Key Files & Locations

### Look Definitions & Components

| Look | Uses Screenshot | Uses Gradient | Definition | Component |
|------|----------------|---------------|------------|-----------|
| Peak (popup-gradient) | YES | YES | domain/look/definitions.ts:50-109 | components/looks/PopupGradient.tsx |
| Spotlight (hero-center) | YES | YES | domain/look/definitions.ts:110-169 | components/looks/HeroCenter.tsx |
| Backdrop (adaptive-stage) | YES | YES | domain/look/definitions.ts:170-225 | components/looks/AdaptiveScreenshot.tsx |
| **Code (code-snippet)** | **NO** | **YES** | domain/look/definitions.ts:227-284 | components/looks/CodeSnippet.tsx |

### Gradient System

| File | Purpose | Key Lines |
|------|---------|-----------|
| `domain/layout/gradient-presets.ts` | 8 preset gradients (Hyper, Oceanic, etc.) | 32-113 |
| `domain/layout/gradients/generator.ts` | Generate gradients from screenshot colors | 306-327 |
| `hooks/use-color-analysis.ts` | Orchestrates color extraction & gradient application | 27-108 |
| `hooks/use-playground-controller.ts` | Manages gradient angle preferences | 191-228 |
| `components/gradient-picker.tsx` | UI for selecting gradients | 88-150 |

### Screenshot System

| File | Purpose | Key Lines |
|------|---------|-----------|
| `hooks/use-file-upload.ts` | Screenshot upload orchestration | 60-152 |
| `domain/asset/upload-orchestrator.ts` | File processing pipeline | 16-66 |
| `domain/layout/screenshot-mode.ts` | Screenshot focus & canvas mode logic | 12-73 |
| `components/looks/shared/look-primitives.tsx` | Screenshot data access hook | 16-73 |

---

## Detailed Coupling Analysis

### 1. Screenshot Upload Triggers Gradient Generation

**Location:** `hooks/use-color-analysis.ts:27-108`

**Current Behavior:**
```typescript
export function useColorAnalysis() {
  const processColorAnalysis = useCallback(async (asset: Asset) => {
    // Lines 30-37: Extract color palette from screenshot
    const colorPalette = await analyzeImageColors(asset.url);

    // Lines 39-44: Generate 4 gradient variations
    const gradientOptions = generateGradientOptions(colorPalette, context);

    // Lines 71-86: Apply gradient to config (ALL LOOKS)
    setConfig((currentConfig) => ({
      ...currentConfig,
      background: {
        ...currentConfig.background,
        type: "gradient",
        customGradient: selectedGradient,
      },
      colors: {
        ...currentConfig.colors,
        text: textColor,
      },
    }));
  }, []);
}
```

**Problem:** This runs for ALL looks, including code-snippet which doesn't use screenshots.

**Impact:** When a user uploads a screenshot while using code-snippet look, a gradient is generated and applied even though:
- The code-snippet look never displays the screenshot
- The gradient may not match the user's desired aesthetic for code

---

### 2. Gradient Picker UI Has Partial Protection

**Location:** `components/gradient-picker.tsx:88-150`

**Current Protection:**
```typescript
// Line 96: Check if current look is code-snippet
const isCodeSnippet = config.lookId === "code-snippet";

// Lines 100-108: Generate screenshot gradients ONLY if not code-snippet
const screenshotGradients = useMemo(() => {
  if (!colorPalette || !hasScreenshot || isCodeSnippet) {
    return [];
  }
  return generateGradientOptions(colorPalette, context);
}, [colorPalette, hasScreenshot, context, isCodeSnippet]);
```

**Good:** Screenshot-derived gradients are hidden from code-snippet users in the UI.

**Limitation:** This only prevents UI display, not the automatic application during upload.

---

### 3. Shared Config State Couples All Looks

**Location:** `hooks/atoms.ts:13`

**Structure:**
```typescript
export const configAtom = atom<LayoutConfig>({
  lookId: "popup-gradient",
  variant: "right",
  background: {
    type: "gradient",
    value: DEFAULT_GRADIENT.id,
    customGradient?: CustomGradient,  // <--- SHARED by all looks
  },
  assets: {
    screenshot?: string,  // <--- SHARED by all looks
  },
  // ... other fields
});
```

**Problem:** Single config object means:
- Screenshot asset ID is stored even for code-snippet look
- Custom gradient from screenshot is applied to code-snippet look
- Look switching preserves screenshot-derived gradients

---

### 4. Look Selector Preserves Gradients Across Switches

**Location:** `components/look-selector.tsx:44-80`

**Current Behavior:**
```typescript
const previewConfigs = useMemo(() => {
  return LOOK_DEFINITIONS.map((look) => {
    const baseConfig = look.createConfig();
    return {
      ...baseConfig,
      // Line 53: Preserve user's background (including screenshot gradients)
      background: currentConfig.background,
      colors: currentConfig.colors,
      screenshotShadow: currentConfig.screenshotShadow,
    };
  });
}, [currentConfig]);
```

**Impact:**
- If user uploads screenshot in Peak look → switches to Code look
- Screenshot-derived gradient follows them to Code look
- This may be unintended behavior

---

## Code-Snippet Look: Current State

### Screenshot Exclusions (Already Implemented)

✅ **UI Level:**
```typescript
// components/layout-config.tsx:119-130
// Screenshot section is hidden for code-snippet
{config.lookId !== "code-snippet" && (
  <ScreenshotSection screenshot={screenshotAsset} onUploadAsset={handleUploadAsset} />
)}
```

✅ **Component Level:**
```typescript
// components/looks/CodeSnippet.tsx:163
// Screenshot explicitly passed as undefined
<LookSurface
  className={className}
  onUploadAsset={onUploadAsset}
  isStatic={isStatic}
  screenshot={undefined}  // <--- No screenshot
>
```

✅ **Gradient Picker:**
```typescript
// components/gradient-picker.tsx:96-108
// Screenshot gradients hidden from UI
const isCodeSnippet = config.lookId === "code-snippet";
if (isCodeSnippet) {
  return [];  // No screenshot gradients
}
```

### What's Still Coupled

❌ **Color Analysis:**
- `useColorAnalysis` still runs on screenshot upload
- Generates gradients and applies to config
- No early return for code-snippet look

❌ **Config State:**
- `config.assets.screenshot` still populated
- `config.background.customGradient` still set from screenshot colors
- Shared state means screenshot data exists

❌ **Look Switching:**
- Gradients transfer between looks
- User could get screenshot gradient in code look via switching

---

## Decoupling Strategies

### Strategy 1: Prevent Color Analysis for Code-Snippet Look (RECOMMENDED)

**Effort:** LOW
**Files to modify:** 1
**Lines of code:** ~5

**Implementation:**

```typescript
// hooks/use-color-analysis.ts:27-108
export function useColorAnalysis() {
  const [config] = useAtom(configAtom);

  const processColorAnalysis = useCallback(async (asset: Asset) => {
    // EARLY RETURN: Skip analysis for code-snippet look
    if (config.lookId === "code-snippet") {
      console.log("Skipping color analysis for code-snippet look");
      return;
    }

    // ... rest of existing logic
  }, [config.lookId]);
}
```

**Pros:**
- Minimal code change
- Prevents unwanted gradient generation
- Preserves all existing functionality
- No state management changes needed

**Cons:**
- Screenshot metadata still stored in assets
- Config still contains screenshot asset ID
- Gradient could still transfer via look switching

---

### Strategy 2: Look-Specific Config Isolation

**Effort:** MEDIUM
**Files to modify:** 5-8
**Lines of code:** ~50-100

**Implementation:**

1. **Create look-specific config branches:**
```typescript
// domain/layout/types.ts
type LayoutConfig = {
  lookId: string;
  variant: string;
  // ... common fields
} & (
  | ScreenshotLookConfig  // For Peak, Spotlight, Backdrop
  | CodeLookConfig        // For Code
);

type ScreenshotLookConfig = {
  assets: {
    screenshot?: string;
    logo?: string;
    background?: string;
  };
  screenshotFrame: ScreenshotTreatment;
};

type CodeLookConfig = {
  code: {
    content: string;
    language: string;
    theme: string;
  };
  // No assets or screenshotFrame fields
};
```

2. **Modify config switching logic:**
```typescript
// components/look-selector.tsx
function switchToLook(newLookId: string) {
  const newConfig = getLookDefinition(newLookId).createConfig();

  // Preserve background ONLY if both looks are same category
  if (isScreenshotLook(currentLook) && isScreenshotLook(newLook)) {
    newConfig.background = currentConfig.background;
  } else if (isCodeLook(currentLook) && isCodeLook(newLook)) {
    newConfig.background = currentConfig.background;
  }
  // Otherwise, use look's default gradient
}
```

3. **Update color analysis to check look category:**
```typescript
// hooks/use-color-analysis.ts
if (!isScreenshotLook(config.lookId)) {
  return; // Skip for non-screenshot looks
}
```

**Pros:**
- Complete separation of concerns
- Type-safe config structure
- Prevents accidental state leakage
- Future-proof for new look categories

**Cons:**
- More refactoring required
- Potential breaking changes
- Migration path needed for existing configs
- Additional complexity in config management

---

### Strategy 3: Gradient Source Tracking

**Effort:** MEDIUM-HIGH
**Files to modify:** 6-10
**Lines of code:** ~100-150

**Implementation:**

1. **Track gradient source in config:**
```typescript
// domain/layout/types.ts
type BackgroundConfig = {
  type: "gradient" | "image" | "solid";
  value: string;
  customGradient?: CustomGradient;
  source?: "preset" | "screenshot" | "user-custom";  // NEW
};
```

2. **Filter gradients by source during look switch:**
```typescript
// components/look-selector.tsx
function preserveBackgroundForLook(newLookId: string, currentBackground: BackgroundConfig) {
  if (newLookId === "code-snippet" && currentBackground.source === "screenshot") {
    // Don't preserve screenshot-derived gradients for code look
    return getLookDefinition(newLookId).createConfig().background;
  }
  return currentBackground;
}
```

3. **Update gradient picker to set source:**
```typescript
// components/gradient-picker.tsx
function handleScreenshotSelect(gradient: CustomGradient) {
  onChangeAction({
    type: "gradient",
    value: "custom",
    customGradient: gradient,
    source: "screenshot",  // NEW
  });
}
```

**Pros:**
- Fine-grained control over gradient transfer
- Maintains backward compatibility
- Flexible for future features
- Clear gradient provenance

**Cons:**
- Requires updating many gradient-setting locations
- More state to manage
- Migration needed for existing configs

---

## Effort Estimation

### Strategy 1: Prevent Color Analysis (RECOMMENDED)

| Task | Files | Estimated Lines | Complexity |
|------|-------|----------------|------------|
| Add early return in color analysis | 1 | 5 | Low |
| Test with code-snippet look | - | - | Low |
| **TOTAL** | **1** | **~5** | **LOW** |

**Time Estimate:** 15-30 minutes

---

### Strategy 2: Look-Specific Config Isolation

| Task | Files | Estimated Lines | Complexity |
|------|-------|----------------|------------|
| Define discriminated union types | 1 | 30 | Medium |
| Update look definitions | 1 | 20 | Low |
| Modify look selector preservation logic | 1 | 25 | Medium |
| Update config atom initialization | 1 | 10 | Low |
| Update color analysis filtering | 1 | 10 | Low |
| Add type guards (isScreenshotLook, etc.) | 1 | 15 | Low |
| Update components reading config | 3-5 | 20 | Medium |
| Migration logic for existing configs | 1 | 25 | Medium |
| **TOTAL** | **8-10** | **~155** | **MEDIUM** |

**Time Estimate:** 3-5 hours

---

### Strategy 3: Gradient Source Tracking

| Task | Files | Estimated Lines | Complexity |
|------|-------|----------------|------------|
| Add source field to BackgroundConfig | 1 | 5 | Low |
| Update all gradient-setting locations | 4 | 40 | Medium |
| Add source-aware preservation logic | 2 | 30 | Medium |
| Update gradient picker to set source | 1 | 20 | Low |
| Update color analysis to set source | 1 | 10 | Low |
| Migration logic for existing configs | 1 | 20 | Medium |
| Add source display in UI (optional) | 1 | 15 | Low |
| **TOTAL** | **11** | **~140** | **MEDIUM-HIGH** |

**Time Estimate:** 4-6 hours

---

## Recommendations

### Immediate Action (15 min)

Implement **Strategy 1** to prevent unwanted gradient generation:

```typescript
// hooks/use-color-analysis.ts
if (config.lookId === "code-snippet") {
  return; // Skip color analysis
}
```

This provides immediate value with minimal risk.

---

### Future Enhancement (Optional)

Consider **Strategy 3** (Gradient Source Tracking) if:
- You add more non-screenshot looks in the future
- Users report confusion about gradient changes when switching looks
- You want to build features like "Apply screenshot colors" as an opt-in action

**When to implement:** After validating Strategy 1 works well, during a larger refactor.

---

### Not Recommended

**Strategy 2** (Look-Specific Config Isolation) is over-engineered for the current problem:
- Only 1 look (out of 4) doesn't use screenshots
- Significant refactoring for minimal benefit
- Could be considered if planning major look system expansion (6+ looks)

---

## Edge Cases & Considerations

### Edge Case 1: User Switches from Screenshot Look to Code Look

**Current Behavior:**
1. User uploads screenshot in "Peak" look
2. Gradient is auto-generated from screenshot colors
3. User switches to "Code" look
4. Screenshot gradient is preserved (via `look-selector.tsx:53`)

**Expected Behavior (after fix):**
- Option A: Code look reverts to random preset gradient
- Option B: Code look keeps the gradient but marks it as "user-selected"

**Recommendation:** Option A (revert to default) for cleaner UX.

---

### Edge Case 2: Code Look → Screenshot Look → Upload

**Current Behavior:**
1. User starts in "Code" look
2. Switches to "Peak" look
3. Uploads screenshot
4. Gradient is generated and applied ✅ (correct)

**Expected Behavior (after fix):**
- No change needed - color analysis should run normally for screenshot looks

---

### Edge Case 3: Multiple Screenshot Uploads

**Current Behavior:**
1. User uploads screenshot A → gradient applied
2. User uploads screenshot B → new gradient applied
3. Previous gradient is lost

**Question:** Should users be able to "lock" a gradient to prevent auto-updates?

**Recommendation:** Consider adding `background.locked` flag in future iteration.

---

## Testing Strategy

### Unit Tests Needed

1. **Color Analysis Skip Test:**
```typescript
test("should skip color analysis for code-snippet look", async () => {
  const config = { lookId: "code-snippet" };
  const asset = createMockScreenshot();

  await processColorAnalysis(asset);

  expect(config.background.customGradient).toBeUndefined();
});
```

2. **Screenshot Look Analysis Test:**
```typescript
test("should run color analysis for screenshot looks", async () => {
  const lookIds = ["popup-gradient", "hero-center", "adaptive-stage"];

  for (const lookId of lookIds) {
    const config = { lookId };
    const asset = createMockScreenshot();

    await processColorAnalysis(asset);

    expect(config.background.customGradient).toBeDefined();
  }
});
```

### Integration Tests

1. Upload screenshot in each look and verify gradient behavior
2. Switch between looks and verify gradient preservation logic
3. Test gradient picker visibility for each look

---

## Related Code Patterns

### Pattern 1: Look Capabilities Drive UI

The system already uses look capabilities to control UI:

```typescript
// components/layout-config.tsx:119-130
{config.lookId !== "code-snippet" && (
  <ScreenshotSection ... />
)}

// components/sidebar-sections/look-section.tsx:50-70
{lookDef.capabilities.text.headline !== "hidden" && (
  <HeadlineInput ... />
)}
```

**Recommendation:** Extend this pattern to color analysis:

```typescript
// hooks/use-color-analysis.ts
const lookDef = getLookDefinition(config.lookId);
if (!lookDef.capabilities.screenshot) {
  return; // Skip analysis
}
```

But wait - capabilities don't currently have a `screenshot` field. Consider adding:

```typescript
// domain/look/definitions.ts
type LookCapabilities = {
  // ... existing fields
  screenshot?: "required" | "optional" | "hidden";
};
```

---

### Pattern 2: Asset Filtering by Look

Currently, assets are global. Consider look-scoped asset access:

```typescript
// hooks/atoms/derived.ts
export const relevantAssetsAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  const lookDef = getLookDefinition(config.lookId);

  return assets.filter((asset) => {
    if (asset.kind === "screenshot" && lookDef.id === "code-snippet") {
      return false; // Hide screenshots for code look
    }
    return true;
  });
});
```

---

## Conclusion

### Current State Summary

- **3 of 4 looks** use screenshots (Peak, Spotlight, Backdrop)
- **1 of 4 looks** doesn't use screenshots (Code) but still receives screenshot-derived gradients
- **Partial decoupling exists** at UI level (gradient picker, layout config)
- **Complete decoupling missing** at data/orchestration level (color analysis, config state)

### Decoupling Effort: LOW

The minimal fix (Strategy 1) requires:
- **1 file change** (`hooks/use-color-analysis.ts`)
- **5 lines of code** (early return check)
- **15 minutes** implementation time
- **Low risk** (doesn't affect other looks)

### Next Steps

1. **Implement Strategy 1** (early return in color analysis) ✅
2. **Test** with code-snippet look to verify no gradient generation
3. **Monitor** user behavior with look switching
4. **Consider Strategy 3** (gradient source tracking) if issues arise

### Open Questions

1. Should code-snippet look **ever** support screenshot-derived gradients as an opt-in feature?
2. Should gradient preservation during look switching be **smarter** (category-aware)?
3. Should we add a **"lock gradient"** feature to prevent auto-updates?

---

## Appendix: File Reference Quick Links

### Core System Files
- Look definitions: `domain/look/definitions.ts`
- Look registry: `components/looks/registry.ts`
- Config types: `domain/layout/types.ts`
- State atoms: `hooks/atoms.ts`

### Gradient System
- Presets: `domain/layout/gradient-presets.ts`
- Generator: `domain/layout/gradients/generator.ts`
- Color analysis: `hooks/use-color-analysis.ts`
- Gradient picker: `components/gradient-picker.tsx`

### Screenshot System
- Upload handler: `hooks/use-file-upload.ts`
- Upload orchestrator: `domain/asset/upload-orchestrator.ts`
- Screenshot modes: `domain/layout/screenshot-mode.ts`

### Look Components
- Peak: `components/looks/PopupGradient.tsx`
- Spotlight: `components/looks/HeroCenter.tsx`
- Backdrop: `components/looks/AdaptiveScreenshot.tsx`
- Code: `components/looks/CodeSnippet.tsx`
- Shared primitives: `components/looks/shared/look-primitives.tsx`
