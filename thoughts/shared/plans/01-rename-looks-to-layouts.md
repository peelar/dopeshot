# Implementation Plan: Rename Looks to Layouts

## Overview

Rename "looks" to "layouts" throughout the codebase and UI. Layouts represent compositional geometry only — where the screenshot sits relative to text and canvas edges. This refactor also converts rail thumbnails from colored previews to wireframe-style representations that communicate structure, not styling.

## Implementation Approach

This rename follows the established pattern from the previous `looks.ts → definitions.ts` refactor (commit 1228103). We'll maintain domain purity, update the component registry pattern, ensure backward compatibility, and preserve all functionality while changing terminology and thumbnail appearance.

The approach is phased to minimize risk:
1. Domain layer first (pure data, no React dependencies)
2. State management (Jotai atoms)
3. UI components and registry
4. Thumbnail wireframe conversion
5. Documentation and verification

---

## Phase 1: Domain Layer Rename

### Changes Required

#### 1. Create new domain/layout-def/ directory
**Action**: Rename `domain/look/` → `domain/layout-def/`

**Rationale**: Avoid conflict with existing `domain/layout/` which contains `LayoutConfig` types. The `-def` suffix indicates this module contains layout definitions/templates.

```bash
mv domain/look domain/layout-def
```

#### 2. Update domain/layout-def/definitions.ts

**File**: `domain/layout-def/definitions.ts`

**Type Renames**:
```typescript
// Before
export type LookTextRequirement = "required" | "optional" | "hidden";
export type LookOutlineControls = {...};
export type LookFocusMode = "auto" | "always" | "never";
export type LookCanvasBehavior = "locked" | "adaptive" | "text-dependent";
export type LookZoomBehavior = "scale-container" | "scale-content";
export interface LookCapabilities {...}
export interface LookDefinition {...}

// After
export type LayoutTextRequirement = "required" | "optional" | "hidden";
export type LayoutOutlineControls = {...};
export type LayoutFocusMode = "auto" | "always" | "never";
export type LayoutCanvasBehavior = "locked" | "adaptive" | "text-dependent";
export type LayoutZoomBehavior = "scale-container" | "scale-content";
export interface LayoutCapabilities {...}
export interface LayoutDefinition {...}
```

**Constant Renames**:
```typescript
// Before
export const LOOK_DEFINITIONS: LookDefinition[] = [...];

// After
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [...];
```

**Function Renames**:
```typescript
// Before
export function getLookDefinition(id: string): LookDefinition | undefined {...}
export function withLookTextDefaults(...): LayoutConfig {...}
type LookTextDefaultOptions = {...};

// After
export function getLayoutDefinition(id: string): LayoutDefinition | undefined {...}
export function withLayoutTextDefaults(...): LayoutConfig {...}
type LayoutTextDefaultOptions = {...};
```

**Keep supportsScreenshots()** as-is since it's a domain helper that doesn't use "look" in its name.

#### 3. Update domain/layout-def/README.md

**File**: `domain/layout-def/README.md`

Replace all instances of "look" with "layout" in documentation. Update module name references.

#### 4. Update domain/layout-def/AUTHORING.md

**File**: `domain/layout-def/AUTHORING.md`

Replace all instances of "look" with "layout" in authoring guide.

#### 5. Update domain/layout/types.ts

**File**: `domain/layout/types.ts`

**Property Renames** (lines 82, 103-105):
```typescript
// Before
export interface LayoutConfig {
  lookId: string;
  // ...
  lookSpecificSettings?: {
    fadeEnabled?: Record<string, boolean>;
  };
}

// After
export interface LayoutConfig {
  layoutId: string;
  // ...
  layoutSpecificSettings?: {
    fadeEnabled?: Record<string, boolean>;
  };
}
```

**Import Updates**:
```typescript
// Update any imports from domain/look/ to domain/layout-def/
import type { LayoutCapabilities, LayoutDefinition } from "@/domain/layout-def/definitions";
```

