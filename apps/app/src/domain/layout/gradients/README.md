# Layout Gradients

## Purpose

Defines gradient data models and CSS generation utilities. This is the **data/model layer** for gradients used in layouts. Provides type definitions, CSS conversion, and static placeholder gradients.

**Note:** Dynamic gradient generation from screenshot colors has been removed. Static placeholder gradients are used until the palette-based gradient system is implemented. See `thoughts/plans/09-palette-based-gradient-system.md`.

## File Structure

- `types.ts` - Gradient type definitions (GradientStop, AdvancedGradient, LegacyGradient, CustomGradient)
- `utils.ts` - CSS gradient generation, type guards, and gradient conversions
- `generator.ts` - Static placeholder gradients (6 curated options)
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
- `generateGradientOptions()` - Returns 6 static placeholder gradients

## Dependencies

- Used by: `domain/layout` (parent module), `components/selectors/gradient-picker`

## Static Gradients

Currently provides 6 curated placeholder gradients:

1. **Mesh Gradient** - Purple/pink/blue organic blobs
2. **Linear Diagonal** - Indigo to purple
3. **Radial** - Teal center fading to blue
4. **Multi-Stop Diagonal** - Sunset orange/pink/purple
5. **Linear Cool** - Cyan to indigo
6. **Linear Warm** - Orange to rose

## CSS Generation

1. Gradient object → `customGradientToCss()` function
2. Handles linear, radial, conic types
3. Handles mesh gradients by layering radial gradients
4. Applies color space interpolation if specified
5. Returns CSS string like `linear-gradient(135deg, #6366f1, #a855f7)`

## Design Notes

- **Static for now**: Dynamic generation disabled pending palette system implementation
- **Type safety**: Type guards enable safe runtime type checking
- **Backward compatible**: Supports legacy 2-color gradients from old saved configs

## Future: Palette-Based System

The plan is to replace static gradients with a palette-matching system:

1. Pre-define validated gradient palettes
2. Extract color signature from screenshots
3. Match to closest validated palette
4. Apply palette to various gradient layouts

See `thoughts/plans/09-palette-based-gradient-system.md` for details.
