# Research: Background Swatch Generation Architecture

**Date:** 2024-12-16
**Purpose:** Understand current background swatch generation system to prepare for brand integration abstraction
**Status:** Complete

---

## Executive Summary

The dopeshot background swatch system extracts colors from uploaded screenshots using K-means clustering, generates 4 gradient variations using different color harmony strategies, randomly selects one as default, and allows users to pick or customize. The system is currently **tightly coupled to screenshot uploads** with color extraction hardcoded in the file upload flow. To support future brand color sources, we need to abstract the color input mechanism while preserving current behavior.

---

## Current Architecture

### Color Extraction Flow

```
Screenshot Upload
    ↓
[use-file-upload.ts] processFileUpload()
    ├→ Create Asset with URL
    ├→ Store in assetsAtom
    └→ Trigger processColorAnalysis()
        ↓
[use-color-analysis.ts] analyzeImageColors()
    └→ [analyze-colors.ts] analyzeColors() (node-vibrant)
        ↓
    ColorPalette { dominant, accent, vibrant?, muted? }
        ↓
    Store in asset.colorPalette
        ↓
[enhanceColorPalette()] Transform to EnhancedColorPalette
    └→ { hero, base, accent, isNeutral, isDark, saturation }
        ↓
[generateGradientOptions()] Create 4 gradient variations
    ├→ multi-color strategy
    ├→ complementary strategy
    ├→ analogous strategy
    └→ triadic strategy
        ↓
    CustomGradient[] (4 gradients, each with 3 stops)
        ↓
    Random selection → screenshotGradientAtom
        ↓
    Update configAtom.background
        ↓
[gradient-picker.tsx] Display 4 swatches, auto-select first
```

---

## Key Files & Locations

### 1. Color Extraction

| File | Lines | Purpose |
|------|-------|---------|
| `domain/gradient-generation/color-extraction.ts` | 57-154 | **extractPaletteFromImage()** - K-means clustering in LAB space |
| | 156-196 | **samplePixels()** - Smart pixel sampling with alpha weighting |
| | 215-278 | **runKMeans()** - Clustering algorithm (3-6 clusters) |
| | 311-361 | **classifyClusters()** - Categorize as accent/base colors |
| `domain/asset/analyze-colors.ts` | 11-49 | **analyzeColors()** - Simple extraction using node-vibrant |

**Current Usage:** The simpler `analyzeColors()` is used in production (use-color-analysis.ts:27). The advanced `extractPaletteFromImage()` is available but not actively used.

---

### 2. Gradient Generation

| File | Lines | Purpose |
|------|-------|---------|
| `domain/layout/gradients/generator.ts` | 306-327 | **generateGradientOptions()** - Creates 4 variations |
| | 24-60 | **generateGradient()** - Individual gradient with geometry |
| | 128-161 | **generateGradientStops()** - Creates 3-stop structure |
| | 66-110 | **getGradientGeometry()** - Aspect-based type/angle |
| `domain/layout/gradients/colors.ts` | 133-193 | **enhanceColorPalette()** - Transforms raw colors |
| | 46-79 | **enhanceColor()** - OKLCH color adjustments |

**Key Logic:**
- 4 strategies: multi-color, complementary, analogous, triadic (lines 311-316)
- Each gradient has 3 stops: start (0%), mid (50%), end (100%)
- Geometry varies by aspect: portrait/landscape use 135° linear, square uses radial
- Colors processed in OKLCH space for perceptual uniformity

---

### 3. State Management

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/atoms.ts` | 36 | **configAtom** - Main layout config including background |
| | 37 | **assetsAtom** - All uploaded assets with colorPalette |
| | 42 | **screenshotGradientAtom** - Cached screenshot gradient |
| `hooks/atoms/derived.ts` | 41-46 | **screenshotAssetAtom** - Derives screenshot from config |
| | 48-55 | **backgroundAssetAtom** - Derives background asset |

**Pattern:** Central `configAtom` holds all state. Derived atoms compute specific values. Updates use setter function pattern:
```typescript
setConfig((currentConfig) => ({ ...currentConfig, ...changes }))
```

---

### 4. UI Components

| File | Lines | Purpose |
|------|-------|---------|
| `components/gradient-picker.tsx` | 152-186 | **defaultSource** - Determines initial tab (preset/screenshot/custom) |
| | 213-238 | **Initial gradient display** - Auto-selects first screenshot gradient |
| | 394-439 | **ScreenshotGradients()** - Displays 4 swatches in grid |
| | 523-541 | **GradientSwatch()** - Individual swatch button |
| | 449-487 | **CustomGradientControls()** - 3 color inputs + angle slider |
| `components/sidebar-sections/background-section.tsx` | 92-104 | **handleGradientChange()** - Updates config with background |

---

### 5. Color Analysis Hook

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/use-color-analysis.ts` | 30-114 | **processColorAnalysis()** - Orchestrates color extraction |
| | 48-53 | Generates gradient options from enhanced palette |
| | 56-57 | **Random selection**: `Math.floor(Math.random() * 4)` |
| | 80-101 | Updates configAtom with screenshot gradient |