### Success Criteria

#### Automated Verification
- [ ] Types compile: `pnpm typecheck`
- [ ] No references to old import paths remain: `grep -r "domain/look" domain/`

#### Manual Verification
- [ ] All type names use "Layout" prefix
- [ ] LAYOUT_DEFINITIONS array is properly exported
- [ ] Helper functions renamed consistently
- [ ] Documentation updated

---

## Phase 2: State Management & Hooks

### Changes Required

#### 1. Update hooks/atoms.ts

**File**: `hooks/atoms.ts`

**Atom Renames** (line 31-37):
```typescript
// Before
export const lastLookByAssetTypeAtom = atomWithStorage<Record<AssetType, string>>(
  "dopeshot:lastLookByAssetType",
  { screenshot: defaultPreset.config.lookId, code: "code-snippet" },
);

// After
export const lastLayoutByAssetTypeAtom = atomWithStorage<Record<AssetType, string>>(
  "dopeshot:lastLayoutByAssetType",
  { screenshot: defaultPreset.config.layoutId, code: "code-snippet" },
);
```

**Import Updates**:
```typescript
// Update imports
import { getLayoutDefinition } from "@/domain/layout-def/definitions";
```

**Update References**:
- Change `config.lookId` → `config.layoutId` throughout file

#### 2. Update hooks/atoms/derived.ts

**File**: `hooks/atoms/derived.ts`

**Atom Renames** (lines 11-19):
```typescript
// Before
export const currentLookAtom = atom((get) => {
  const config = get(configAtom);
  return getLookDefinition(config.lookId);
});

export const lookCapabilitiesAtom = atom((get) => {
  const look = get(currentLookAtom);
  return look?.capabilities;
});

// After
export const currentLayoutAtom = atom((get) => {
  const config = get(configAtom);
  return getLayoutDefinition(config.layoutId);
});

export const layoutCapabilitiesAtom = atom((get) => {
  const layout = get(currentLayoutAtom);
  return layout?.capabilities;
});
```

**Import Updates**:
```typescript
import { getLayoutDefinition } from "@/domain/layout-def/definitions";
```

#### 3. Update domain/layout/screenshot-mode.ts

**File**: `domain/layout/screenshot-mode.ts`

**Import Updates**:
```typescript
// Before
import { getLookDefinition, supportsScreenshots } from "@/domain/look/definitions";

// After
import { getLayoutDefinition, supportsScreenshots } from "@/domain/layout-def/definitions";
```

**Variable Renames**:
```typescript
// Before
const look = getLookDefinition(config.lookId);

// After
const layout = getLayoutDefinition(config.layoutId);
```

Replace all instances of `look` variable with `layout` where it refers to the definition.

### Success Criteria

#### Automated Verification
- [ ] Types compile: `pnpm typecheck`
- [ ] No references to old atom names: `grep -r "currentLookAtom\|lookCapabilitiesAtom" hooks/`

#### Manual Verification
- [ ] All derived atoms renamed
- [ ] localStorage key updated for lastLayoutByAssetTypeAtom
- [ ] All imports point to domain/layout-def/

---

## Phase 3: Component Registry & Primitives

### Changes Required

#### 1. Rename components/looks/ → components/layouts/

**Action**:
```bash
mv components/looks components/layouts
```

#### 2. Update components/layouts/registry.ts

**File**: `components/layouts/registry.ts`

**Type Renames** (lines 14-20):
```typescript
// Before
export type LookComponentProps = {...};
export type LookComponent = ComponentType<LookComponentProps>;

const LOOK_COMPONENTS: Record<string, LookComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
  "code-snippet": CodeSnippet,
};

export function getLookComponent(id: string): LookComponent | undefined {...}

// After
export type LayoutComponentProps = {...};
export type LayoutComponent = ComponentType<LayoutComponentProps>;

const LAYOUT_COMPONENTS: Record<string, LayoutComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
  "code-snippet": CodeSnippet,
};

export function getLayoutComponent(id: string): LayoutComponent | undefined {
  if (id === "full-visual") {
    return LAYOUT_COMPONENTS["adaptive-stage"];
  }
  return LAYOUT_COMPONENTS[id];
}
```

