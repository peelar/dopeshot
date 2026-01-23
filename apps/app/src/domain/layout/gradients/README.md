# Layout Gradients

## Purpose

Defines gradient data models and CSS generation utilities. This is the **data/model layer** for gradients used in layouts. Provides type definitions, CSS conversion, color utilities, and gradient generation from screenshot colors.

## File Structure

- `types.ts` - Gradient type definitions (GradientStop, AdvancedGradient, LegacyGradient, CustomGradient)
- `utils.ts` - CSS gradient generation, type guards, and gradient conversions
- `colors.ts` - Color palette enhancement and color space transformations
- `generator.ts` - Gradient generation algorithms (creates 6 gradient options from colors)
- `index.ts` - Public API exports

## Key Exports

### Gradient Types
- `CustomGradient` - Union type of AdvancedGradient (multi-stop) and LegacyGradient (2-color)
- `AdvancedGradient` - Multi-stop gradient with type, stops, direction, colorSpace, angle, meshLayers
- `LegacyGradient` - Simple 2-color gradient with from/to colors and direction (backward compat)
- `GradientStop` - Color stop with position (0-100%)
- `GradientType` - "linear" | "radial" | "conic"
- `GradientColorSpace` - "oklch" | "srgb" | "lab" for interpolation
- `MeshLayer` - Blob layer for mesh gradients with color, position, size, blur

### Utilities
- `customGradientToCss(gradient)` - Converts gradient objects to CSS strings
- `isAdvancedGradient(gradient)` - Type guard for AdvancedGradient
- `isLegacyGradient(gradient)` - Type guard for LegacyGradient
- `isMeshGradient(gradient)` - Type guard for mesh gradients
- `getContrastTextColor(colors)` - Returns appropriate text color for contrast
- `generateGradientOptions(palette, context)` - Generates 6 gradient options from colors

## Dependencies

- Imports from: `domain/asset/types` (ColorPalette)
- Used by: `domain/layout` (parent module), `components/selectors/gradient-picker`
- External: Uses culori for color manipulation

## How It Works

### Gradient Generation

When a screenshot is uploaded:
1. Color analysis extracts a `ColorPalette` (dominant, accent, vibrant, muted, background colors)
2. `generateGradientOptions()` creates 6 gradient variations:
   - **Slots 1-3**: Linear gradients using different color strategies (multi-color, complementary, analogous)
   - **Slot 4**: Mesh gradient with neon blob layers
   - **Slots 5-6**: Ambient gradients (black→accent and white→accent) with organic blob overlays

### Gradient Types

- `AdvancedGradient`: Multi-stop (2+ colors), custom angles, color space control, optional mesh layers
- `LegacyGradient`: Simple 2-color gradients for backward compatibility
- `CustomGradient`: Union type supporting both formats

### CSS Generation

1. Gradient object → `customGradientToCss()` function
2. Handles linear, radial, conic types
3. Handles mesh gradients by layering radial gradients
4. Applies color space interpolation if specified
5. Returns CSS string like `linear-gradient(135deg in oklch, #667eea, #764ba2)`

### Color Space

- Defaults to `oklch` for perceptually uniform color interpolation
- Prevents muddy middle colors in gradients
- Fallback to `srgb` for broader browser support

## Design Notes

- **Screenshot-driven**: All gradients derive from uploaded screenshot colors
- **No presets**: Removed static gradient presets - every gradient is unique to the screenshot
- **Type safety**: Type guards enable safe runtime type checking
- **Backward compatible**: Supports legacy 2-color gradients from old saved configs
- **Color space aware**: Supports modern color interpolation for better visual results
