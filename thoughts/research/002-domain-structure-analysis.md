# Research: Domain Structure Analysis

## Overview

The `domain` folder serves as the core business logic layer for dopeshot. It is structured into subdomains: `asset`, `demo`, `gradient-generation`, `layout`, and `look`. The separation generally follows good Domain-Driven Design (DDD) principles, isolating business rules from UI components. However, there are some architectural layer violations (domain importing components) and overlapping responsibilities in gradient handling.

## Key Files & Locations

| File | Purpose | Key Responsibilities |
|Data Structure|-----------------|----------------------|
| `domain/asset/types.ts` | Asset Models | Defines `Asset`, `ColorPalette`, `ImageMetadata`. |
| `domain/layout/types.ts` | Layout Models | Defines `LayoutConfig` (the core state), `BackgroundConfig`. |
| `domain/look/looks.ts` | Look Registry | Defines available looks, their capabilities, and default configurations. **Note:** Currently imports React components. |
| `domain/gradient-generation/` | Gradient Service | Algorithms for extracting colors from images and building gradients. |
| `domain/layout/gradients/` | Gradient Models | Types, CSS generation, and presets for gradients used in layouts. |
| `domain/asset/upload-orchestrator.ts` | Upload Logic | Handles file reading and metadata extraction. |

## Architecture & Data Flow

1.  **Core State**: The application state is centered around `LayoutConfig` (in `domain/layout/types.ts`), which describes the entire visual output.
2.  **Assets**: Files are processed via `upload-orchestrator`, metadata is extracted, and they become `Asset` objects.
3.  **Looks**: A "Look" is a combination of a configuration schema (`createConfig`) and a visual implementation. Currently, these are coupled in `domain/look/looks.ts`.
4.  **Gradients**:
    *   `gradient-generation` acts as a "service" to analyze images and propose gradients.
    *   `layout/gradients` defines the data structure and rendering logic for those gradients within a layout.

## Findings & Gaps

### 1. Layer Violation in `domain/look/looks.ts`
The domain file `domain/look/looks.ts` imports React components (`PopupGradient`, `HeroCenter`, etc.) from `components/looks/`.
*   **Issue**: This makes the domain layer depend on the presentation layer. It causes circular dependencies (Component -> Domain Types -> Domain Registry -> Component).
*   **Impact**: Harder to test domain logic in isolation; changes to UI components trigger domain rebuilds.

### 2. Gradient Logic Overlap
There is ambiguity between `domain/gradient-generation` and `domain/layout/gradients`.
*   `gradient-generation`: Complex logic, color extraction, strategy (Service-like).
*   `layout/gradients`: Types, Utils, CSS conversion (Model-like).
*   **Gap**: The distinction isn't strictly enforced, and `layout` seems to own "applying" gradients while `gradient-generation` owns "creating" them.

### 3. Browser APIs in Domain
`domain/asset/upload-orchestrator.ts` uses `FileReader`.
*   **Observation**: The domain layer is coupled to the Browser environment. For a client-side app, this is often acceptable, but it limits the ability to run this logic in a Node.js context (e.g., for server-side OG image generation) without polyfills.

## Recommendations

### 1. Decouple Looks from Components
Split `domain/look/looks.ts` into two parts:
1.  **Domain Definition (`domain/look/definitions.ts`)**: Pure data. Contains ID, metadata, capabilities, and `createConfig` factory.
2.  **Component Registry (`components/looks/registry.ts`)**: Maps Look IDs to React Components.

**Current:**
```typescript
// domain/look/looks.ts
import { HeroCenter } from "@/components/looks/HeroCenter";
export const LOOKS = [{ id: "hero", component: HeroCenter, ... }];
```

**Proposed:**
```typescript
// domain/look/definitions.ts
export const LOOK_DEFINITIONS = [{ id: "hero", ... }];

// components/looks/registry.ts
import { LOOK_DEFINITIONS } from "@/domain/look/definitions";
import { HeroCenter } from "./HeroCenter";

export const LOOK_COMPONENTS = {
  "hero": HeroCenter
};
```

### 2. Consolidate Gradient Logic
Clarify the boundaries:
*   Keep `domain/gradient-generation` as the "Intelligence" layer (pure logic/math).
*   Keep `domain/layout/gradients` as the "Data/Model" layer (types, simple utils).
*   Ensure `gradient-generation` only depends on `layout/gradients` (for types), not vice versa.

### 3. Best Practices for Domain Knowledge
*   **Colocation**: Keep pure logic in `domain/`.
*   **Platform Agnostic**: Try to keep `domain` free of React/Browser specifics where possible. Use "Adapters" or "Hooks" in the application layer to bridge Domain logic to the UI.
*   **Types First**: Define the shape of data (`types.ts`) before the logic that manipulates it.