#### 3. Update components/layouts/shared/layout-primitives.tsx

**File**: `components/layouts/shared/layout-primitives.tsx` (renamed from look-primitives.tsx)

**Action**:
```bash
mv components/layouts/shared/look-primitives.tsx components/layouts/shared/layout-primitives.tsx
```

**Function Rename**:
```typescript
// Before
export function useLookPrimitives() {...}

// After
export function useLayoutPrimitives() {...}
```

**Component Rename** (lines 85-103):
```typescript
// Before
export const LookSurface = memo(...)

// After
export const LayoutSurface = memo(...)
```

**Import Updates** within the file:
```typescript
import { currentLayoutAtom, layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
```

#### 4. Update all layout component files

**Files**:
- `components/layouts/PopupGradient.tsx`
- `components/layouts/HeroCenter.tsx`
- `components/layouts/AdaptiveScreenshot.tsx`
- `components/layouts/CodeSnippet.tsx`

**Changes for each file**:
```typescript
// Before
import { useLookPrimitives, LookSurface } from "./shared/look-primitives";

// After
import { useLayoutPrimitives, LayoutSurface } from "./shared/layout-primitives";
```

**Hook Usage**:
```typescript
// Before
const { config, backgroundStyle, text, ... } = useLookPrimitives();

// After
const { config, backgroundStyle, text, ... } = useLayoutPrimitives();
```

**Component Usage**:
```typescript
// Before
<LookSurface backgroundStyle={backgroundStyle}>

// After
<LayoutSurface backgroundStyle={backgroundStyle}>
```

**Variable Renames** (where applicable):
```typescript
// Before
const lookSpecificFadeEnabled = config.lookSpecificSettings?.fadeEnabled?.[config.lookId];

// After
const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
```

### Success Criteria

#### Automated Verification
- [ ] Types compile: `pnpm typecheck`
- [ ] No references to old paths: `grep -r "components/looks" .`
- [ ] No references to old hook: `grep -r "useLookPrimitives" components/`

#### Manual Verification
- [ ] All layout components import from new paths
- [ ] Registry exports correct types
- [ ] Layout primitives hook works correctly

---

## Phase 4: Layout Selector & Sidebar

### Changes Required

#### 1. Rename components/look-selector.tsx

**Action**:
```bash
mv components/look-selector.tsx components/layout-selector.tsx
```

#### 2. Update components/layout-selector.tsx

**File**: `components/layout-selector.tsx`

**Import Updates**:
```typescript
// Before
import { LOOK_DEFINITIONS, getLookDefinition, supportsScreenshots, withLookTextDefaults } from "@/domain/look/definitions";
import { currentLookAtom, lookCapabilitiesAtom } from "@/hooks/atoms/derived";
import { lastLookByAssetTypeAtom } from "@/hooks/atoms";
import { getLookComponent } from "./looks/registry";

// After
import { LAYOUT_DEFINITIONS, getLayoutDefinition, supportsScreenshots, withLayoutTextDefaults } from "@/domain/layout-def/definitions";
import { currentLayoutAtom, layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
import { lastLayoutByAssetTypeAtom } from "@/hooks/atoms";
import { getLayoutComponent } from "./layouts/registry";
```

**Component Rename**:
```typescript
// Before
export function LookSelector({ className }: { className?: string }) {

// After
export function LayoutSelector({ className }: { className?: string }) {
```

