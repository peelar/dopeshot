# Implementation Plan: Color Source Abstraction for Brand Integration

## Overview

This plan restructures the background swatch generation system to accept colors from multiple sources (screenshots, brand profiles, manual input) without changing current behavior. The gradient generation pipeline is already source-agnostic; we're decoupling the **color input mechanism** from the screenshot upload flow.

**Goal:** Enable future brand color integration by making color sources pluggable while preserving exact current functionality.

## Implementation Approach

The research revealed that `enhanceColorPalette()` and `generateGradientOptions()` already accept any `ColorPalette` object—they don't care where colors come from. The coupling exists **upstream** in the upload flow where color analysis is hardcoded.

**Strategy:**
1. Create a `ColorSource` abstraction layer in the domain
2. Make `gradientSource` track detailed color origin (not just "screenshot"/"custom")
3. Extract gradient generation logic from upload flow into reusable hook
4. Update existing code to use new abstraction (behavior unchanged)
5. Add tracking for color source analytics

**Why this approach:**
- Minimal changes to existing gradient generation (already well-architected)
- Backward compatible with existing layouts
- Future brand integration requires only adding a new `ColorProvider`
- Clear separation of concerns (domain logic vs. upload orchestration)

---

## Phase 1: Domain Layer - Color Source Types

**Purpose:** Create the foundational abstraction layer for color sources.

### Changes Required

#### 1. Create Color Source Types
**File:** `domain/layout/gradients/color-source.ts` (new file)

```typescript
import type { ColorPalette } from "@/domain/asset/types";

/**
 * Identifies where gradient colors originated from.
 * - screenshot: Extracted from uploaded screenshot
 * - brand: From user's brand profile (future)
 * - manual: User-provided colors
 * - preset: From gradient presets
 */
export type ColorSourceType = "screenshot" | "brand" | "manual" | "preset";

/**
 * Detailed information about gradient color origin.
 * Replaces the simple GradientSource string type.
 */
export type ColorSourceInfo = {
  type: ColorSourceType;
  providerId?: string; // assetId for screenshot, brandId for brand
  originalColors?: ColorPalette; // Raw color inputs before enhancement
};

/**
 * Normalized color source with metadata.
 * Used to pass colors to gradient generation pipeline.
 */
export interface ColorSource {
  type: ColorSourceType;
  providerId?: string;
  colors: ColorPalette;
}

/**
 * Abstract interface for color extraction from different sources.
 * Future implementations: BrandColorProvider, ManualColorProvider
 */
export interface ColorProvider {
  extractColors(): Promise<ColorPalette>;
}

/**
 * Extracts colors from screenshot assets.
 * Wraps existing analyzeColors() function.
 */
export class ScreenshotColorProvider implements ColorProvider {
  constructor(private assetUrl: string) {}

  async extractColors(): Promise<ColorPalette> {
    const { analyzeColors } = await import("@/domain/asset/analyze-colors");
    return analyzeColors(this.assetUrl);
  }
}

/**
 * Helper to create a ColorSource from a screenshot asset.
 */
export function createScreenshotColorSource(
  assetId: string,
  colors: ColorPalette
): ColorSource {
  return {
    type: "screenshot",
    providerId: assetId,
    colors,
  };
}

/**
 * Helper to create ColorSourceInfo for BackgroundConfig.
 */
export function createColorSourceInfo(source: ColorSource): ColorSourceInfo {
  return {
    type: source.type,
    providerId: source.providerId,
    originalColors: source.colors,
  };
}
```

**Rationale:** Pure domain types with no React dependencies. Future brand integration only requires adding `BrandColorProvider` class.

#### 2. Update BackgroundConfig Type
**File:** `domain/layout/types.ts`

**Current (line 68-78):**
```typescript
export type GradientSource = "preset" | "screenshot" | "custom";

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, or ColorToken
  customGradient?: CustomGradient;
  gradientSource?: GradientSource; // 🔴 Simple string
  grainEnabled?: boolean;
  patternId?: PatternChoice;
  patternMode?: PatternMode;
};
```

