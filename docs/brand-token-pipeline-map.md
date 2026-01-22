# DopeShot Pipeline + Brand Token Mapping

## 1. Current pipeline architecture

### Upload → render flow
1. **Upload + validation**
   - `useFileUpload` validates file type/size, reads the file, and calls `processFileUpload`.
   - `processFileUpload` reads the file as a data URL, extracts metadata + aspect category, and creates a local `Asset`.
   - Files are stored in local state (`assetsAtom`) rather than immediately persisted.

2. **Initial config changes**
   - For screenshot uploads:
     - `config.assets.screenshot` is set.
     - Background is set to `solid` `slate-100`.
     - Layout may change based on aspect ratio (via `applyLayoutRecommendation`).
     - Default copy is injected if title/subtitle are blank.
   - For background uploads:
     - `config.background` becomes `image`.
     - Text color is re-derived from background contrast.

3. **Color analysis + gradient generation**
   - `useColorAnalysis` runs `analyzeColors` and stores a `ColorPalette` on the screenshot asset.
   - A `ColorSource` is created from the palette and passed to `useGradientGeneration`.
   - `useGradientGeneration` builds gradient options, picks the first, applies preferred angle, and writes a `customGradient` into the config background.

4. **Render pipeline**
   - `useLayoutPrimitives` synthesizes `backgroundStyle`, typography, shadows, and screenshot treatment.
   - `LayoutSurface` renders the background plus overlays (`PatternOverlay` → `OrganicBlobsOverlay` + `GrainOverlay`).

### Discrete transformations
- File → data URL + metadata
- Metadata → layout recommendation
- Screenshot → `ColorPalette`
- `ColorPalette` → `CustomGradient`
- `CustomGradient` → CSS background
- Layout + config → screenshot treatment + typography
- Pattern overlays + grain → final composition

### Where user choices affect output
- Layout selection + variants
- Background type (gradient / solid / image) + preset
- Font style, title/subtitle, text color token
- Screenshot frame preset + shadow intensity
- Background pattern choice (organic blobs) and grain (implicitly on)
- Screenshot zoom and logo usage

---

## 2. Existing brand token system

### Defined tokens
- `brandSettingsAtom` persists the following:
  - `logoUrl`, `logoPath`
  - `useLogoOnScreenshots`
  - `accent`
  - `mode` (`light`/`dark`)
  - `personality` (technical, business, creative, friendly, premium)

### Storage + structure
- Stored in localStorage under `dopeshot:brandSettings`.
- Brand-related schemas live in `lib/types/brand.ts`:
  - `BrandColorPalette` (primary/secondary/accent/background/text + mode)
  - `BrandTypography` (heading/body fonts + optional weights)
  - Additional schemas for asset metadata, flags, onboarding, etc.

### Current effects
- Brand **logo** can be fetched and auto-applied into `config.assets.logo`.
- Brand **accent/mode/personality** are saved and editable but do not affect rendering yet.
- Gradient pipeline includes a `ColorSourceType` of `brand`, but it is not wired in.

---

## 3. Visual parameters inventory

| Parameter | Location | Control type |
| --- | --- | --- |
| Layout ID + variant | `LayoutConfig` | user + auto (aspect-based)
| Background type/value/custom gradient | `LayoutConfig.background` | user + auto
| Background pattern (grain, organic blobs) | `PatternOverlay` | mostly auto (grain always on for non-image)
| Text color token | `config.colors.text` | auto (contrast) + user
| Accent/background tokens | `config.colors` | user/default
| Typography style | `config.fontStyle` + adaptive text | user
| Screenshot shadow intensity | `config.screenshotShadow` | user/default
| Screenshot frame preset/canvas mode | `config.screenshotFrame` | user/default
| Screenshot zoom | `screenshotZoomAtom` | user
| Logo usage | `config.assets.logo` | user (toggle)
| Background image | asset selection | user
| Grain opacity/texture sizes | `GrainOverlay` | hardcoded
| Blob positions/radii/opacities | `OrganicBlobsOverlay` | hardcoded
| Shadow presets | `shadows.ts` | hardcoded

---

## 4. Color pipeline (detailed)

### Sampling
- `analyzeColors` extracts a `ColorPalette` (dominant/accent/muted/vibrant).
- Palette is stored on the screenshot asset (`asset.colorPalette`).

### Gradient generation
- `generateGradientOptions` enhances the palette (OKLCH), enforces separation, and generates:
  - 3 linear gradients (multi-color / complementary / analogous / triadic)
  - 1 mesh gradient
- Gradient geometry is based on aspect category (portrait, landscape, ultrawide, square).
- Final gradient angle can be adjusted via `GradientPreferences`.

### Render
- `getBackgroundStyle` converts `customGradient` to CSS and applies layout-specific geometry.
- Organic blob overlay pulls first + last gradient colors as blob fills.

### Injection opportunities
- `ColorSourceType` already supports `brand` and is used to track gradient provenance.
- `useGradientGeneration` accepts any `ColorSource`, so a brand palette could be injected before/alongside screenshot palettes.

---

