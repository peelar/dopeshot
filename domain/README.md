# Domain Layer

This directory contains the core business logic and data models for the application.

## Architecture Principles

- **No UI Dependencies**: Domain code must not import React components or UI libraries
- **Clear Separation**: Models (data structures) are separated from services (business logic)
- **No Circular Dependencies**: Dependencies flow in one direction only

## Module Documentation

Each subdirectory contains a README.md documenting its current architecture:

- [asset/](./asset/README.md) - Asset upload and metadata extraction
- [gradient-generation/](./gradient-generation/README.md) - Gradient generation service
- [layout/](./layout/README.md) - Layout configuration and models
- [layout/gradients/](./layout/gradients/README.md) - Gradient type definitions
- [look/](./look/README.md) - Look definitions (visual templates)

**For Claude Code**: Always read module READMEs first before exploring code. They document the current state and are updated with code changes.

**For developers**: When modifying domain code, run `/sync_docs` before committing to update affected module READMEs.

## Structure

### `asset/`
Asset models and upload orchestration. See [asset/README.md](./asset/README.md) for details.

### `demo/`
Demo presets and sample data for showcasing the app.

### `gradient-generation/`
**Service Layer**: Color extraction and gradient generation algorithms. See [gradient-generation/README.md](./gradient-generation/README.md) for details.

### `layout/`
Layout models, configuration, and data structures. See [layout/README.md](./layout/README.md) for details.

#### `layout/gradients/`
**Model Layer**: Gradient type definitions and utilities. See [layout/gradients/README.md](./layout/gradients/README.md) for details.

### `look/`
Look definitions (visual templates/styles). See [look/README.md](./look/README.md) for details.

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

See individual module READMEs for detailed dependency information.