**New:**
```typescript
// Import from new color-source module
export type { ColorSourceInfo, ColorSourceType } from "./gradients/color-source";

// Keep legacy type for backward compatibility
export type GradientSource = "preset" | "screenshot" | "custom";

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, or ColorToken
  customGradient?: CustomGradient;

  // Union type: accepts both string (legacy) and detailed info (new)
  gradientSource?: GradientSource | ColorSourceInfo;

  grainEnabled?: boolean;
  patternId?: PatternChoice;
  patternMode?: PatternMode;
};
```

**Rationale:** Backward compatible—existing string values still work. New code can use `ColorSourceInfo` for detailed tracking.

#### 3. Add Type Guard Utilities
**File:** `domain/layout/gradients/color-source.ts` (append to file)

```typescript
/**
 * Type guard to check if gradientSource is detailed ColorSourceInfo.
 */
export function isColorSourceInfo(
  source: GradientSource | ColorSourceInfo | undefined
): source is ColorSourceInfo {
  return typeof source === "object" && "type" in source;
}

/**
 * Normalizes gradientSource to ColorSourceInfo format.
 * Handles both legacy strings and new objects.
 */
export function normalizeGradientSource(
  source: GradientSource | ColorSourceInfo | undefined
): ColorSourceInfo | undefined {
  if (!source) return undefined;

  if (isColorSourceInfo(source)) {
    return source;
  }

  // Convert legacy string to ColorSourceInfo
  return { type: source as ColorSourceType };
}

/**
 * Extracts the color source type from gradientSource.
 */
export function getColorSourceType(
  source: GradientSource | ColorSourceInfo | undefined
): ColorSourceType | undefined {
  const normalized = normalizeGradientSource(source);
  return normalized?.type;
}
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] `color-source.ts` exports all types and utilities
- [ ] `BackgroundConfig.gradientSource` accepts both string and object
- [ ] Type guards correctly identify `ColorSourceInfo` objects
- [ ] No breaking changes to existing type imports

---

## Phase 2: Hook Layer - Gradient Generation Hook

**Purpose:** Extract gradient generation logic from upload flow into reusable hook.

### Changes Required

#### 1. Create Gradient Generation Hook
**File:** `hooks/use-gradient-generation.ts` (new file)

```typescript
import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { configAtom, screenshotGradientAtom, statusMessageAtom } from "./atoms";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { applyPreferredAngle, getGradientColorsForContrast } from "@/domain/layout/gradient-application";
import type { ColorSource } from "@/domain/layout/gradients/color-source";
import { createColorSourceInfo } from "@/domain/layout/gradients/color-source";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { track } from "@/lib/analytics";

export interface UseGradientGenerationOptions {
  gradientPreferences: GradientPreferences;
}

