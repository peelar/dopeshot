# Layout Gradients

## Purpose

Defines gradient data models and CSS generation utilities. This is the **data/model layer** for gradients used in layouts - it does NOT contain gradient generation/extraction logic (that's in `domain/gradient-generation`). Provides type definitions, CSS conversion, and color utilities.

## File Structure

- `types.ts` - Gradient type definitions (GradientStop, AdvancedGradient, LegacyGradient, CustomGradient)
- `utils.ts` - CSS gradient generation, type guards, and gradient conversions
- `colors.ts` - Color utilities and transformations
- `generator.ts` - Gradient manipulation and transformation functions
- `index.ts` - Public API exports

## Key Exports

- `CustomGradient` - Union type of AdvancedGradient (multi-stop) and LegacyGradient (2-color)
- `AdvancedGradient` - Multi-stop gradient with type, stops, direction, colorSpace, angle
- `LegacyGradient` - Simple 2-color gradient with from/to colors and direction
- `GradientStop` - Color stop with position (0-100% or 0-1)
- `GradientType` - "linear" | "radial" | "conic"
- `GradientColorSpace` - "oklch" | "srgb" | "lab" for interpolation
- `toCSSGradient(gradient)` - Converts gradient objects to CSS strings
- `isAdvancedGradient(gradient)` - Type guard for AdvancedGradient

## Dependencies

- Imports from: None (pure data models and utilities)
- Used by: `domain/layout` (parent module), `domain/gradient-generation` (could import types if needed)
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
