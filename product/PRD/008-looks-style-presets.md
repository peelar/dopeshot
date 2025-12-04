---
status: TODO
---

# Looks (Style Presets)

## Objective
- Introduce `Looks` (style presets) as the primary styling control: one-tap bundles for gradient + pattern + outline/shadow + text color (and optionally font), while templates stay automatic and layouts remain a lightweight toggle.

## Background
- Templates (composition) and layouts (placement) exist but feel abstract to users; they mainly want “make this look good fast.”
- Styling controls are scattered (background, grain, outline), making it hard to know what’s active.
- We want an effortless default (auto-pick) and clear, minimal ways to swap vibes without exposing template complexity.

## Problem Statement
- Current experience requires touching multiple controls to change the vibe; template vs layout vs styling is unclear.
- Without a single entry point, users can’t tell why something looks a certain way or how to revert to defaults.
- We need a single, small control that applies cohesive styling without moving content.

## Goals / Non-Goals
**Goals**
- Single “Looks” picker that applies a cohesive bundle; never moves content.
- Auto-select a Look on upload based on palette/aspect; user can swap quickly.
- Keep layouts as a small, optional segmented control; templates stay under the hood (auto-chosen).
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
- **Control placement:** Add `Looks` as a compact chip strip at the top of the Design sidebar, above Background. Avoid new tabs.
- **Options:** `Auto` (default), `Base`, `Terminal`, `Beach Pop`, `Glass Clean`, `Noir`, `Vivid Duo`, `Muted Grain`.
- **Behavior:** Selecting a Look applies its bundle (gradient, pattern, outline/shadow, text color, optional font). It does not change template or layout. Layout control remains a small segmented control shown only when variants exist.
- **Auto behavior:** On upload, auto-select a Look using palette/brightness/contrast. Auto can update on new uploads but does not overwrite a user-chosen Look.
- **State clarity:** Above Background, show “Applied Look: Beach Pop (Auto)” or “Custom” if user edits Background/Pattern after choosing a Look. Provide a quick “Reset to Look” link.
- **Templates/layouts:** Template selection stays automatic by aspect ratio; layout toggle remains the only structural control users see.

## Requirements
- Add `lookId` and `lookMode: auto|manual|custom` to config/state; default to `auto`.
- Each Look stores tokens: gradient spec, patternId, shadow/outline preset, text color set, optional font choice. Applying a Look updates these fields atomically.
- Changing Look must not alter template or layout; changing layout must not overwrite Look styling.
- Auto Look selection runs on upload/palette ready; if manual Look is set, do not auto-switch.
- UI: chip radiogroup, keyboard-accessible, wraps or collapses on narrow widths.
- Visible state in Background area: applied Look name + reset affordance.
- Export must match on-canvas styling; no perf regressions.

## UX Notes & Copy
- Label: `Looks`.
- Helper text (muted, 12px): “Preset styles. Keeps your layout.”
- Chips: `Auto`, `Base`, `Terminal`, `Beach Pop`, `Glass Clean`, `Noir`, `Vivid Duo`, `Muted Grain`.
- Tooltip on Auto: “Picks a style for you.”
- Background section banner when a Look is active: “Applied Look: Beach Pop · Reset”.
- If user tweaks Background/Pattern, banner changes to “Custom · Reapply Beach Pop”.

## Success Metrics
- ≥60% of sessions export with the Auto Look untouched.
- ≥30% of users try at least one non-default Look.
- <5% of feedback mentions confusion about where styling comes from.
- No increase in time-to-first-render; Looks apply in under one frame of noticeable delay.