export function useGradientGeneration({ gradientPreferences }: UseGradientGenerationOptions) {
  const setConfig = useSetAtom(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  /**
   * Generates gradients from any color source and applies to config.
   * Respects user's manual background choices.
   */
  const generateFromColorSource = useCallback(
    async (source: ColorSource, options?: { autoLayoutMessage?: string | null }) => {
      const { autoLayoutMessage } = options ?? {};

      // Track color source analytics
      track("gradient_generated", {
        colorSourceType: source.type,
        hasProviderId: !!source.providerId,
      });

      // Generate 4 gradient options from color palette
      const gradientOptions = generateGradientOptions(source.colors, {
        aspectCategory: "landscape",
        variant: undefined,
      });

      if (gradientOptions.length === 0) {
        console.warn("No gradient options generated from color source", source);
        return;
      }

      // Randomly select one gradient
      const randomIndex = Math.floor(Math.random() * gradientOptions.length);
      const selectedGradient = gradientOptions[randomIndex];

      // Apply user's preferred angle
      const finalGradient = applyPreferredAngle(selectedGradient, gradientPreferences.angle);

      // Calculate contrast text color
      const textColor = getContrastTextColor(getGradientColorsForContrast(finalGradient));

      let appliedGradient = false;

      setConfig((currentConfig) => {
        // Respect any manual background choice made during generation
        const userSelectedPreset =
          currentConfig.background?.type === "gradient" &&
          currentConfig.background.customGradient === undefined &&
          currentConfig.background.value !== "custom";
        const userHasCustomGradient = currentConfig.background?.customGradient !== undefined;
        const hasImageBackground = currentConfig.background?.type === "image";

        if (userSelectedPreset || userHasCustomGradient || hasImageBackground) {
          return currentConfig;
        }

        appliedGradient = true;

        // Create detailed gradient source info
        const sourceInfo = createColorSourceInfo(source);

        const generatedBackground = {
          ...(currentConfig.background ?? { type: "gradient", value: "custom" }),
          type: "gradient" as const,
          value: "custom",
          customGradient: finalGradient,
          gradientSource: sourceInfo, // 🎯 Detailed tracking
          grainEnabled: currentConfig.background?.grainEnabled ?? true,
          patternId: currentConfig.background?.patternId,
          patternMode: currentConfig.background?.patternMode,
        };

        // Store screenshot gradient separately for layout persistence
        if (source.type === "screenshot") {
          setScreenshotGradient(generatedBackground);
        }

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: generatedBackground,
        };
      });

      if (appliedGradient) {
        const gradientMessage = autoLayoutMessage
          ? `${autoLayoutMessage} Gradient applied based on your ${source.type} colors.`
          : `Gradient applied based on your ${source.type} colors.`;
        setStatusMessage(gradientMessage);
      }
    },
    [setConfig, setScreenshotGradient, setStatusMessage, gradientPreferences]
  );

  return {
    generateFromColorSource,
  };
}
```

**Rationale:**
- Source-agnostic gradient generation
- Preserves all existing behavior (random selection, user override respect, grain preservation)
- Adds detailed tracking via `ColorSourceInfo`
- Reusable for screenshot, brand, or manual color sources

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Hook exports `generateFromColorSource` function
- [ ] Accepts any `ColorSource` object
- [ ] Generates 4 gradients and randomly selects one
- [ ] Respects user's manual background choices
- [ ] Preserves grain/pattern settings
- [ ] Tracks analytics with source type

---

## Phase 3: Refactor Existing Color Analysis

**Purpose:** Update `use-color-analysis.ts` to use new abstraction while preserving behavior.

### Changes Required

#### 1. Refactor Color Analysis Hook
**File:** `hooks/use-color-analysis.ts`

**Current structure (lines 30-114):** Directly generates gradients inline.

**New structure:**
```typescript
import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ColorPalette } from "@/domain/asset/types";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { createScreenshotColorSource } from "@/domain/layout/gradients/color-source";
import { supportsScreenshots } from "@/domain/layout-def/definitions";
import type { GradientPreferences } from "@/domain/gradient-generation";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isAnalyzingColorsAtom
} from "./atoms";
import { useGradientGeneration } from "./use-gradient-generation"; // 🎯 New hook

export interface UseColorAnalysisOptions {
  gradientPreferences: GradientPreferences;
}

