<!-- 40d619a0-0d04-43c2-bd04-e5157f3b859a ec9b932b-c557-41be-b633-293c92040f33 -->
# Improved Gradient Flow & Analysis

Refactor the image analysis and gradient configuration to produce higher-quality, editable gradients based on uploaded images, following "Josh W. Comeau" principles (richer color interpolation, avoiding dead zones).

## 1. Domain Types Update

- Update `BackgroundConfig` in `domain/layout/types.ts` to support a `stops` property (`string[]`) for storing custom gradient colors directly, decoupling standard presets from generated ones.

## 2. Enhanced Image Analysis (`process-image.ts`)

- Improve `processImage` to:
- Select a "richer" color pair (e.g., using complementary or split-complementary rules rather than just lightening).
- Return `stops` (hex codes) in the analysis result.
- Suggest a `textColor` based on the gradient's brightness.

## 3. Layout Component Updates (`PopupGradient.tsx`)

- Update `PopupGradient` to check for `config.background.stops`.
- If present, render the background using `linear-gradient(to right in oklab, stop1, stop2)` to ensure smooth, high-quality interpolation.
- Fallback to standard presets if no stops are defined.

## 4. UI Refactor (`LayoutConfigPanel` & `page.tsx`)

- **LayoutConfigPanel**:
- **Hide Presets**: Move the grid of preset gradients behind a "Show Presets" toggle/collapsible.
- **Active Gradient UI**: Add a prominent "Active Gradient" preview bar.
- **Edit Mode**: When the gradient section is active, display two color pickers (Start/End) corresponding to the gradient stops.
- **Interaction**: changing the pickers updates `config.background.stops` in real-time.
- **Playground Page**:
- Update `handleFileProcess` to apply the analyzed `stops` directly to the configuration instead of generating a temporary ID.

### To-dos

- [ ] Update BackgroundConfig type in domain/layout/types.ts
- [ ] Enhance color selection logic in app/actions/process-image.ts
- [ ] Update PopupGradient.tsx to render gradients using stops and oklab interpolation
- [ ] Refactor LayoutConfigPanel to hide presets and add color pickers
- [ ] Update playground page to use new analysis data