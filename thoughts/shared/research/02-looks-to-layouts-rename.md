# Research: Looks to Layouts Rename

## Overview

This research documents the complete "looks" system in dopeshot to support the rename to "layouts". The system is well-architected with clean separation between domain definitions (pure data) and UI components, using Jotai for state management.

## Key Files & Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| domain/look/definitions.ts | Pure data definitions of looks | 5-372 |
| domain/look/README.md | Documentation | Full file |
| domain/layout/types.ts | LayoutConfig interface with lookId | 82, 103-105 |
| components/look-selector.tsx | Main UI for selecting looks | 1-317 |
| components/sidebar-sections/look-section.tsx | Text/typography controls | 1-146 |
| components/looks/registry.ts | Component registry mapping IDs to React components | 1-36 |
| components/looks/PopupGradient.tsx | "Peak" look implementation | Full file |
| components/looks/HeroCenter.tsx | "Spotlight" look implementation | Full file |
| components/looks/AdaptiveScreenshot.tsx | "Backdrop" look implementation | Full file |
| components/looks/CodeSnippet.tsx | "Code" look implementation | Full file |
| components/looks/shared/look-primitives.tsx | Shared hook for look data access | 1-104 |
| hooks/atoms.ts | Base atoms including configAtom | 16, 31-37 |
| hooks/atoms/derived.ts | Derived atoms for current look | 11-14, 16-19 |

## Architecture & Data Flow

### Domain Layer (Pure Data)

**Look Definition Structure** (domain/look/definitions.ts:42-49):
```typescript
export interface LookDefinition {
  id: string;                      // "popup-gradient", "hero-center", etc.
  name: string;                    // "Peak", "Spotlight", "Backdrop", "Code"
  description: string;
  variants: string[];              // ["left", "right", "center"]
  createConfig: () => LayoutConfig;
  capabilities: LookCapabilities;
}
```

**Look Capabilities** (definitions.ts:18-34):
```typescript
export interface LookCapabilities {
  focusMode: LookFocusMode;                    // "auto" | "always" | "never"
  canvasBehavior: LookCanvasBehavior;          // "locked" | "adaptive" | "text-dependent"
  zoomBehavior: LookZoomBehavior;              // "scale-container" | "scale-content"
  text: {
    headline: LookTextRequirement;             // "required" | "optional" | "hidden"
    subtitle: LookTextRequirement;
  };
  typography: "supported" | "hidden";
  outline: LookOutlineControls;
  logo: "supported" | "hidden";
  screenshot: "supported" | "hidden";
  copyDefaults?: { title?: string; subtitle?: string };
}
```

**Four Look Definitions** (definitions.ts:51-295):
1. **Peak** (popup-gradient): Gradient hero with headline, subtitle, elevated screenshot
2. **Spotlight** (hero-center): Split layout with copy on one side, tall screenshot on other
3. **Backdrop** (adaptive-stage): Single screenshot with adaptive sizing
4. **Code** (code-snippet): Formatted code snippet on gradient background

### State Management (Jotai)

**Base Atoms** (hooks/atoms.ts):
- `configAtom`: Central LayoutConfig with lookId (line 16)
- `assetsAtom`: Screenshot/logo/background assets (line 17)
- `assetTypeAtom`: "screenshot" | "code" (persistent)
- `lastLookByAssetTypeAtom`: Persists last look selection per asset type (line 31-37)
- `screenshotGradientAtom`: Stores screenshot-derived gradient (line 27)

**Derived Atoms** (hooks/atoms/derived.ts):
- `currentLookAtom`: Gets LookDefinition from config (lines 11-14)
- `lookCapabilitiesAtom`: Gets capabilities from current look (lines 16-19)
- `screenshotAssetAtom`: Gets current screenshot asset (lines 21-25)
- `canvasAtom`: Gets canvas dimensions based on look (referenced)

### UI Components

**Look Selection Flow** (components/look-selector.tsx):
1. Renders horizontal carousel with preview thumbnails (160x90px)
2. Each preview has isolated Jotai store to prevent cross-contamination (lines 270-275)
3. User clicks preview → `applyLookSelection()` → updates `configAtom` (lines 143-168)
4. All connected components reactively update

**Look Rendering Flow** (components/cover-preview.tsx):
1. Reads `currentLookAtom` to get look definition
2. Calls `getLookComponent(look.id)` to get React component from registry
3. Renders look component inside `PreviewViewport` with canvas dimensions
4. Look component uses `useLookPrimitives()` hook to access all data