export function useColorAnalysis({ gradientPreferences }: UseColorAnalysisOptions) {
  const [isAnalyzingColors, setIsAnalyzingColors] = useAtom(isAnalyzingColorsAtom);
  const [config] = useAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  // 🎯 Use new gradient generation hook
  const { generateFromColorSource } = useGradientGeneration({ gradientPreferences });

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, autoLayoutMessage: string | null) => {
      // EARLY RETURN: Skip color analysis for looks that don't support screenshots
      if (!supportsScreenshots(config.layoutId)) {
        console.log(`Skipping color analysis for ${config.layoutId} - look does not support screenshots`);
        return;
      }

      setIsAnalyzingColors(true);
      setStatusMessage("Analyzing colors from screenshot...");

      try {
        const colorPalette = await analyzeColors(dataUrl);

        if (colorPalette) {
          // Store color palette in asset
          setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));

          // 🎯 Create color source and generate gradients
          const colorSource = createScreenshotColorSource(assetId, colorPalette);
          await generateFromColorSource(colorSource, { autoLayoutMessage });
        }
      } finally {
        setIsAnalyzingColors(false);
      }
    },
    [
      analyzeColors,
      config.layoutId,
      setAssets,
      setStatusMessage,
      setIsAnalyzingColors,
      generateFromColorSource,
    ],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors,
  };
}
```

**Changes:**
- Import `useGradientGeneration` hook
- Replace inline gradient generation (lines 48-110) with `generateFromColorSource()`
- Use `createScreenshotColorSource()` helper
- Remove direct imports of `generateGradientOptions`, `applyPreferredAngle`, etc.
- Preserve exact same behavior: color extraction → gradient generation → config update

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Screenshot upload still triggers color analysis
- [ ] 4 gradients generated and one randomly selected
- [ ] Gradient applied to background with correct source tracking
- [ ] Color palette still stored in asset
- [ ] Status messages display correctly
- [ ] Respects manual background changes during analysis

---

## Phase 4: Update Gradient Picker for Source Tracking

**Purpose:** Display color source information in gradient picker UI (optional enhancement).

### Changes Required

#### 1. Add Source Info Display
**File:** `components/gradient-picker.tsx`

**Current:** No display of color source origin.

**Enhancement (optional):**
Add a small badge/label showing where colors came from when viewing screenshot gradients.

```typescript
// Around line 394-439 in ScreenshotGradients component
import { getColorSourceType } from "@/domain/layout/gradients/color-source";

