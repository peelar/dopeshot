# Implementation Plan: Domain Architecture Refactor

## Overview

Refactor the domain layer to eliminate architectural violations and establish clear separation of concerns. The current architecture has domain logic importing UI components, creating circular dependencies and tight coupling between layers.

## Implementation Approach

We'll use a phased approach to safely untangle dependencies without breaking existing functionality:

1. **Phase 1**: Decouple Look definitions from React components
2. **Phase 2**: Clarify gradient logic boundaries
3. **Phase 3**: Abstract browser APIs with adapters (optional/future)

Each phase can be verified independently and rolled back if needed.

---

## Phase 1: Decouple Look Definitions from Components

### Problem

`domain/look/looks.ts` imports React components, creating a circular dependency: Component → Domain Types → Domain Registry → Component.

### Changes Required

#### 1. Create Domain Look Definitions

**File**: `domain/look/definitions.ts`
**Changes**: Extract pure data definitions from `looks.ts`

```typescript
export interface LookDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: {
    supportsGradient: boolean;
    supportsPattern: boolean;
    supportsCustomBackground: boolean;
    supportsScreenshotMode: boolean;
  };
  createConfig: (asset?: Asset) => LookSpecificConfig;
}

export const LOOK_DEFINITIONS: LookDefinition[] = [
  {
    id: "popup-gradient",
    name: "Popup Gradient",
    description: "Floating screenshot with gradient background",
    capabilities: {
      supportsGradient: true,
      supportsPattern: false,
      supportsCustomBackground: true,
      supportsScreenshotMode: true,
    },
    createConfig: (asset) => ({
      // ... existing logic from looks.ts
    }),
  },
  // ... other looks
];

export function getLookDefinition(id: string): LookDefinition | undefined {
  return LOOK_DEFINITIONS.find((look) => look.id === id);
}
```

#### 2. Create Component Registry

**File**: `components/looks/registry.ts`
**Changes**: Map look IDs to React components

```typescript
import { PopupGradient } from "./PopupGradient";
import { HeroCenter } from "./HeroCenter";
import { AdaptiveScreenshot } from "./AdaptiveScreenshot";
import type { LookDefinition } from "@/domain/look/definitions";

export type LookComponent = React.ComponentType<{
  config: LayoutConfig;
  onConfigChange?: (config: LayoutConfig) => void;
}>;

export const LOOK_COMPONENTS: Record<string, LookComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-screenshot": AdaptiveScreenshot,
};

export function getLookComponent(id: string): LookComponent | undefined {
  return LOOK_COMPONENTS[id];
}
```

#### 3. Update Look Selector Component

**File**: `components/look-selector.tsx`
**Changes**: Import from both registries

```typescript
import { LOOK_DEFINITIONS } from "@/domain/look/definitions";
import { getLookComponent } from "@/components/looks/registry";

// Use LOOK_DEFINITIONS for metadata/UI
// Use getLookComponent() to render the actual component
```

#### 4. Update Playground Workspace

**File**: `components/playground-workspace.tsx`
**Changes**: Use component registry to render current look

```typescript
import { getLookComponent } from "@/components/looks/registry";

// In render:
const LookComponent = getLookComponent(config.look);
if (!LookComponent) return <div>Look not found</div>;
return <LookComponent config={config} onConfigChange={onConfigChange} />;
```

#### 5. Remove Old File

**File**: `domain/look/looks.ts`
**Changes**: Delete after migration complete

### Success Criteria

#### Automated Verification

- [x] Build passes: `pnpm run build`
- [x] Tests pass: `pnpm test:domain`, `pnpm test:ui`
- [x] Types check: `pnpm run typecheck`
- [x] No circular dependencies detected

#### Manual Verification

- [ ] Look selector displays all looks correctly
- [ ] Switching between looks works as before
- [ ] No console errors or warnings
- [ ] Each look renders with correct default config

---

## Phase 2: Clarify Gradient Logic Boundaries

### Problem

Ambiguity between `domain/gradient-generation` (service) and `domain/layout/gradients` (model). Need clear dependency direction.

