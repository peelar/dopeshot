# Domain Layer

This directory contains the core business logic and data models for the application.

## Architecture Principles

- **No UI Dependencies**: Domain code must not import React components or UI libraries
- **Clear Separation**: Models (data structures) are separated from services (business logic)
- **No Circular Dependencies**: Dependencies flow in one direction only

## Structure

### `asset/`
Asset models and upload orchestration.

- `types.ts` - Asset data model (metadata, URLs)
- `upload-orchestrator.ts` - Orchestrates file upload flow
- `analyze-colors.ts` - Extract color information from assets
- `get-image-metadata.ts` - Extract image dimensions and aspect ratio
- `data-url.ts` - Handle data URL conversions

### `demo/`
Demo presets and sample data for showcasing the app.

### `gradient-generation/`
**Service Layer**: Color extraction and gradient generation algorithms.

- Purpose: Analyze images and create aesthetically pleasing gradients
- Dependencies: None (standalone service)
- Used by: UI components via hooks

Key exports:
- `generateGradientFromImage()` - Main entry point

### `layout/`
Layout models, configuration, and data structures.

#### `layout/gradients/`
**Model Layer**: Gradient type definitions and utilities.

- Purpose: Define the shape of gradient data used in layouts
- Dependencies: None
- Note: Does NOT contain generation logic (see `gradient-generation/`)

Key types:
- `GradientStop`, `GradientType`, `GradientColorSpace`
- `CustomGradient`, `LegacyGradient`, `AdvancedGradient`

#### Other layout modules:
- `types.ts` - Core layout config types
- `aspect.ts` - Aspect ratio calculations
- `export.ts` - Layout export functionality
- `fonts.ts` - Font definitions
- `gradient-presets.ts` - Pre-defined gradient styles
- `patterns.ts` - Background pattern definitions
- `recommendations.ts` - Look recommendations based on content
- `screenshot-mode.ts` - Screenshot display modes

### `look/`
Look definitions (visual templates/styles).

- `definitions.ts` - Pure data definitions of available looks
- `AUTHORING.md` - Guide for creating new looks

Note: Look React components live in `components/looks/` to avoid circular dependencies.

## Dependencies Flow

```
gradient-generation (service)
       ⬇️ (no direct import currently)
layout/gradients (model types)
       ⬇️
layout (configuration)
       ⬇️
look/definitions (visual templates)
```

**Important**: 
- `gradient-generation` is independent and could import types from `layout/gradients` if needed
- `layout/gradients` should NEVER import from `gradient-generation`
- Domain layer should NEVER import from `components/` or `hooks/`