**Constant Renames** (line 50):
```typescript
// Before
const LOOK_DEFAULTS = LOOK_DEFINITIONS.map((look) => {
  const defaultConfig = look.createConfig();
  const defaultVariant = defaultConfig.variant || look.variants[0];
  return { look, defaultVariant, defaultConfig, key: look.id, displayName: look.name };
});

// After
const LAYOUT_DEFAULTS = LAYOUT_DEFINITIONS.map((layout) => {
  const defaultConfig = layout.createConfig();
  const defaultVariant = defaultConfig.variant || layout.variants[0];
  return { layout, defaultVariant, defaultConfig, key: layout.id, displayName: layout.name };
});
```

**Variable Renames Throughout**:
- `look` → `layout`
- `currentLook` → `currentLayout`
- `lookCapabilities` → `layoutCapabilities`
- `lastLookByAssetType` → `lastLayoutByAssetType`
- `previewConfigByLookId` → `previewConfigByLayoutId`
- `currentLookSupportsScreenshots` → `currentLayoutSupportsScreenshots`
- `targetLookSupportsScreenshots` → `targetLayoutSupportsScreenshots`

**Function Renames**:
```typescript
// Before
const applyLookSelection = useCallback((lookId: string, displayName?: string) => {
  const nextConfig = previewConfigByLookId.get(lookId);
  // ...
  setConfig(withLookTextDefaults(...));
}, [...]);

// After
const applyLayoutSelection = useCallback((layoutId: string, displayName?: string) => {
  const nextConfig = previewConfigByLayoutId.get(layoutId);
  // ...
  setConfig(withLayoutTextDefaults(...));
}, [...]);
```

**Accessibility Labels** (line 288):
```typescript
// Before
aria-label={`Select ${option.displayName} look`}

// After
aria-label={`Select ${option.displayName} layout`}
```

**Component Names**:
```typescript
// Before
function LookPreviewCard({...}) {...}

// After
function LayoutPreviewCard({...}) {...}
```

#### 3. Rename components/sidebar-sections/look-section.tsx

**Action**:
```bash
mv components/sidebar-sections/look-section.tsx components/sidebar-sections/layout-section.tsx
```

#### 4. Update components/sidebar-sections/layout-section.tsx

**File**: `components/sidebar-sections/layout-section.tsx`

**Import Updates**:
```typescript
// Before
import { lookCapabilitiesAtom } from "@/hooks/atoms/derived";

// After
import { layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
```

**Component Rename**:
```typescript
// Before
export function LookSection() {

// After
export function LayoutSection() {
```

**Variable Renames**:
```typescript
// Before
const lookCapabilities = useAtomValue(lookCapabilitiesAtom);

// After
const layoutCapabilities = useAtomValue(layoutCapabilitiesAtom);
```

**UI Text Updates** (line 85):
```typescript
// Before
"This look doesn't support text content"

// After
"This layout doesn't support text content"
```

**Conditional Logic**:
```typescript
// Before
const showHeadlineInput = (lookCapabilities?.text.headline ?? "optional") !== "hidden";
const showSubtitleInput = (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
const showTypographyControls = lookCapabilities?.typography === "supported";

// After
const showHeadlineInput = (layoutCapabilities?.text.headline ?? "optional") !== "hidden";
const showSubtitleInput = (layoutCapabilities?.text.subtitle ?? "optional") !== "hidden";
const showTypographyControls = layoutCapabilities?.typography === "supported";
```

#### 5. Update sidebar section registry

**File**: Find where sidebar sections are registered/imported (likely in a main layout or sidebar component)

**Update Import**:
```typescript
// Before
import { LookSection } from "./sidebar-sections/look-section";

// After
import { LayoutSection } from "./sidebar-sections/layout-section";
```

**Update Usage**:
```typescript
// Before
<LookSection />

// After
<LayoutSection />
```

#### 6. Update components/cover-preview.tsx

**File**: `components/cover-preview.tsx`

**Import Updates**:
```typescript
// Before
import { currentLookAtom } from "@/hooks/atoms/derived";
import { getLookComponent } from "./looks/registry";

// After
import { currentLayoutAtom } from "@/hooks/atoms/derived";
import { getLayoutComponent } from "./layouts/registry";
```

