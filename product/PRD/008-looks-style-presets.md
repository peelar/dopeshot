---
status: TODO
---

# Looks (Style Presets)

## Objective
- Introduce `Looks` (style presets) as the primary styling control: one-tap bundles for gradient + pattern + outline/shadow + text color (and optionally font), while the only structural control is `Variants` built from primitives (no template rail).

## Background
- Templates (composition) were exposed but feel abstract; users mainly want “make this look good fast.”
- Styling controls are scattered (background, grain, outline), making it hard to know what’s active.
- We want an effortless default (auto-pick) and clear, minimal ways to swap vibes without exposing template complexity. Implementation should be primitive-first (gradient, frame, flex/grid), so new Looks/Variants compose easily.
- Templates are gone; Looks are primitive bundles (gradient, flex composition, frame, typography tokens) so we can reuse and remix without bespoke template code.

## Problem Statement
- Current experience requires touching multiple controls to change the vibe; template vs layout vs styling is unclear.
- Without a single entry point, users can’t tell why something looks a certain way or how to revert to defaults.
- We need a single, small control that applies cohesive styling without moving content.

## Goals / Non-Goals
**Goals**
- Single “Looks” picker that applies a cohesive bundle; never moves content.
- Auto-select a Look on upload based on palette/aspect; user can swap quickly.
- Replace layouts/templates with `Variants` (structural options) that stay small; underlying implementation composes primitives, not hard-coded templates.
- Clear state: show what Look is applied; mark `Custom` if the user tweaks background/pattern after selecting a Look.

**Non-Goals**
- User-facing template switching.
- Fine-grained sliders for each token inside a Look.
- Per-breakpoint styling differences.

## Users & Use Cases
- First-time visitors: land, see an Auto Look, export without changes.
- Fast exporters: switch Looks to find a vibe, maybe flip the layout, then export.
- Brand matchers: pick one Look repeatedly for consistency.

## Proposed Solution
- **Looks rail (replaces template rail):** Top of Design sidebar, compact chip rail. Start with 5 curated options: `Auto` (default), `Base`, `Terminal`, `Glass Clean`, `Vivid Duo`. Future Looks append after this core set. Under the hood, Looks are bundles of primitives (gradient, pattern, frame, text tokens), not template swaps; shared primitive utilities keep Looks code-light.
- **Behavior:** Selecting a Look applies its bundle. It never moves content. The only structural control is `Variants`, a small segmented control shown when options exist (today these map one-to-one to current layout variants; later they’re primitive-driven).
- **Auto behavior:** On upload, auto-select a Look using palette/brightness/contrast/aspect. Auto can update on new uploads but never overwrites a user-chosen Look (manual).
- **State clarity:** Above Background, show “Applied Look: Base (Auto)” or “Custom” if user edits Background/Pattern after choosing a Look. Provide “Reset to Base” to reapply the bundle.
- **Implementation note:** Remove template rail entirely. Rendering is driven by primitives (gradient/pattern/screenshot frame/flex composition). Existing layout variants map to `Variants` until we fully refactor to primitive variants.
- **Initial Look set (tokens and vibe):**
  - `Base`: neutral gradient, light grain, soft shadow; safe default for most content.
  - `Terminal`: dark mono background with subtle scanline pattern, neon accent text, crisp outline.
  - `Glass Clean`: frosted glass panel on muted gradient, faint glow, soft text.
  - `Vivid Duo`: bold dual-tone gradient, higher contrast text, gentle grain and outer glow for depth.
  - `Auto`: selector that maps input palette/aspect to one of the above.

## Requirements
- Add `lookId` and `lookMode: auto|manual|custom` to config/state; default to `auto`.
- Each Look stores tokens: gradient spec, patternId, shadow/outline preset, text color set, optional font choice. Applying a Look updates these fields atomically.
- Changing Look must not alter Variants; changing Variant must not overwrite Look styling.
- Auto Look selection runs on upload/palette ready; if manual Look is set, do not auto-switch.
- UI: chip radiogroup (Looks rail) replacing template rail, keyboard-accessible, wraps/collapses on narrow widths.
- Add a visible Look label with sprinkles icon to the rail header so it matches the Variant/Style micro-titles.
- Variants segmented control replaces “Layouts” and pulls from current layout variants (one-to-one) until primitive variants land.
- Visible state in Background area: applied Look name + reset affordance.
- Export must match on-canvas styling; no perf regressions.

## UX Notes & Copy
- Label: `Looks`.
- Helper text (muted, 12px): “Preset styles. Keeps your layout.”
- Chips: `Auto`, `Base`, `Terminal`, `Glass Clean`, `Vivid Duo`.
- Tooltip on Auto: “Picks a style for you.”
- Background section banner when a Look is active: “Applied Look: Base · Reset”.
- If user tweaks Background/Pattern, banner changes to “Custom · Reapply Base”.
- Variants label: `Variants` (no “Layouts”/“Templates”).

## Success Metrics
- ≥60% of sessions export with the Auto Look untouched.
- ≥30% of users try at least one non-default Look.
- <5% of feedback mentions confusion about where styling comes from.
- No increase in time-to-first-render; Looks apply in under one frame of noticeable delay.
