# Domain Structure Analysis & Research

**Date:** December 7, 2025
**Scope:** `@/domain` folder structure and architectural integrity.

## 1. Current Structure Analysis

The `domain` folder is currently organized into these main areas:

*   **`asset/`**: Handles file uploads, metadata extraction, and color analysis.
    *   *Status*: **Healthy**. It focuses on a specific subdomain (handling raw assets) and is relatively self-contained.
*   **`layout/`**: A "catch-all" directory for the editor's visual state.
    *   *Contents*: It defines the core `LayoutConfig` (the "Redux store" equivalent of the app), but also includes font definitions, pattern logic, aspect ratios, and export logic.
    *   *Status*: **Overloaded**. The name "layout" under-represents its responsibility. It effectively manages the **Editor State** and **Visual Primitives**.
    *   *Confusion*: It contains a `gradients/` folder which overlaps conceptually with the top-level `gradient-generation/`.
*   **`look/`**: Defines the "templates" or "presets" (Looks).
    *   *Status*: **Coupled**. It imports React components directly (`PopupGradient`, etc.), which violates the boundary between "Domain Logic" and "UI/Presentation".
*   **`gradient-generation/`**: Contains complex logic for extracting and building gradients from images.
    *   *Status*: **Isolated**. It contains pure logic but feels disconnected from `layout/gradients`.

## 2. Identified Gaps & Violations

1.  **Domain/UI Coupling (Critical)**:
    *   `domain/look/looks.ts` imports React components (`import { PopupGradient } ...`).
    *   **Impact**: Domain logic cannot be tested without a DOM environment (or mocking complex components). It creates a circular dependency where the Domain depends on the UI, and the UI depends on the Domain.
2.  **Naming Ambiguity**:
    *   `LayoutConfig` controls colors, text, and assets, not just "layout" (positioning).
    *   `gradient-generation` vs `layout/gradients`: One is the *algorithm* (how to make it), the other is the *model* (what it is). They are split across the tree.
3.  **"Utils" Anti-pattern**:
    *   Files like `layout/gradients/utils.ts` and `gradient-generation/utils.ts` often hide important domain rules that should be explicit entities or services.

## 3. Recommendations

To better structure the domain knowledge, the following evolution is recommended:

### Phase 1: Decouple UI from Domain (High Priority)
Remove React component references from `domain/look`. Use a **Registry Pattern**.

*   **Current**:
    ```typescript
    // domain/look/looks.ts
    import { PopupGradient } from "@/components/looks/PopupGradient";
    export const LOOKS = [{ component: PopupGradient, ... }];
    ```
*   **Proposed**:
    ```typescript
    // domain/look/looks.ts (Pure TS)
    export const LOOKS = [{ componentId: "popup-gradient", ... }];

    // components/looks/registry.ts (UI Layer)
    import { PopupGradient } from "./PopupGradient";
    export const LOOK_COMPONENTS = { "popup-gradient": PopupGradient };
    ```

### Phase 2: Restructure Directories (Medium Priority)
Group related concepts by **Feature** or **Bounded Context** rather than technical function.

**Proposed Structure:**

```text
domain/
├── assets/                 # (No change) Uploads, metadata, analysis
├── editor/                 # (Renamed from layout)
│   ├── config.ts           # Defines LayoutConfig (State)
│   ├── defaults.ts         # Default states
│   └── types.ts
├── graphics/               # (New) Visual Primitives
│   ├── fonts/              # Font definitions
│   ├── gradients/          # Merges layout/gradients + gradient-generation
│   │   ├── generator/      # The complex extraction logic
│   │   ├── models.ts       # Type definitions
│   │   └── presets.ts
│   ├── patterns/           # Grain, overlays
│   └── formats/            # Aspect ratios, sizes
└── looks/                  # (Refactored) Pure config definitions
```

## 4. Best Practices for Domain Knowledge

1.  **Pure TypeScript**: Files in `domain/` should generally *not* import `.tsx` files or React hooks. They should describe *what* the application does, not *how* it renders.
2.  **Explicit Boundaries**:
    *   **Entities**: Core data structures (e.g., `LayoutConfig`, `Asset`).
    *   **Services**: Stateless logic (e.g., `GradientGenerator`, `ColorAnalyzer`).
    *   **Factories**: Functions that create default states (e.g., `createConfig()`).
3.  **Collocation**: Concepts should be grouped by their business purpose. If `fonts.ts` is only used by `LayoutConfig`, it belongs near it. If Fonts are a shared concept used by the Landing Page and the App, they belong in a shared `graphics` or `theme` domain.