**Variable Renames**:
```typescript
// Before
const look = useAtomValue(currentLookAtom);
const LookComponent = useMemo(() => (look ? getLookComponent(look.id) : null), [look]);

// After
const layout = useAtomValue(currentLayoutAtom);
const LayoutComponent = useMemo(() => (layout ? getLayoutComponent(layout.id) : null), [layout]);
```

**Component Usage**:
```typescript
// Before
{LookComponent && <LookComponent onScreenshotUpload={...} onLogoUpload={...} />}

// After
{LayoutComponent && <LayoutComponent onScreenshotUpload={...} onLogoUpload={...} />}
```

### Success Criteria

#### Automated Verification
- [ ] Types compile: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`
- [ ] No "look" references in component names: `grep -r "LookSelector\|LookSection\|LookPreview" components/`

#### Manual Verification
- [ ] Layout selector renders correctly
- [ ] Layout selection updates state
- [ ] Sidebar section shows correct controls
- [ ] All accessibility labels use "layout"

---

## Phase 5: Wireframe Thumbnails

### Changes Required

#### 1. Create wireframe preview component

**File**: `components/layouts/shared/wireframe-preview.tsx` (new file)

**Purpose**: Render geometry-only wireframes instead of full styled previews

```typescript
import { memo } from "react";
import type { LayoutDefinition } from "@/domain/layout-def/definitions";

interface WireframePreviewProps {
  layout: LayoutDefinition;
  variant: string;
}

export const WireframePreview = memo(function WireframePreview({
  layout,
  variant,
}: WireframePreviewProps) {
  // Render wireframe based on layout.id
  switch (layout.id) {
    case "popup-gradient":
      return <PopupWireframe variant={variant} />;
    case "hero-center":
      return <HeroCenterWireframe variant={variant} />;
    case "adaptive-stage":
      return <AdaptiveWireframe />;
    case "code-snippet":
      return <CodeWireframe />;
    default:
      return null;
  }
});