### Changes Required

#### 1. Review and Document Gradient Modules

**File**: `domain/layout/gradients/types.ts`
**Changes**: Add JSDoc clarifying this is the model layer

```typescript
/**
 * Gradient Data Models
 *
 * This module defines the shape of gradient data used throughout layouts.
 * It does NOT contain generation/extraction logic - see domain/gradient-generation.
 */

export interface Gradient {
  // ... existing types
}
```

**File**: `domain/gradient-generation/index.ts`
**Changes**: Add JSDoc clarifying this is the service layer

```typescript
/**
 * Gradient Generation Service
 *
 * Intelligence layer for color extraction and gradient creation.
 * Depends on: domain/layout/gradients (for types)
 * Used by: UI components and hooks
 */
```

#### 2. Audit Imports

**Action**: Verify dependency direction

- [ ] `gradient-generation` can import from `layout/gradients` (for types)
- [ ] `layout/gradients` should NOT import from `gradient-generation`
- [ ] If violations exist, refactor to extract shared types

#### 3. Update README or Index

**File**: `domain/README.md` (create if needed)
**Changes**: Document the subdomain structure

```markdown
# Domain Layer

## Structure

- `asset/` - Asset models and upload orchestration
- `demo/` - Demo presets and sample data
- `gradient-generation/` - Service: Color extraction and gradient algorithms
- `layout/` - Layout models, config, and data structures
  - `gradients/` - Model: Gradient types and utilities
- `look/` - Look definitions (pure data)

## Dependencies

- `gradient-generation` → `layout/gradients` (for types)
- No circular dependencies
- No React/UI imports in domain layer
```

### Success Criteria

#### Automated Verification

- [x] Build passes: `pnpm run build`
- [x] Types check: `pnpm run typecheck`
- [x] Run `pnpm knip` - no unused exports in gradient modules

#### Manual Verification

- [x] Documentation clearly explains gradient module responsibilities
- [x] No circular imports between gradient modules
- [x] Color analysis and gradient generation work as before (verified via tests)

---

## Phase 3: Abstract Browser APIs (Future/Optional)

### Problem

`domain/asset/upload-orchestrator.ts` uses `FileReader`, coupling domain to browser environment.

### Rationale for "Optional"

This is acceptable for a client-side-only app. Only pursue if:

- Planning server-side rendering
- Planning Node.js utilities
- Planning comprehensive unit tests of domain logic

### Changes Required (if needed)

#### 1. Create File Reader Adapter

**File**: `domain/asset/adapters.ts`
**Changes**: Define interface for file operations

```typescript
export interface FileAdapter {
  readAsDataURL(file: File): Promise<string>;
}

export class BrowserFileAdapter implements FileAdapter {
  readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
```

#### 2. Update Upload Orchestrator

**File**: `domain/asset/upload-orchestrator.ts`
**Changes**: Accept FileAdapter as dependency

```typescript
export async function processUpload(
  file: File,
  adapter: FileAdapter = new BrowserFileAdapter(),
): Promise<Asset> {
  const dataUrl = await adapter.readAsDataURL(file);
  // ... rest of logic
}
```

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm run build`
- [ ] Tests pass with mock adapter: `pnpm test`
- [ ] Types check: `pnpm run typecheck`

#### Manual Verification

- [ ] File upload works identically in browser
- [ ] Tests can inject mock adapter for deterministic testing

---

## Rollback Plan

### Phase 1

If issues arise after decoupling looks:

1. `git revert <commit>` to restore `domain/look/looks.ts`
2. Remove `domain/look/definitions.ts` and `components/looks/registry.ts`
3. Restore original imports in affected components

### Phase 2

Documentation-only changes - simply revert commits if needed.

### Phase 3

1. Remove adapter interface
2. Restore direct FileReader usage in upload-orchestrator
3. Update tests to use browser environment

## Post-Implementation

After completing Phase 1 and 2:

- [ ] Run `pnpm knip` to identify any unused exports
- [ ] Update `agents.md` with new domain structure conventions
- [ ] Consider adding architecture tests to prevent regressions
