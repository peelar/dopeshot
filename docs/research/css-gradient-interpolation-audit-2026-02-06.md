# CSS Gradient Interpolation Audit (2026-02-06)

## Scope
- Audit DopeShot's current gradient interpolation behavior.
- Compare sRGB vs Oklab vs OKLCH interpolation outcomes.
- Review `shorter hue` / `longer hue`, `color-mix()`, and conic gradient opportunities.
- Check implementation path and browser support.

## 1) Current State Audit

### What the data model says
- Gradient configs are authored with `colorSpace: "oklch"` in multiple places.
  - `apps/app/src/domain/layout/gradients/generator.ts:65`
  - `apps/app/src/domain/layout-def/definitions.ts:16`

### What the renderer actually outputs
- Color-space emission is currently disabled:
  - `isColorSpaceSupported()` always returns `false` in `apps/app/src/domain/layout/gradients/utils.ts:12`
  - so `in oklch` / `in oklab` is never appended in `apps/app/src/domain/layout/gradients/utils.ts:16`
- Final CSS for linear/radial/conic gradients is built without interpolation method syntax.
  - `apps/app/src/domain/layout/gradients/utils.ts:200`
- For "simple" gradients, layout-specific rendering also drops color-space info and outputs plain `linear-gradient(...)`.
  - `apps/app/src/components/layouts/shared/background-style.ts:77`
  - `apps/app/src/components/layouts/shared/background-style.ts:105`

### Additional observations
- `GradientColorSpace` currently allows `"oklch" | "srgb" | "lab"` (no explicit `"oklab"` option).
  - `apps/app/src/domain/layout/gradients/types.ts:41`
- `conic-gradient(...)` output path exists, but current generators do not create conic gradients.
  - Render path: `apps/app/src/domain/layout/gradients/utils.ts:243`
- No current usage of:
  - `color-mix(...)`
  - `shorter hue` / `longer hue`

## Verdict
DopeShot stores modern interpolation intent in data, but runtime CSS currently falls back to legacy/default interpolation behavior for produced gradients.

## 2) sRGB vs Oklab vs OKLCH (midpoint comparisons)

Computed midpoint (`t=0.5`) comparisons for representative pairs:

| Pair | sRGB midpoint | Oklab midpoint | OKLCH midpoint (`shorter hue`) | OKLCH midpoint (`longer hue`) |
|---|---|---|---|---|
| `#ff0000 -> #00ff00` | `#808000` | `#d0a800` | `#f99500` | `#5999ff` |
| `#ff0066 -> #00d4ff` | `#806ab3` | `#c693b2` | `#b085ff` | `#a3b100` |
| `#f59e0b -> #6366f1` | `#ac827e` | `#a98da6` | `#e95ea0` | `#00ba8e` |
| `#00ff88 -> #ff00aa` | `#808099` | `#ceab9f` | `#ff8c00` | `#00b4ff` |
| `#ff4d00 -> #00a1ff` | `#807780` | `#b18a9e` | `#cd65e0` | `#3eb42d` |

Practical takeaway:
- sRGB can produce dull or muddy midpoints for high-chroma opposites.
- Oklab tends to keep smoother perceived lightness.
- OKLCH enables deliberate hue-path art direction (`shorter` vs `longer`).

## 3) When Each Interpolation Is Better

- sRGB:
  - Best for strict legacy compatibility.
  - Often weakest visually for saturated opposite hues.
- Oklab:
  - Best default for perceptual smoothness and "clean" transitions.
  - Good for most screenshot-derived background gradients.
- OKLCH:
  - Best when hue travel itself is part of the look.
  - Use `shorter hue` for direct transitions; `longer hue` for dramatic scenic sweeps.

## 4) `shorter hue` vs `longer hue`

For polar color spaces (like OKLCH/HSL), hue can move around the wheel in different directions:
- `shorter hue`: shortest angular path (usually less dramatic).
- `longer hue`: long-way-around path (often more vibrant/dramatic).

For spotlight/conic styles, this is one of the strongest visual control levers.

## 5) `color-mix()` for Midpoint Control

Use-case:
- Inject a controlled midpoint color in perceptual space without hand-authoring all stops.

Example:
```css
--start: #f59e0b;
--end: #6366f1;
--mid: color-mix(in oklab, var(--start) 50%, var(--end));
background: linear-gradient(
  135deg in oklab,
  var(--start) 0%,
  var(--mid) 50%,
  var(--end) 100%
);
```

This helps avoid dead zones and gives deterministic center-tone shaping.

## 6) Conic Gradients for Spotlight/Radial Effects

Conic gradients are already supported by the renderer path in code, and can be upgraded with interpolation controls:

```css
background:
  conic-gradient(
    from 210deg at 70% 35% in oklch longer hue,
    #f59e0b,
    #ec4899,
    #6366f1,
    #f59e0b
  );
```

Recommended use:
- Peak/Spotlight looks where directional color flow supports screenshot focal direction.

## 7) Browser Support / Baseline Check

- Gradient interpolation methods in CSS gradients: Baseline Newly Available 2023.
  - Includes `in oklab`, `in oklch`, etc.
- Hue interpolation method (`shorter hue`, `longer hue`, etc.): Baseline 2024.
- `color-mix()`: broadly available in current evergreen browsers (Baseline era feature).

Given DopeShot's product constraints, these features are now practical with fallback.

## 8) Recommended Implementation Plan

1. Enable interpolation syntax emission in `customGradientToCss()`.
2. Preserve interpolation info in layout-specific simple gradient path (`background-style.ts`).
3. Expand model to include `oklab` explicitly (currently type only includes `oklch|srgb|lab`).
4. Add optional `hueInterpolation?: "shorter" | "longer" | "increasing" | "decreasing"` on advanced gradients.
5. Add optional midpoint support:
   - Either explicit stop (`50%`) or computed `color-mix(in oklab, ...)`.
6. Add one conic screenshot-derived option for spotlight layouts.
7. Guard with `@supports` fallback:
   - modern: `linear-gradient(135deg in oklab, ...)`
   - fallback: plain `linear-gradient(135deg, ...)`

## 9) Product Recommendation

Should DopeShot adopt modern interpolation? Yes.

Why:
- Current pipeline intends perceptual interpolation but does not render it.
- Visible quality wins are strongest on saturated/complementary screenshot palettes.
- The feature set is mature enough for production with straightforward fallback.

Should interpolation controls be exposed to users?
- Phase 1: keep automatic (`oklab` default; selective `oklch longer hue` for conic/hero presets).
- Phase 2: optional advanced toggle for "Hue path" only if users request finer control.

## Sources
- MDN: `<color-interpolation-method>` (includes hue method syntax and baseline note)  
  https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method
- MDN: `conic-gradient()` (supports interpolation method syntax)  
  https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient
- MDN: `color-mix()`  
  https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- web.dev Baseline update for `color-mix()` (2023)  
  https://web.dev/blog/color-mix-baseline
- Web Platform / Baseline feature data: gradient interpolation methods  
  https://web-platform-dx.github.io/web-features-explorer/features/gradient-interpolation/
- caniuse dataset for gradient interpolation methods  
  https://caniuse.com/mdn-css_types_color_interpolation_method
- CSS Color spec discussion of interpolation defaults and compatibility constraints  
  https://w3c.github.io/csswg-drafts/css-color-4/