// Wireframe components
const PopupWireframe = memo(({ variant }: { variant: string }) => {
  const textPosition = variant === "left" ? "left" : variant === "right" ? "right" : "center";

  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800">
      {/* Wireframe rendering */}
      {textPosition === "center" ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
          {/* Headline placeholder */}
          <div className="h-3 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
          {/* Subtitle placeholder */}
          <div className="h-2 w-1/2 rounded bg-neutral-300 dark:bg-neutral-600" />
          {/* Screenshot frame */}
          <div className="mt-4 h-24 w-40 rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
        </div>
      ) : (
        <div className="flex h-full items-center gap-6 p-6">
          {textPosition === "left" && (
            <div className="flex w-1/3 flex-col gap-2">
              <div className="h-2 w-full rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
            </div>
          )}
          <div className="h-32 flex-1 rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
          {textPosition === "right" && (
            <div className="flex w-1/3 flex-col gap-2">
              <div className="h-2 w-full rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const HeroCenterWireframe = memo(({ variant }: { variant: string }) => {
  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800">
      <div className="flex h-full items-center gap-4 p-4">
        {variant === "left" ? (
          <>
            <div className="flex w-1/2 flex-col gap-2 p-4">
              <div className="h-2 w-full rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-1/2 rounded bg-neutral-300 dark:bg-neutral-600" />
            </div>
            <div className="h-full w-1/2 rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
          </>
        ) : (
          <>
            <div className="h-full w-1/2 rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
            <div className="flex w-1/2 flex-col gap-2 p-4">
              <div className="h-2 w-full rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-2 w-1/2 rounded bg-neutral-300 dark:bg-neutral-600" />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const AdaptiveWireframe = memo(() => {
  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800">
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-full w-full rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
      </div>
    </div>
  );
});

const CodeWireframe = memo(() => {
  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800">
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-3/4 w-5/6 rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-500 p-3">
          <div className="flex flex-col gap-1">
            <div className="h-1 w-3/4 rounded bg-neutral-300 dark:bg-neutral-600" />
            <div className="h-1 w-full rounded bg-neutral-300 dark:bg-neutral-600" />
            <div className="h-1 w-2/3 rounded bg-neutral-300 dark:bg-neutral-600" />
          </div>
        </div>
      </div>
    </div>
  );
});
```

#### 2. Update components/layout-selector.tsx to use wireframes

**File**: `components/layout-selector.tsx`

**Import Wireframe Component**:
```typescript
import { WireframePreview } from "./layouts/shared/wireframe-preview";
```

**Replace Preview Rendering** (in LayoutPreviewCard component, around line 292):
```typescript
// Before
<div className="relative h-[90px] w-[160px] overflow-hidden rounded bg-background shadow-sm">
  <PreviewViewport surfaceWidth={1280} surfaceHeight={720}>
    <Provider store={previewStore}>
      <CoverPreview />
    </Provider>
  </PreviewViewport>
</div>

// After
<div className="relative h-[90px] w-[160px] overflow-hidden rounded bg-background shadow-sm">
  <WireframePreview layout={option.layout} variant={option.defaultVariant} />
</div>
```

**Remove Isolated Store Logic** (lines 270-275 - no longer needed):
```typescript
// Remove this entire block since we're not rendering full previews
const previewStore = useMemo(() => {
  const store = createStore();
  store.set(configAtom, option.previewConfig);
  store.set(assetsAtom, assets);
  return store;
}, [option.previewConfig, assets]);
```

**Simplify Preview Config Generation** (lines 62-126):
Since thumbnails are now wireframes, we don't need the complex preview config generation. We can simplify or remove this entirely, keeping only the essential config for the actual layout application.

### Success Criteria

#### Automated Verification
- [ ] Types compile: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification
- [ ] Thumbnails show wireframes (gray/neutral colors only)
- [ ] No gradients or colors in thumbnails
- [ ] Screenshot placeholders are dashed rectangles
- [ ] Text placeholders are simple gray bars
- [ ] Wireframes accurately represent geometry
- [ ] All four layouts have distinct wireframe appearances
- [ ] Dark mode wireframes are visible

---

## Phase 6: Global Search & Replace

### Changes Required

#### 1. Search for remaining "look" references

**Search Commands**:
```bash
# Find remaining look references in code
grep -r "look" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Find in domain layer
grep -r "look" domain/

# Find in components
grep -r "look" components/

# Find in hooks
grep -r "look" hooks/

# Find in docs
grep -r "look" docs/
```

#### 2. Update remaining files

Update any files found in search that haven't been covered yet:
- Demo presets
- Utility functions
- Helper hooks
- Test files

#### 3. Update documentation files

**Files**:
- `thoughts/plans/02-decouple-screenshot-gradient-from-non-screenshot-looks.md`
- `thoughts/research/005-look-gradient-screenshot-relationships.md`

Replace "look" terminology with "layout" where appropriate.

#### 4. Update root-level documentation

Check and update:
- `README.md` - if it mentions looks
- `CLAUDE.md` - if it mentions looks
- Any other markdown files

### Success Criteria

#### Automated Verification
- [ ] No "look" references in domain: `grep -r "look" domain/ | grep -v "layout-def" | wc -l` returns 0
- [ ] No "Look" component names: `grep -r "LookComponent\|LookSection\|LookSelector" . --exclude-dir=node_modules | wc -l` returns 0
- [ ] No old import paths: `grep -r "domain/look" . --exclude-dir=node_modules | wc -l` returns 0

#### Manual Verification
- [ ] No user-facing "look" text remains
- [ ] All code uses "layout" terminology
- [ ] Documentation updated consistently

---

## Phase 7: Testing & Verification

### Changes Required

#### 1. Run automated checks

```bash
# Type checking
pnpm typecheck

# Build
pnpm build

# Tests (if they exist)
pnpm test
```

#### 2. Manual testing checklist

**Layout Selection**:
- [ ] All four layouts appear in horizontal rail
- [ ] Wireframe thumbnails render correctly
- [ ] Clicking a layout applies it
- [ ] State updates when layout selected
- [ ] Selected layout has visual indicator

**Variant Switching**:
- [ ] Variant toggle works for layouts that support it
- [ ] Variant change updates rendering
- [ ] State persists variant selection

**Asset Type Switching**:
- [ ] Switching to "Code" shows code-snippet layout
- [ ] Switching to "Screenshot" shows screenshot layouts
- [ ] Last selected layout per asset type is remembered

**Text Controls**:
- [ ] Headline/subtitle inputs show based on layout capabilities
- [ ] Text changes update preview
- [ ] "This layout doesn't support text" message shows correctly

**Screenshot Upload**:
- [ ] Upload works in screenshot-supporting layouts
- [ ] Color analysis triggers
- [ ] Screenshot renders in frame

**Export**:
- [ ] Export generates correct output
- [ ] All layouts export successfully
- [ ] No console errors

**Persistence**:
- [ ] Refresh page maintains layout selection
- [ ] localStorage contains layoutId (not lookId)

### Success Criteria

#### Automated Verification
- [x] `pnpm typecheck` passes with no errors
- [x] `pnpm build` completes successfully
- [ ] No runtime errors in console
- [ ] No broken imports

#### Manual Verification
- [ ] All layout functionality works as before
- [ ] Wireframe thumbnails show geometry only
- [ ] No "look" terminology visible to users
- [ ] State management works correctly
- [ ] All four layouts render properly

---

## Phase 8: Documentation

### Changes Required

#### 1. Update domain/layout-def/README.md

**File**: `domain/layout-def/README.md`

**Content**:
```markdown
# Layout Definitions

Pure data definitions for visual layouts (compositional templates).

## Overview

This module contains layout definitions that specify how screenshots, text, and other elements are composed on the canvas. Layouts define geometry only — positioning, sizing, and aspect ratios — not styling (colors, gradients, effects).

## Architecture

**Domain layer**: Contains no React components or UI dependencies. This allows the domain to be imported by any layer without circular dependencies.

## Types

### LayoutDefinition
Pure data structure defining a layout template:
- `id`: Unique identifier (e.g., "popup-gradient", "hero-center")
- `name`: Display name (e.g., "Peak", "Spotlight")
- `description`: Brief description of the layout
- `variants`: Array of variant IDs supported by this layout
- `createConfig()`: Factory function to generate default LayoutConfig
- `capabilities`: Metadata about what features this layout supports

### LayoutCapabilities
Declares what features a layout supports:
- `focusMode`: Screenshot focus behavior
- `canvasBehavior`: How canvas dimensions are determined
- `text`: Whether headline/subtitle are required, optional, or hidden
- `screenshot`: Whether layout supports screenshots
- `logo`: Whether layout supports logo badges
- `typography`: Whether typography controls are available

## Available Layouts

1. **Peak** (`popup-gradient`): Gradient hero with headline, subtitle, and elevated screenshot frame
2. **Spotlight** (`hero-center`): Split layout with text on one side, screenshot on other
3. **Backdrop** (`adaptive-stage`): Single screenshot with adaptive sizing
4. **Code** (`code-snippet`): Formatted code snippet on gradient background

## Functions

### getLayoutDefinition(id)
Retrieve a layout definition by ID. Handles legacy ID mapping.

### supportsScreenshots(layoutId)
Check if a layout supports screenshot uploads.

### withLayoutTextDefaults(config, options)
Apply default text content based on layout capabilities.

## Authoring New Layouts

See [AUTHORING.md](./AUTHORING.md) for guidelines on creating new layouts.
```

#### 2. Update domain/layout-def/AUTHORING.md

**File**: `domain/layout-def/AUTHORING.md`

Replace all "look" references with "layout" and update guidance to emphasize geometry-only design.

#### 3. Update CLAUDE.md (if needed)

**File**: `/Users/adrianpilarczyk/Code/dopeshot/CLAUDE.md`

Search for "look" references and update to "layout" if found.

#### 4. Create migration note

**File**: `docs/product/MIGRATIONS.md` (new file or append to existing)

```markdown
## Looks → Layouts Rename (2024-12-16)

### Overview
Renamed "looks" to "layouts" throughout the codebase to better reflect their purpose: defining compositional geometry, not complete visual styles.

### Breaking Changes
- `domain/look/` moved to `domain/layout-def/`
- All types renamed: `LookDefinition` → `LayoutDefinition`, etc.
- Atoms renamed: `currentLookAtom` → `currentLayoutAtom`, etc.
- Components renamed: `LookSelector` → `LayoutSelector`, etc.
- Config property: `lookId` → `layoutId`

### Migration Guide
If you have code importing from the old paths:

```typescript
// Before
import { LookDefinition, LOOK_DEFINITIONS } from "@/domain/look/definitions";
import { currentLookAtom } from "@/hooks/atoms/derived";

// After
import { LayoutDefinition, LAYOUT_DEFINITIONS } from "@/domain/layout-def/definitions";
import { currentLayoutAtom } from "@/hooks/atoms/derived";
```

### Thumbnail Changes
Layout thumbnails now show wireframe previews (geometry only) instead of colored styled previews. This better communicates that layouts define structure, not complete visual treatment.
```

### Success Criteria

#### Automated Verification
- [ ] Markdown files render correctly
- [ ] All links and references are valid

#### Manual Verification
- [ ] README.md is comprehensive and accurate
- [ ] AUTHORING.md provides clear guidelines
- [ ] Migration notes document breaking changes
- [ ] All documentation uses "layout" terminology consistently

---

## Rollback Plan

If issues arise during implementation:

### Immediate Rollback (Git)
```bash
# Revert all changes
git reset --hard HEAD

# Or revert specific commits
git revert <commit-hash>
```

### Partial Rollback

If only certain phases are problematic:

1. **Domain Layer Issues**: Revert domain/layout-def/ changes, restore domain/look/
2. **State Issues**: Revert hooks/atoms.ts and hooks/atoms/derived.ts
3. **Component Issues**: Revert components/layouts/ and related components
4. **Wireframe Issues**: Revert wireframe-preview.tsx and restore preview rendering in layout-selector.tsx

### Data Migration

The rename doesn't affect persisted data significantly, but if localStorage issues arise:

```typescript
// Migration helper (add to hooks/atoms.ts if needed)
function migrateLocalStorage() {
  const oldData = localStorage.getItem("dopeshot:lastLookByAssetType");
  if (oldData && !localStorage.getItem("dopeshot:lastLayoutByAssetType")) {
    localStorage.setItem("dopeshot:lastLayoutByAssetType", oldData);
  }
}
```

---

## Timeline Estimate

- Phase 1 (Domain): 30 minutes
- Phase 2 (State): 20 minutes
- Phase 3 (Registry): 30 minutes
- Phase 4 (Components): 45 minutes
- Phase 5 (Wireframes): 60 minutes
- Phase 6 (Search): 30 minutes
- Phase 7 (Testing): 45 minutes
- Phase 8 (Documentation): 30 minutes

**Total**: ~4-5 hours for complete implementation and verification

---

## Notes

- This refactor follows the precedent set by the `looks.ts → definitions.ts` refactor (commit 1228103)
- Domain purity is maintained throughout - domain layer has no React dependencies
- Backward compatibility can be added if needed (legacy ID mapping in getLayoutDefinition)
- Wireframe thumbnails improve the mental model: layouts = geometry, not complete styling
- All functionality is preserved; only terminology and thumbnail appearance change
