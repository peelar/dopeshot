# Look Module

## Purpose

Defines available visual templates/styles (called "Looks") as pure data. Each Look has a unique configuration, capabilities, and default layout. This is **data-only** - React components live separately in `components/looks/` to avoid circular dependencies.

## File Structure

- `definitions.ts` - Array of LookDefinition objects describing all available looks
- `AUTHORING.md` - Guide for creating new look definitions

## Key Exports

- `LOOK_DEFINITIONS` - Array of all available look definitions
- `LookDefinition` - Type for look metadata, capabilities, and config factory
- `LookCapabilities` - Describes what each look supports (text requirements, screenshot, logo, orientation support, etc.)
- `LookTextRequirement` - "required" | "optional" | "hidden" for text fields
- `LookFocusMode` - How screenshot focus/zoom works ("auto" | "always" | "never")
- `LookCanvasBehavior` - Canvas sizing behavior ("locked" | "adaptive" | "text-dependent")
- `supportedOrientations` - Optional array of supported device modes ("mobile" | "desktop")

## Dependencies

- Imports from: `domain/layout/types` (LayoutConfig), `domain/layout/gradient-presets`, `domain/layout/fonts`
- Used by: Look selector UI, layout initialization, `components/looks/` (React components)
- Does NOT import React components (prevents circular dependencies)

## How It Works

**Look Definition Structure**:
1. **Metadata**: id, name, description, available variants
2. **Config Factory**: `createConfig()` returns default LayoutConfig for this look
3. **Capabilities**: Declares what features the look supports

**Look Selection Flow**:
1. User selects look from UI
2. `createConfig()` called to get default LayoutConfig
3. LayoutConfig stored in state
4. UI reads lookId from LayoutConfig
5. Corresponding React component (from `components/looks/`) renders the look

**Available Looks**:
- **Peak** (`popup-gradient`): Gradient hero with elevated screenshot frame
- **Spotlight** (`centered-hero`): Centered layout with screenshot focus
- **Backdrop** (`background-emphasis`): Large background image with small screenshot
- **Code Snippet** (`code-snippet`): Code display with syntax highlighting (no screenshot)

## Design Notes

- **No React components**: Pure data definitions, components separated to `components/looks/`
- **Circular dependency prevention**: Domain can be imported by any layer without cycles
- **Config factory pattern**: Each look provides `createConfig()` for default state
- **Capability declaration**: UI can conditionally show/hide controls based on capabilities
- **Variants support**: Looks can have multiple layout variants (left/right/center)
- **Extensible**: Add new looks by adding to `LOOK_DEFINITIONS` array
- **Type safety**: Capabilities are strongly typed to prevent invalid configurations
