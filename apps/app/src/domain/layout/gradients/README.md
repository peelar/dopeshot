# Layout Gradients

## Purpose

Defines gradient data models and CSS generation utilities. This is the **data/model layer** for gradients used in layouts. Provides type definitions, CSS conversion, and palette-matched gradient generation.

## File Structure

- `types.ts` - Gradient type definitions (GradientStop, AdvancedGradient, LegacyGradient, CustomGradient)
- `utils.ts` - CSS gradient generation, type guards, and gradient conversions
- `generator.ts` - Palette-matched gradients (6 curated options)
- `palette.ts` - Color signature types + palette mapping
- `index.ts` - Public API exports

## Key Exports

### Gradient Types

- `CustomGradient` - Union type of AdvancedGradient (multi-stop) and LegacyGradient (2-color)
- `AdvancedGradient` - Multi-stop gradient with type, stops, direction, colorSpace, angle, meshLayers
- `LegacyGradient` - Simple 2-color gradient with from/to colors and direction (backward compat)
- `GradientStop` - Color stop with position (0-100%)
- `GradientType` - "linear" | "radial" | "conic"
- `GradientColorSpace` - "oklch" | "srgb" | "lab" for interpolation
- `MeshLayer` - Blob layer for mesh gradients with color, position, size

### Utilities

- `customGradientToCss(gradient)` - Converts gradient objects to CSS strings
- `isAdvancedGradient(gradient)` - Type guard for AdvancedGradient
- `isLegacyGradient(gradient)` - Type guard for LegacyGradient
- `isMeshGradient(gradient)` - Type guard for mesh gradients
- `getContrastTextColor(colors)` - Returns appropriate text color for contrast
- `generateGradientOptions()` - Returns 6 palette-matched gradients

## Dependencies

- Used by: `domain/layout` (parent module), `components/selectors/gradient-picker`

## Gradient Set

Provides a consistent 6-option set, with palette-matched colors:

1. **Mesh Gradient** - expressive, organic blobs
2. **Aurora** - flowing multi-stop layers
3. **Linear Bold** - clean 2-stop directional
4. **Radial Glow** - focused highlight
5. **Linear Soft** - ambient directional wash
6. **Muted Wash** - soft soup + low-contrast blobs

## CSS Generation

1. Gradient object → `customGradientToCss()` function
2. Handles linear, radial, conic types
3. Handles mesh gradients by layering radial gradients
4. Applies color space interpolation if specified
5. Returns CSS string like `linear-gradient(135deg, #6366f1, #a855f7)`

## Design Notes

- **Palette-matched**: Colors are snapped to curated Tailwind scales
- **Type safety**: Type guards enable safe runtime type checking
- **Backward compatible**: Supports legacy 2-color gradients from old saved configs
