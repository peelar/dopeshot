# Gradient Generation

## Purpose

Service layer that analyzes images and creates aesthetically pleasing gradients. Extracts dominant colors from uploaded images, applies color theory strategies, and generates gradient configurations optimized for visual appeal.

## File Structure

- `index.ts` - Main entry point and public API with `generateGradientFromImage()`
- `color-extraction.ts` - Extracts and classifies colors from image buffers using node-vibrant
- `strategy.ts` - Determines gradient strategy (multi-accent, single-accent, monochrome, fallback) based on palette analysis
- `gradient-builder.ts` - Constructs gradient colors from palette using selected strategy
- `color-manipulation.ts` - Color theory operations (harmonization, mixing, temperature/intensity adjustments)
- `utils.ts` - Shared utilities for color calculations and buffer normalization

## Key Exports

- `generateGradientFromImage(imageBuffer, options?)` - Main entry point that returns `GradientResult` with start/end colors and angle
- `GradientResult` - Output type with `colorStart`, `colorEnd`, `angle`, and optional debug info
- `GradientPreferences` - User preferences for angle, temperature (warm/cool/neutral), intensity (soft/balanced/bold)
- `GradientStrategy` - Strategy types: `"multi-accent"`, `"single-accent"`, `"monochrome"`, `"fallback"`
- `PaletteMood` - Analyzed palette characteristics (grayscale, low contrast, highly colorful)

## Dependencies

- Imports from: `node-vibrant` (color extraction), `culori` (color manipulation via utils)
- Used by: `hooks/useGradientGeneration`, UI components for auto-gradient features
- Does NOT import from other domain modules (standalone service)

## How It Works

1. **Image Processing**: Normalizes image buffer, validates it's a valid image format (PNG/JPEG/GIF)
2. **Color Extraction**: Uses node-vibrant to extract dominant colors, classifies them into accent/base colors
3. **Palette Analysis**: Analyzes mood (grayscale, low contrast, colorful) and determines best strategy
4. **Strategy Selection**:
   - `multi-accent`: 2+ strong accent colors present (≥25% population)
   - `single-accent`: 1 strong accent color with base colors
   - `monochrome`: Only base colors or grayscale palette
   - `fallback`: Insufficient data, uses default purple gradient
5. **Gradient Construction**: Builds start/end colors using selected strategy with harmonization
6. **Refinement**: Applies user preferences (temperature shift, intensity adjustment) and ensures adequate contrast
7. **Fallback Handling**: Returns default gradient (#667eea → #764ba2) if extraction fails

## Design Notes

- **Standalone service**: No dependencies on other domain modules, can be tested in isolation
- **Strategy pattern**: Makes it easy to add new gradient generation algorithms without changing core logic
- **Color space**: Uses OKLCH (via culori) for perceptually uniform color manipulation
- **Type safety**: All color operations and results are strongly typed
- **Graceful degradation**: Always returns a valid gradient, falls back to defaults on errors
- **Debug mode**: Optional debug info provides transparency into strategy selection and color extraction
- **Performance**: Normalizes large images to max size (default) to speed up color extraction
