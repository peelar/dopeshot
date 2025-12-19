# Layout Module

## Purpose

Defines layout configuration models and utilities for the entire visual output system. Provides the central `LayoutConfig` type that describes all aspects of how content is rendered (backgrounds, text, screenshots, patterns, fonts). Acts as the core state model for the application.

## File Structure

- `types.ts` - Core LayoutConfig type and all configuration subtypes (BackgroundConfig, TextConfig, etc.)
- `aspect.ts` - Aspect ratio calculations and categorization (portrait, landscape, square, ultrawide)
- `fonts.ts` - Font family definitions and metadata
- `gradient-presets.ts` - Pre-defined gradient configurations (sunset, ocean, forest, etc.)
- `gradient-application.ts` - Logic for applying gradients to different background contexts
- `patterns.ts` - Background pattern definitions (grain, organic, grid)
- `recommendations.ts` - Suggests looks based on content type
- `screenshot-mode.ts` - Screenshot display mode logic, aspect ratio handling, and orientation-based canvas dimensions
- `export.ts` - Layout export functionality and serialization
- `gradients/` - Gradient type definitions and utilities (separate submodule)

## Key Exports

- `LayoutConfig` - Central state model with background, text, look, screenshot configuration
- `BackgroundConfig` - Background settings (type, gradient, image, solid color, patterns)
- `TextConfig` - Text content and typography settings
- `ScreenshotTreatment` - Screenshot frame presets and display options
- `AspectCategory` - Aspect ratio categories with `getAspectCategory()` utility
- `FONT_DEFINITIONS` - Available font families with metadata
- `GRADIENT_PRESETS` - Pre-configured gradient styles
- Re-exports gradient types from `gradients/` for convenience

## Dependencies

- Imports from: `domain/layout/gradients` (gradient type definitions)
- Used by: ALL UI components, state management hooks, export functionality
- External: None (pure data models and utilities)

## How It Works

**Central State Model**:
- `LayoutConfig` is the single source of truth for entire visual state
- Components read from LayoutConfig to render
- User interactions update LayoutConfig
- Changes trigger re-renders across the application

**Modular Configuration**:
- Background: Type (gradient/image/solid), gradient config, patterns
- Text: Content, font, size, color, positioning
- Screenshot: Treatment preset, aspect ratio, shadow, shape
- Look: Selected visual template/style

**Aspect Ratio & Device Mode Flow**:
1. Image uploaded → metadata extracted (domain/asset)
2. Aspect ratio calculated → categorized (portrait/landscape/etc)
3. User selects device mode (desktop/mobile) via UI with device-aware defaults
4. Canvas dimensions calculated based on mode (Desktop: 1920×1080 for 16:9, Mobile: 1080×1920 for 9:16)
5. Screenshot mode determined based on category and device mode
6. Layout adjusted for optimal display
7. Legacy orientation values (horizontal/vertical/square) automatically normalized to desktop/mobile

## Design Notes

- **No UI dependencies**: Pure data models, no React components imported
- **Central state pattern**: Single LayoutConfig object manages all visual state
- **Gradient separation**: Imports types from `gradients/` but doesn't contain generation logic
- **Backward compatibility**: Re-exports gradient types for convenience
- **Type safety**: Strongly typed configuration prevents invalid states
- **Extensible**: Easy to add new fonts, presets, patterns without changing core types