### Component Registry Pattern

**Registry Mapping** (components/looks/registry.ts:22-27):
```typescript
const LOOK_COMPONENTS: Record<string, LookComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
  "code-snippet": CodeSnippet,
};
```

This decouples domain definitions (no React imports) from UI components.

## Thumbnail Generation Logic

### Current Implementation

**Colored Previews** (look-selector.tsx:258-317):
- Each look preview renders full `CoverPreview` component at 1280x720
- Scaled down to fit 160x90px thumbnail container
- Shows actual background gradient, screenshot frame, text styling
- Uses user's current assets and color scheme
- Background preservation strategy maintains screenshot-derived gradients

**Preview Config Generation** (look-selector.tsx:62-126):
- Merges look's default config with user's current content
- Preserves background when switching between same-category looks
- Resets background when switching between screenshot/code categories
- Applies look-specific text defaults

### Required Change: Wireframe Thumbnails

Need to change from **colored styled previews** to **geometry-only wireframes**:
- Remove gradient backgrounds (use neutral gray)
- Remove screenshot images (use placeholder rectangles)
- Remove color sampling
- Show only structural layout (positioning, aspect ratios, spacing)
- Think blueprint/schematic, not preview

## Rename Scope

### UI Labels (User-Facing)

**Look Display Names** (domain/look/definitions.ts):
- Line 54: `name: "Peak"` → Keep (look-specific name)
- Line 117: `name: "Spotlight"` → Keep (look-specific name)
- Line 179: `name: "Backdrop"` → Keep (look-specific name)
- Line 238: `name: "Code"` → Keep (look-specific name)

**UI Labels** (components/look-selector.tsx):
- Line 288: `aria-label={Select ${option.displayName} look}` → "layout"

**UI Labels** (components/sidebar-sections/look-section.tsx):
- Line 85: "This look doesn't support text content" → "This layout doesn't support text content"

**Sidebar Section ID**:
- "look" → "layout" (if used in section switching logic)

### Code Identifiers

**Types/Interfaces**:
- `LookDefinition` → `LayoutDefinition`
- `LookCapabilities` → `LayoutCapabilities`
- `LookComponent` → `LayoutComponent`
- `LookComponentProps` → `LayoutComponentProps`
- `LookTextRequirement` → `LayoutTextRequirement`
- `LookFocusMode` → `LayoutFocusMode`
- `LookCanvasBehavior` → `LayoutCanvasBehavior`
- `LookZoomBehavior` → `LayoutZoomBehavior`
- `LookOutlineControls` → `LayoutOutlineControls`
- `LookTextDefaultOptions` → `LayoutTextDefaultOptions`

**Constants/Variables**:
- `LOOK_DEFINITIONS` → `LAYOUT_DEFINITIONS`
- `LOOK_COMPONENTS` → `LAYOUT_COMPONENTS`
- `LOOK_DEFAULTS` → `LAYOUT_DEFAULTS` (in look-selector.tsx)

**Functions**:
- `getLookDefinition()` → `getLayoutDefinition()`
- `getLookComponent()` → `getLayoutComponent()`
- `withLookTextDefaults()` → `withLayoutTextDefaults()`
- `supportsScreenshots()` → Keep as-is (domain helper)
- `useLookPrimitives()` → `useLayoutPrimitives()`

**Atoms**:
- `currentLookAtom` → `currentLayoutAtom`
- `lookCapabilitiesAtom` → `layoutCapabilitiesAtom`
- `lastLookByAssetTypeAtom` → `lastLayoutByAssetTypeAtom`

**Files**:
- `domain/look/` → `domain/layout-def/` (avoid conflict with existing domain/layout/)
- `components/looks/` → `components/layouts/`
- `components/look-selector.tsx` → `components/layout-selector.tsx`
- `sidebar-sections/look-section.tsx` → `sidebar-sections/layout-section.tsx`
- `look-primitives.tsx` → `layout-primitives.tsx`

**Properties in LayoutConfig**:
- `lookId` → `layoutId` (domain/layout/types.ts:82)
- `lookSpecificSettings` → `layoutSpecificSettings` (domain/layout/types.ts:103-105)

### Files to Rename