## 5. Opportunity map (levers + hardcoded)

### Highest-impact parameters for saved brand style (with quality guardrails)
- **Background personality (brand-aligned but quality-first)**: The paid value is *consistency without sacrificing beauty*. Brand colors should guide the gradient *only when they improve or preserve quality*—not force a brand palette that makes a screenshot look worse. This maps to `background.customGradient` + `gradientPreferences.angle` and is the biggest lever for a recognizable visual identity, but it must be gated by quality checks.
- **Text legibility + tone**: Text color is picked for contrast today; paid users can aim for a consistent brand-safe text tone *as long as contrast passes*. If it fails, we must fall back to auto-contrast (`config.colors.text`).
- **Accent framing (opt-in, not forced)**: Accent/background tokens drive fallback gradients and blob colors. For paid users, accent influence should be *conditional* (only used when it improves palette richness), not guaranteed (`config.colors.accent`, `config.colors.background`).
- **Typography system**: `fontStyle` is already a strong “brand personality” lever. Paid users get a consistent typographic signature across exports without touching the screenshot colors.
- **Screenshot frame polish**: `screenshotFrame` + `screenshotShadow` are high-leverage style controls that don’t degrade background quality.
- **Pattern texture**: `patternId` controls clean vs expressive overlays and can be safely persisted without harming color harmony.

### If we pursue brand-driven gradients (plan + guardrails)
**Goal:** Consistent outputs that still look “designed,” not forced or muddy.

1. **Define a quality gate before applying brand colors**
   - Evaluate contrast, saturation, and color separation on any brand-influenced gradient.
   - If the gradient fails, fall back to screenshot-derived gradients.

2. **Blend rather than replace**
   - Treat screenshot colors as the baseline.
   - Inject brand colors as *hints* (e.g., nudge one stop toward brand accent) rather than full replacements.
   - Keep a “brand intensity” scalar (0 → screenshot only, 1 → brand heavy) and clamp based on quality score.

3. **Generate multiple candidates, then score**
   - Create gradient candidates using: screenshot-only, brand-only, and mixed palette variants.
   - Score each candidate on: contrast for text, chromatic separation, saturation balance, and visual distinctiveness.
   - Pick the top scorer, not the most brand-saturated option.

4. **Guarantee diversity + “interestingness”**
   - Ensure at least one candidate uses complementary/triadic harmony rules (already in `generateGradientOptions`).
   - Prevent “muddy” outputs by enforcing hue/brightness separation (`enforceColorSeparation`).

5. **Respect layout geometry + pattern logic**
   - Keep layout-specific gradient geometry intact so compositions still read well.
   - If organic blobs are used, ensure blob colors are derived from the *final* gradient (not raw brand palette).

6. **Fail-safe + transparency**
   - When the brand palette loses the quality score, quietly fall back to screenshot-driven gradients.
   - Optionally expose a toggle like “Prioritize brand color” so users can opt into risk.

### Medium-impact parameters
- Default layout + variant: sets composition style (headline left/right, centered focus).
- Screenshot zoom: controls how “heroic” the product looks in frame.
- Logo usage toggle: ensures the logo consistently appears (or never does).

### Hardcoded candidates for future config
- Grain overlay opacity, texture size, blend: could map to a “matte” vs “glossy” brand finish.
- Organic blob positions, radius, opacity: could become a “brand texture” preset (subtle vs bold).
- Shadow preset values: could become a brand-specific shadow recipe.
- Layout gradient geometry defaults: could steer gradients to flow toward copy or toward product.

---

## 6. Brand persistence (local + database)

### Local
- Brand settings are cached in localStorage via `brandSettingsAtom` (`dopeshot:brandSettings`). This includes logo URL/path, accent, mode, personality, and the toggle for applying the logo.

### Database (Supabase)
- Brand settings are also persisted in the database via the brand profile API:
  - `GET /api/brand/profile` loads `colorPalette.mode`, `colorPalette.accent`, `personality`, and logo fields.
  - `PATCH /api/brand/update-profile` saves updates (accent, mode, personality, logo_path).
- The BrandPanel fetches DB-backed profile values on mount and merges them into `brandSettingsAtom` for local caching.

---

## Primary source files
- `apps/app/src/hooks/use-file-upload.ts`
- `apps/app/src/domain/asset/upload-orchestrator.ts`
- `apps/app/src/hooks/use-color-analysis.ts`
- `apps/app/src/hooks/use-gradient-generation.ts`
- `apps/app/src/domain/layout/gradients/generator.ts`
- `apps/app/src/components/layouts/shared/layout-primitives.tsx`
- `apps/app/src/components/layouts/shared/background-style.ts`
- `apps/app/src/components/layouts/shared/PatternOverlay.tsx`
- `apps/app/src/components/layouts/shared/OrganicBlobsOverlay.tsx`
- `apps/app/src/components/layouts/shared/GrainOverlay.tsx`
- `apps/app/src/hooks/atoms.ts`
- `apps/app/src/lib/types/brand.ts`
- `apps/app/src/components/brand/brand-panel.tsx`