function ScreenshotGradients({ ... }: ScreenshotGradientsProps) {
  const config = useAtomValue(configAtom);
  const sourceType = getColorSourceType(config.background.gradientSource);

  return (
    <div className="space-y-3">
      {/* Optional: Display source badge */}
      {sourceType && (
        <div className="text-xs text-slate-500">
          Colors from {sourceType}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {dynamicGradients.map((gradient, index) => (
          <GradientSwatch
            key={index}
            gradient={gradient}
            isSelected={isSelected(gradient)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
```

**Rationale:** Future-proof for displaying "Colors from brand" when brand integration is added. Currently just shows "screenshot".

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] Gradient picker still displays 4 screenshot swatches
- [ ] Selection still works correctly
- [ ] (If badge added) Source type displays correctly
- [ ] No visual regressions

---

## Phase 5: Add Analytics Tracking

**Purpose:** Track color source usage for future feature validation.

### Changes Required

#### 1. Add Tracking Events
**File:** `hooks/use-gradient-generation.ts`

Already added in Phase 2:
```typescript
track("gradient_generated", {
  colorSourceType: source.type,
  hasProviderId: !!source.providerId,
});
```

#### 2. Add Tracking to Manual Color Changes
**File:** `components/gradient-picker.tsx`

Around line 449-487 in `CustomGradientControls`:

```typescript
import { track } from "@/lib/analytics";

// When user manually customizes colors
const handleColorChange = (stop: "start" | "mid" | "end", color: string) => {
  track("gradient_customized", {
    stop,
    source: "manual",
  });
  // ... existing logic
};
```

#### 3. Track Source Switching
**File:** `components/gradient-picker.tsx`

Around line 152-186 when activeSource changes:

```typescript
const handleSourceChange = (newSource: GradientSource) => {
  track("gradient_source_changed", {
    from: activeSource,
    to: newSource,
  });
  setActiveSource(newSource);
};
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`

#### Manual Verification
- [ ] `gradient_generated` event fires with `colorSourceType: "screenshot"`
- [ ] `gradient_customized` event fires when user changes colors manually
- [ ] `gradient_source_changed` event fires when switching tabs
- [ ] Events include relevant properties

---

## Phase 6: Testing & Validation

**Purpose:** Ensure refactoring preserves exact current behavior.

### Changes Required

#### 1. Manual Testing Checklist

**Screenshot Upload Flow:**
- [ ] Upload screenshot → colors extracted
- [ ] 4 gradient swatches generated
- [ ] One gradient randomly selected and applied
- [ ] Text color automatically adjusted for contrast
- [ ] Grain setting preserved
- [ ] Pattern setting preserved
- [ ] Status message displays "Gradient applied based on your screenshot colors"

**User Overrides:**
- [ ] If user selects preset gradient during analysis → preset is kept
- [ ] If user uploads background image during analysis → image is kept
- [ ] If user customizes gradient during analysis → custom gradient is kept

**Layout Switching:**
- [ ] Screenshot gradient persists when switching between layouts
- [ ] Code snippet layouts skip color analysis correctly
- [ ] Gradient picker shows screenshot tab only for screenshot-supporting layouts

**Gradient Picker:**
- [ ] Screenshot tab displays 4 gradients
- [ ] Custom tab allows manual color input
- [ ] Preset tab shows preset gradients
- [ ] Selecting gradient updates background immediately
- [ ] Text color updates automatically

**State Persistence:**
- [ ] Screenshot gradient cached in `screenshotGradientAtom`
- [ ] Asset stores `colorPalette` after analysis
- [ ] Background config includes `gradientSource` info

#### 2. Type Safety Validation
- [ ] No TypeScript errors in any file
- [ ] `gradientSource` accepts both string and `ColorSourceInfo`
- [ ] Type guards work correctly
- [ ] All imports resolve correctly

#### 3. Backward Compatibility
- [ ] Existing layouts with `gradientSource: "screenshot"` still work
- [ ] Type narrowing handles both string and object types
- [ ] No breaking changes to public APIs

### Success Criteria

#### Automated Verification
- [ ] Build passes: `pnpm run build`
- [ ] Types check: `pnpm typecheck`
- [ ] All tests pass (if tests exist): `pnpm test:domain` and `pnpm test:ui`

#### Manual Verification
- [ ] All manual testing checklist items pass
- [ ] No console errors during normal usage
- [ ] No visual regressions
- [ ] Performance is unchanged

---

## Phase 7: Documentation

**Purpose:** Document the new color source abstraction for future brand integration.

### Changes Required

#### 1. Add Architecture Documentation
**File:** `domain/layout/gradients/README.md` (new file)

```markdown
# Gradient Generation System

## Overview

The gradient generation system creates 4 background gradient variations from color palettes. Colors can come from multiple sources: screenshots, brand profiles, manual input, or presets.

## Architecture

### Color Source Abstraction

All color inputs go through the `ColorSource` interface:

\`\`\`typescript
interface ColorSource {
  type: "screenshot" | "brand" | "manual" | "preset";
  providerId?: string;  // assetId or brandId
  colors: ColorPalette;
}
\`\`\`

### Flow

1. **Color Extraction**: Provider extracts colors (e.g., `ScreenshotColorProvider`)
2. **Color Enhancement**: `enhanceColorPalette()` transforms raw colors
3. **Gradient Generation**: `generateGradientOptions()` creates 4 variations
4. **Gradient Selection**: Random selection or user choice
5. **Config Update**: `useGradientGeneration()` applies to layout

### Key Files

- `color-source.ts`: Color source types and providers
- `colors.ts`: Color enhancement and analysis
- `generator.ts`: Gradient generation algorithms
- `hooks/use-gradient-generation.ts`: React integration

## Usage

### Generating from Screenshots

\`\`\`typescript
import { createScreenshotColorSource } from "@/domain/layout/gradients/color-source";
import { useGradientGeneration } from "@/hooks/use-gradient-generation";

const { generateFromColorSource } = useGradientGeneration({ gradientPreferences });

const colorPalette = await analyzeColors(screenshotUrl);
const colorSource = createScreenshotColorSource(assetId, colorPalette);
await generateFromColorSource(colorSource);
\`\`\`

### Adding New Color Sources

1. Create a `ColorProvider` implementation:

\`\`\`typescript
export class BrandColorProvider implements ColorProvider {
  constructor(private brandProfile: BrandProfile) {}

  async extractColors(): Promise<ColorPalette> {
    return {
      dominant: this.brandProfile.primaryColor,
      accent: this.brandProfile.accentColor,
      vibrant: this.brandProfile.secondaryColor,
      muted: this.brandProfile.neutralColor,
    };
  }
}
\`\`\`

2. Use with `generateFromColorSource()`:

\`\`\`typescript
const provider = new BrandColorProvider(brandProfile);
const colors = await provider.extractColors();
const colorSource: ColorSource = {
  type: "brand",
  providerId: brandProfile.id,
  colors,
};
await generateFromColorSource(colorSource);
\`\`\`

## Color Source Tracking

Background config stores detailed source information:

\`\`\`typescript
background: {
  type: "gradient",
  customGradient: { ... },
  gradientSource: {
    type: "screenshot",
    providerId: "asset-123",
    originalColors: { dominant: "#...", accent: "#..." },
  },
}
\`\`\`

This enables:
- Analytics on color source usage
- Regeneration from original colors
- Display of color source in UI
- Future brand integration
```

#### 2. Update Main README
**File:** `README.md`

Add section about color source abstraction architecture (if relevant to project README).

### Success Criteria

#### Automated Verification
- [ ] Documentation renders correctly in markdown preview

#### Manual Verification
- [ ] Architecture is clearly explained
- [ ] Usage examples are accurate
- [ ] Future brand integration path is documented
- [ ] Code examples are correct

---

## Rollback Plan

If issues arise, revert in reverse order:

1. **Revert `use-color-analysis.ts`** to inline gradient generation
2. **Remove `use-gradient-generation.ts`** hook
3. **Revert `BackgroundConfig.gradientSource`** to simple string type
4. **Remove `color-source.ts`** domain types

All changes are additive and backward compatible, so partial rollback is safe.

### Rollback Commands

```bash
# Revert specific files
git checkout HEAD~1 hooks/use-color-analysis.ts
git checkout HEAD~1 domain/layout/types.ts

# Remove new files
rm hooks/use-gradient-generation.ts
rm domain/layout/gradients/color-source.ts
rm domain/layout/gradients/README.md
```

---

## Future Work (Not in This Plan)

After this abstraction is complete, brand integration can be added by:

1. Creating `BrandColorProvider` class
2. Adding brand profile UI
3. Calling `generateFromColorSource()` with brand colors
4. No changes needed to gradient generation pipeline

**Example:**
```typescript
const brandSource: ColorSource = {
  type: "brand",
  providerId: user.brandProfile.id,
  colors: {
    dominant: user.brandProfile.primaryColor,
    accent: user.brandProfile.accentColor,
    vibrant: user.brandProfile.secondaryColor,
    muted: user.brandProfile.neutralColor,
  },
};

await generateFromColorSource(brandSource);
```

---

## Summary

This plan:
- ✅ Preserves 100% of current screenshot behavior
- ✅ Makes color sources pluggable for future brand integration
- ✅ Adds no new UI (architectural prep only)
- ✅ Includes backward compatibility for existing layouts
- ✅ Adds analytics tracking for validation
- ✅ Documents architecture for future developers

**Impact:** Zero user-visible changes. Pure internal architecture improvement.

**Next Prompt:** After this is implemented, brand integration can be added by creating a `BrandColorProvider` and UI for brand profiles—no refactoring needed.
