# Layout Gradients

## Purpose

Defines gradient data models and CSS generation utilities. This is the **data/model layer** for gradients used in layouts - it does NOT contain gradient generation/extraction logic (that's in `domain/gradient-generation`). Provides type definitions, CSS conversion, and color utilities.

## File Structure

- `types.ts` - Gradient type definitions (GradientStop, AdvancedGradient, LegacyGradient, CustomGradient)
- `utils.ts` - CSS gradient generation, type guards, and gradient conversions
- `colors.ts` - Color utilities and transformations
- `generator.ts` - Gradient manipulation and transformation functions
- `color-source.ts` - Color source abstraction, providers, and utilities (new)
- `index.ts` - Public API exports

## Key Exports

### Gradient Types
- `CustomGradient` - Union type of AdvancedGradient (multi-stop) and LegacyGradient (2-color)
- `AdvancedGradient` - Multi-stop gradient with type, stops, direction, colorSpace, angle
- `LegacyGradient` - Simple 2-color gradient with from/to colors and direction
- `GradientStop` - Color stop with position (0-100% or 0-1)
- `GradientType` - "linear" | "radial" | "conic"
- `GradientColorSpace` - "oklch" | "srgb" | "lab" for interpolation

### Color Source Types (New)
- `ColorSource` - Normalized color source with type, providerId, and colors
- `ColorSourceInfo` - Detailed gradient color origin for BackgroundConfig
- `ColorSourceType` - "screenshot" | "brand" | "manual" | "preset"
- `ColorProvider` - Interface for extracting colors from different sources
- `ScreenshotColorProvider` - Provider implementation for screenshot color extraction

### Utilities
- `toCSSGradient(gradient)` - Converts gradient objects to CSS strings
- `isAdvancedGradient(gradient)` - Type guard for AdvancedGradient
- `createScreenshotColorSource(assetId, colors)` - Helper to create screenshot color source
- `createColorSourceInfo(source)` - Helper to create ColorSourceInfo for config
- `isColorSourceInfo(source)` - Type guard for ColorSourceInfo
- `normalizeGradientSource(source)` - Normalizes legacy string or new ColorSourceInfo
- `getColorSourceType(source)` - Extracts color source type

## Dependencies

- Imports from: `domain/asset/types` (ColorPalette), `domain/asset/analyze-colors` (for ScreenshotColorProvider)
- Used by: `domain/layout` (parent module), `hooks/use-gradient-generation` (React integration)
- External: Uses culori for color manipulation

## How It Works

**Gradient Types**:
- `AdvancedGradient`: Multi-stop (3+ colors), custom angles, color space control
- `LegacyGradient`: Simple 2-color gradients for backward compatibility
- `CustomGradient`: Union type supporting both formats

**CSS Generation**:
1. Gradient object → `toCSSGradient()` function
2. Converts stops, angles, directions to CSS syntax
3. Applies color space interpolation if specified
4. Returns CSS string like `linear-gradient(135deg in oklch, #667eea, #764ba2)`

**Color Space**:
- Defaults to `oklch` for perceptually uniform color interpolation
- Prevents muddy middle colors in gradients
- Fallback to `srgb` for broader browser support

## Design Notes

- **Data-only module**: No gradient generation algorithms here (see `domain/gradient-generation`)
- **Separation of concerns**: Models vs. generation logic cleanly separated
- **Type safety**: Type guards enable safe runtime type checking
- **CSS generation**: Converts data models to CSS for rendering
- **Backward compatible**: Supports both legacy 2-color and advanced multi-stop gradients
- **Color space aware**: Supports modern color interpolation for better visual results
- **No circular dependencies**: Parent module `domain/layout` imports from here, but not vice versa

---

## Color Source Abstraction (New)

### Overview

The gradient generation system now supports multiple color sources through a pluggable abstraction layer. Colors can come from screenshots, brand profiles, manual input, or presets.

### Key Files

- `color-source.ts` - Color source types, providers, and utilities

### Architecture

All color inputs go through the `ColorSource` interface:

```typescript
interface ColorSource {
  type: "screenshot" | "brand" | "manual" | "preset";
  providerId?: string;  // assetId for screenshot, brandId for brand
  colors: ColorPalette;
}
```

### Flow

1. **Color Extraction**: Provider extracts colors (e.g., `ScreenshotColorProvider`)
2. **Color Enhancement**: `enhanceColorPalette()` transforms raw colors (in `colors.ts`)
3. **Gradient Generation**: `generateGradientOptions()` creates 4 variations (in `generator.ts`)
4. **Gradient Selection**: Random selection or user choice
5. **Config Update**: `useGradientGeneration()` hook applies to layout

### Usage

#### Generating from Screenshots

```typescript
import { createScreenshotColorSource } from "@/domain/layout/gradients/color-source";
import { useGradientGeneration } from "@/hooks/use-gradient-generation";

const { generateFromColorSource } = useGradientGeneration({ gradientPreferences });

const colorPalette = await analyzeColors(screenshotUrl);
const colorSource = createScreenshotColorSource(assetId, colorPalette);
await generateFromColorSource(colorSource);
```

#### Adding New Color Sources

1. Create a `ColorProvider` implementation:

```typescript
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
```

2. Use with `generateFromColorSource()`:

```typescript
const provider = new BrandColorProvider(brandProfile);
const colors = await provider.extractColors();
const colorSource: ColorSource = {
  type: "brand",
  providerId: brandProfile.id,
  colors,
};
await generateFromColorSource(colorSource);
```

### Color Source Tracking

Background config stores detailed source information via `ColorSourceInfo`:

```typescript
background: {
  type: "gradient",
  customGradient: { ... },
  gradientSource: {
    type: "screenshot",
    providerId: "asset-123",
    originalColors: { dominant: "#...", accent: "#..." },
  },
}
```

This enables:
- Analytics on color source usage
- Regeneration from original colors
- Display of color source in UI
- Future brand integration

### Analytics Events

The system tracks the following events:

- `gradient_generated`: Fired when a gradient is generated from any color source
  - Properties: `colorSourceType`, `hasProviderId`
- `gradient_color_customized`: Fired when user manually customizes gradient colors
  - Properties: `stop` (which stop was changed)
- `gradient_source_changed`: Fired when user switches between preset/screenshot/custom tabs
  - Properties: `from`, `to`

### Future Extensions

#### Brand Integration

To add brand color support:

1. Create `BrandColorProvider` class (see example above)
2. Add brand profile UI for color selection
3. Call `generateFromColorSource()` with brand colors
4. No changes needed to gradient generation pipeline

#### Manual Color Input

To add manual color picker:

1. Create `ManualColorProvider` class
2. Build UI for hex color input
3. Call `generateFromColorSource()` with manual colors

#### API-Based Colors

To add colors from external APIs:

1. Create `APIColorProvider` class
2. Implement `extractColors()` to fetch from API
3. Use standard `generateFromColorSource()` flow