1. **domain/look/** → **domain/layout-def/**
   - definitions.ts
   - README.md
   - AUTHORING.md

2. **components/looks/** → **components/layouts/**
   - PopupGradient.tsx
   - HeroCenter.tsx
   - AdaptiveScreenshot.tsx
   - CodeSnippet.tsx
   - registry.ts
   - shared/look-primitives.tsx → shared/layout-primitives.tsx

3. **components/look-selector.tsx** → **components/layout-selector.tsx**

4. **components/sidebar-sections/look-section.tsx** → **components/sidebar-sections/layout-section.tsx**

5. **Thoughts/Research**:
   - thoughts/plans/02-decouple-screenshot-gradient-from-non-screenshot-looks.md
   - thoughts/research/005-look-gradient-screenshot-relationships.md

## Patterns to Follow

### Domain Purity Principle
- Domain code never imports from `components/` or `hooks/`
- Keep domain definitions as pure data structures
- Use registry pattern to decouple IDs from React components

### Backward Compatibility
Always provide migration for legacy IDs:
```typescript
export function getLayoutDefinition(id: string): LayoutDefinition | undefined {
  // Handle legacy "look" references
  if (id === "popup-gradient") {
    return LAYOUT_DEFINITIONS.find((layout) => layout.id === "popup-gradient");
  }
  return LAYOUT_DEFINITIONS.find((layout) => layout.id === id);
}
```

### Naming Conventions
- **PascalCase**: React components, TypeScript types/interfaces
- **kebab-case**: Files, IDs, CSS classes
- **camelCase**: Variables, functions, properties
- **UPPER_SNAKE_CASE**: Module-level constants

### File Organization
- Maintain existing structure: domain/ for pure data, components/ for UI, hooks/ for state
- Use registry.ts for component mapping
- Keep shared utilities in shared/ subdirectories

## Code Examples

### Before (Current)
```typescript
// domain/look/definitions.ts
export interface LookDefinition {
  id: string;
  name: string;
  variants: string[];
  createConfig: () => LayoutConfig;
  capabilities: LookCapabilities;
}

export const LOOK_DEFINITIONS: LookDefinition[] = [...];
export function getLookDefinition(id: string): LookDefinition | undefined {...}
```

### After (Target)
```typescript
// domain/layout-def/definitions.ts
export interface LayoutDefinition {
  id: string;
  name: string;
  variants: string[];
  createConfig: () => LayoutConfig;
  capabilities: LayoutCapabilities;
}

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [...];
export function getLayoutDefinition(id: string): LayoutDefinition | undefined {...}
```

## Recommendations

### Implementation Strategy

1. **Phase 1: Domain Layer**
   - Rename domain/look/ → domain/layout-def/
   - Update all type names in definitions.ts
   - Update function names
   - Update README.md and AUTHORING.md

2. **Phase 2: State Management**
   - Update atoms in hooks/atoms.ts
   - Update derived atoms in hooks/atoms/derived.ts
   - Update LayoutConfig.lookId → layoutId

3. **Phase 3: Components**
   - Rename components/looks/ → components/layouts/
   - Update registry.ts
   - Rename look-selector.tsx → layout-selector.tsx
   - Rename look-section.tsx → layout-section.tsx
   - Update look-primitives.tsx → layout-primitives.tsx

4. **Phase 4: Thumbnail Wireframes**
   - Modify layout-selector.tsx preview generation
   - Remove gradient backgrounds (use neutral gray)
   - Remove screenshot images (use placeholder rectangles)
   - Show only structural geometry

5. **Phase 5: Testing & Verification**
   - Run type check: `pnpm typecheck`
   - Run build: `pnpm build`
   - Test all layouts render correctly
   - Verify no user-facing "look" references remain

### Potential Concerns

1. **Import Path Changes**: Many files import from domain/look/ - need comprehensive search/replace
2. **Atom Dependencies**: Derived atoms depend on base atoms - update atomically
3. **Thumbnail Generation**: Wireframe logic will require new rendering approach
4. **Documentation**: Update all markdown files mentioning "looks"

### Testing Checklist

- [ ] All four layouts render correctly
- [ ] Layout selection updates state properly
- [ ] Variant switching works
- [ ] Asset type switching works
- [ ] Text inputs respect layout capabilities
- [ ] Screenshot upload triggers color analysis
- [ ] Export functionality works
- [ ] No "look" references in UI
- [ ] Thumbnails show wireframes, not colored previews
- [ ] Types compile without errors