---

## Data Models

### BackgroundConfig
```typescript
type BackgroundConfig = {
  type: "gradient" | "image" | "solid";
  value: string;  // gradientId, assetId, or ColorToken
  customGradient?: CustomGradient;
  gradientSource?: "preset" | "screenshot" | "custom";  // 🎯 Key extension point
  grainEnabled?: boolean;
  patternId?: PatternChoice;
  patternMode?: PatternMode;
};
```

### AdvancedGradient
```typescript
type AdvancedGradient = {
  type: "linear" | "radial" | "conic";
  stops: GradientStop[];  // 3 stops
  direction?: string;
  colorSpace?: "oklch" | "srgb" | "lab";
  angle?: number;
};

type GradientStop = {
  color: string;      // hex
  position?: number;  // 0-100
};
```

### ColorPalette (Simple)
```typescript
type ColorPalette = {
  dominant: string;
  accent: string;
  vibrant?: string;
  muted?: string;
};
```

### EnhancedColorPalette
```typescript
type EnhancedColorPalette = {
  hero: string;      // Primary accent
  base: string;      // Background tone
  accent: string;    // Secondary accent
  dominant: string;
  vibrant?: string;
  muted?: string;
  isNeutral: boolean;
  isDark: boolean;
  saturation: number;
};
```

---

## Current Coupling Points

### 🔴 HIGH COUPLING

1. **Upload-to-Gradient Pipeline**
   - Location: `hooks/use-file-upload.ts:140-146`
   - Issue: Color analysis hardcoded in file upload hook
   - Impact: No way to provide colors from other sources

2. **Screenshot-Specific Logic**
   - Location: `hooks/use-color-analysis.ts:32-36`
   - Issue: Layout checks prevent non-screenshot color generation
   - Impact: GradientPicker excludes screenshot tab for code snippets

3. **Asset-Centric Storage**
   - Location: `domain/asset/types.ts`, `hooks/atoms.ts`
   - Issue: Colors stored in `asset.colorPalette` field
   - Impact: Requires Asset object to exist for color access

### 🟡 MEDIUM COUPLING

4. **Single Color Extraction Method**
   - Location: `use-color-analysis.ts:27`
   - Issue: Only calls `analyzeColors()` from node-vibrant
   - Impact: Advanced extraction available but unused

5. **Source Tracking is Basic**
   - Location: `BackgroundConfig.gradientSource`
   - Current: `"preset" | "screenshot" | "custom"`
   - Issue: Doesn't distinguish color origin vs gradient customization

---

## Abstraction Strategy

### Principle: Decouple Color Input from Color Source

The key insight is that gradient generation should accept **normalized color inputs** rather than assuming they came from screenshots.

### Proposed Abstraction Layers

```
┌─────────────────────────────────────────┐
│       Color Source Providers            │
│  (Screenshot | Brand | Manual | API)    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    Normalized Color Input Interface     │
│         ColorPalette or hex[]           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      enhanceColorPalette()              │
│   (Already source-agnostic!)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    generateGradientOptions()            │
│   (Already source-agnostic!)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         CustomGradient[]                │
└─────────────────────────────────────────┘
```

**Good News:** The gradient generation pipeline (`enhanceColorPalette` → `generateGradientOptions`) is **already decoupled** from color sources! It just accepts a `ColorPalette` object.

**Problem:** The color source is hardcoded upstream in the upload flow.

---

## Recommended Refactoring

### Phase 1: Extract Color Provider Interface

Create a new abstraction in `domain/layout/gradients/`:

```typescript
// domain/layout/gradients/color-source.ts

export type ColorSourceType = "screenshot" | "brand" | "manual" | "preset";

export interface ColorSource {
  type: ColorSourceType;
  providerId?: string;  // e.g., assetId, brandId
  colors: ColorPalette;
}

export interface ColorProvider {
  extractColors(): Promise<ColorPalette>;
}

export class ScreenshotColorProvider implements ColorProvider {
  constructor(private assetUrl: string) {}
  async extractColors(): Promise<ColorPalette> {
    return analyzeColors(this.assetUrl);
  }
}

// Future: BrandColorProvider, ManualColorProvider
```

### Phase 2: Update BackgroundConfig

Extend `gradientSource` to track detailed origin:

```typescript
type BackgroundConfig = {
  type: "gradient" | "image" | "solid";
  value: string;
  customGradient?: CustomGradient;
  gradientSource?: GradientSourceInfo;  // 🔄 Replace simple string
  // ... rest
};

type GradientSourceInfo = {
  type: "preset" | "screenshot" | "custom" | "brand";
  providerId?: string;  // assetId for screenshot, brandId for brand
  originalColors?: ColorPalette;  // Store raw input colors
};
```

### Phase 3: Refactor Color Analysis Hook

Decouple from screenshot upload:

```typescript
// hooks/use-gradient-generation.ts (new file)

export function useGradientGeneration() {
  const setConfig = useSetAtom(configAtom);

  const generateFromColorSource = useCallback(
    async (source: ColorSource) => {
      track("gradient_generated", { source: source.type });

      const enhanced = enhanceColorPalette(source.colors);
      const options = generateGradientOptions(enhanced, context);
      const selected = options[Math.floor(Math.random() * options.length)];

      setConfig((current) => ({
        ...current,
        background: {
          ...current.background,
          type: "gradient",
          value: "custom",
          customGradient: selected,
          gradientSource: {
            type: source.type,
            providerId: source.providerId,
            originalColors: source.colors,
          },
        },
      }));
    },
    [setConfig]
  );

  return { generateFromColorSource };
}
```

### Phase 4: Update Upload Flow

```typescript
// hooks/use-file-upload.ts

const { generateFromColorSource } = useGradientGeneration();

// After upload:
const colorSource: ColorSource = {
  type: "screenshot",
  providerId: asset.id,
  colors: await analyzeColors(asset.url),
};

await generateFromColorSource(colorSource);
```

---

## Future Brand Integration

With this abstraction, adding brand colors becomes straightforward:

```typescript
// Future implementation
const brandColorSource: ColorSource = {
  type: "brand",
  providerId: user.brandProfile.id,
  colors: {
    dominant: user.brandProfile.primaryColor,
    accent: user.brandProfile.accentColor,
    vibrant: user.brandProfile.secondaryColor,
    muted: user.brandProfile.neutralColor,
  },
};

await generateFromColorSource(brandColorSource);
```

**No changes needed to:**
- `enhanceColorPalette()` - already accepts any `ColorPalette`
- `generateGradientOptions()` - already accepts any `EnhancedColorPalette`
- `gradient-picker.tsx` - already displays any `CustomGradient[]`

---

## Critical Patterns to Follow

Based on codebase analysis:

1. **Use Jotai atoms for state** - Don't prop drill, use derived atoms
2. **Keep domain logic pure** - Color/gradient utilities should be framework-agnostic
3. **Track all user interactions** - Use `track()` for analytics
4. **OKLCH color space** - Already used for perceptual accuracy
5. **3-stop gradients** - Standard structure throughout
6. **Deep merge config updates** - Use setter functions with spread operators
7. **Preserve grain/pattern settings** - When updating background, keep existing overlays

---

## Risks & Considerations

### Backward Compatibility
- Existing layouts store `gradientSource: "screenshot"` as string
- Migration needed if changing to object structure
- **Mitigation:** Make `GradientSourceInfo` accept both string and object

### Performance
- Color extraction is async and can be slow
- Current caching: API route caches 24 entries (app/api/generate-gradient/route.ts:18)
- **Recommendation:** Add color source caching at domain level

### State Complexity
- Adding color source atoms increases state surface area
- **Mitigation:** Use derived atoms to compute color source from config

---

## Next Steps

1. ✅ Research complete - Documented architecture
2. ⏭️ Create color source abstraction types
3. ⏭️ Extract color provider interface
4. ⏭️ Refactor gradient generation hook
5. ⏭️ Update background config structure
6. ⏭️ Test with existing screenshot flow
7. ⏭️ Add tracking events for new abstraction

---

## Code References

All references use `file_path:line_number` format:

- Color extraction: `domain/gradient-generation/color-extraction.ts:57-154`
- Gradient generation: `domain/layout/gradients/generator.ts:306-327`
- Color analysis hook: `hooks/use-color-analysis.ts:30-114`
- Gradient picker UI: `components/gradient-picker.tsx:394-439`
- Background config: `domain/layout/types.ts:144-153`
- State atoms: `hooks/atoms.ts:36-42`

---

## Conclusion

The current architecture is **well-structured** with clean separation between color extraction, gradient generation, and UI rendering. The main coupling point is the hardcoded screenshot upload → color analysis flow. By introducing a `ColorSource` abstraction, we can preserve existing behavior while enabling brand colors, manual input, and other future sources without rewriting the gradient generation pipeline.

**Key Insight:** The gradient generation logic is already source-agnostic. We just need to abstract how colors enter the system.
