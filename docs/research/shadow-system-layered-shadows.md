# Shadow System Research: Layering + Modern Color

Date: February 6, 2026
Branch: `peelar/layered-shadow-study`

## Scope

Evaluate DopeShot's screenshot/frame shadows for:
- Layered realism (contact + ambient)
- Shadow color tinting (instead of pure black)
- Light-direction consistency
- Performance impact of multi-layer shadows

## 1) Audit of Current Implementation (Before Changes)

### What we had

- Standard presets were single-layer black shadows:
  - `low`: `0 2px 8px rgba(0, 0, 0, 0.08)`
  - `medium`: `0 4px 16px rgba(0, 0, 0, 0.15)`
  - `high`: `0 12px 40px rgba(0, 0, 0, 0.3)`
  - Source: `apps/app/src/components/layouts/shared/shadows.ts`
- Personality shadows were:
  - Usually one black layer
  - Two layers only when `tint` existed
  - Source: `apps/app/src/components/layouts/shared/shadows.ts`
- Frame fallbacks in `screenshot-frame.ts` were also single-layer strings.
- Light direction was implicitly top-down (`x=0`, positive `y`) but not represented as layered contact + ambient structure.
- Relative color syntax (e.g. `oklch(from ...)`) was not used.

## 2) Would Layered/Tinted Shadows Improve Visual Output?

### Finding

Yes, meaningfully, especially for screenshot-heavy layouts:
- Single shadows look flatter and "cut-out."
- Layered shadows improve depth cues:
  - Tight contact layer anchors the screenshot to the canvas.
  - Softer ambient layers add elevation without harsh edges.
- Background-aware tinting reduces the "black sticker" look on colorful gradients.

### Decision

Implement layered shadows now, while keeping existing `low|medium|high` API surface for compatibility.

## 3) Performance Implications

### Cost profile

- Multi-layer `box-shadow` increases paint/compositing work vs single-layer.
- In this product context, risk is moderate because:
  - Usually 1 screenshot frame per layout.
  - Shadows are not animated every frame.
  - Export uses a one-shot render path (`html-to-image`), not continuous animation.

### Guardrails

- Keep layers to 4-5 max.
- Use one stable direction across layers (same axis) to avoid visual noise.
- Avoid animating blur/offset continuously.

## Implemented Changes

### A) Layered contact + ambient presets

- Replaced single-layer presets with structured layered recipes:
  - `low`: 4 layers
  - `medium`: 5 layers
  - `high`: 5 layers
- File: `apps/app/src/components/layouts/shared/shadows.ts`

### B) Background-aware tinting

- Added color-aware shadow palette generation (`contact` + `ambient`) using the active background color hint.
- Shadow colors now blend toward a deep neutral while retaining hue influence from the surface.
- Files:
  - `apps/app/src/components/layouts/shared/shadows.ts`
  - `apps/app/src/components/layouts/shared/layout-primitives.tsx`

### C) Personality shadows upgraded

- Personality shadows now render as layered stacks (4 layers + optional tint layer).
- Existing `tint` still works and is preserved as an extra ambient layer.
- File: `apps/app/src/components/layouts/shared/shadows.ts`

### D) Frame fallback shadows aligned

- Fallback frame shadows now use the same layered preset engine.
- File: `apps/app/src/components/layouts/shared/screenshot-frame.ts`

### E) Tests

- Added tests for:
  - Layer count per preset
  - Default fallback behavior
  - Personality layering + tint insertion
  - Zero-shadow behavior
  - Surface-color tint differentiation
- File: `apps/app/tests/ui/shadows.test.ts`

## Recommendation

- Keep the new layered/tinted model as default.
- If we later expose explicit style names (`subtle`, `card`, `floating`, `dramatic`), map them internally to the same layered recipe system.
- Defer direct relative-color syntax (`oklch(from ...)`) until export/browser support is validated across the full target matrix.
