---
status: TODO
---

# Screenshot-First Preview PRD

## Objective
- Expand the preview system into four purpose-built templates so users can pick the layout that matches their goal instead of forcing one canvas to handle every case.
- Let screenshot-only flows feel premium (Full + Adaptive templates) while keeping a dedicated marketing template (Peak) for copy-driven updates.
- Preserve the "no-configuration" promise: strong defaults, minimal controls, and frame decisions made per template.

## Background
- Current templates expect a title, description, screenshot, and often a logo. When text is removed the layout collapses into awkward whitespace or forces the screenshot into its smaller reserved box.
- Users increasingly just need a “nice frame” around a screenshot (product updates, release notes, quick shares) similar to the reference mock the team shared.
- Removing copy today requires manual spacing tweaks or editing in another tool, which defeats the speed promise of Cover Forge.

## Problem Statement
The preview system treats screenshots as secondary content. When copy is absent, the canvas leaves empty gutters, forcing users to add filler text or finish polish elsewhere. We need a layout mode that intelligently prioritizes the screenshot, scales it up, and wraps it in a refined container without requiring manual controls.

## Goals / Non-Goals
- **Goals**
  - Detect when title and description are empty and automatically shift to a screenshot-first layout.
  - Expand the screenshot up to ~70% of the preview (respecting padding) so the content feels immersive while still showing a border/background treatment.
  - Offer a small set of curated background/padding presets that instantly make the screenshot feel framed without extra configuration.
  - Let optional logos continue to respect whatever placement the chosen layout dictates—no new manual positioning UI.
- **Non-Goals**
  - Building granular controls for screenshot scaling, rotation, or padding per breakpoint.
  - Introducing new logo placement behaviors beyond what templates already define.
  - Changing how users upload or crop screenshots.

## Users & Use Cases
- **Launch announcers**: Need a fast, attractive image for changelog or Twitter without writing text.
- **Support/eng teams**: Share bug fixes or UI polish with internal stakeholders where the screenshot is the story.
- **Template explorers**: Toggle between text-heavy and text-light looks inside one template family without rebuilding their design.

## Proposed Solution
- **Template lineup**
  1. **Peak (with text + description)** – This remains the marketing-friendly hero. Rounded border is enforced, soft glass is the only frame, and the only control is a shadow toggle. Because copy is required, we keep the headline + description inputs visible and render them with snug spacing so the screenshot floats above the gradient background. Peak auto-picks whichever side layout keeps the copy legible.
  2. **Full (no text)** – Screenshot-only canvas that stretches the screenshot edge-to-edge within adaptive padding. No text inputs, no border pickers; users only adjust the background and optional logo. Rounded corners stay but we treat this as a lightweight frame with a single shadow toggle.
  3. **Adaptive** – Screenshot drop-zone whose canvas reflows to the screenshot’s native aspect ratio. Users can still choose outline presets (rounded, rectangular, soft glass) via icon-only toggles, and we keep the background picker active. No text fields, so the UI is essentially screenshot + outline controls.
  4. **Full with text** – Split template where copy lives beside a full-height screenshot. This is the only template that exposes the outline toggles (rounded vs rectangular) plus shadow ON/OFF, because this is the format people want to brand. Headline is required; subtitle optional.
- **Adaptive canvas sizing**: Templates without copy (Full + Adaptive) set the canvas based on screenshot aspect ratio with a minimum 5% padding so borders and shadows remain visible. Peak and Full+Text stay 16:9 by default but inherit the “Lock to 16:9” pill once we reintroduce adaptive behavior for future phases.
- **Auto scaling & positioning**: Full and Adaptive push screenshot coverage to ~90%. Peak keeps the screenshot around ~65% to leave breathing room for text, while Full+Text dedicates ~55% width to the screenshot and lets copy use the rest.
- **Outline controls**: Instead of a single global “Outline” section, each template owns its stance. Peak: no outline controls, always soft glass + rounded. Full: only shadow toggle. Adaptive: soft glass toggle + corner toggle + shadow toggle. Full+Text: same trio as Adaptive. This reduces cognitive load and matches the predefined looks the team approved.
- **Logo behavior**: Peak and Full+Text keep their existing logo slots (top-left badge). Full positions the optional logo centered below the screenshot; Adaptive hides logos because the screenshot should stay pure.
- **Responsive handling**: All templates ensure padding never drops below 16 px and animate screenshot resizes over 150–200 ms when toggling shadow/outline states so the experience still feels “magical" without exposing sliders.

## Requirements
- Template selection exposes the four entries above with short descriptions that set expectations (e.g., “Peak – copy + screenshot”, “Adaptive – screenshot only”).
- Config schema tracks the template ID so existing saves migrate: older “popup-gradient” configs map to Peak, “hero-center” duplicates map to Full+Text unless title + subtitle are empty, in which case we default to Full.
- Controls should only render when relevant; if a template hides the text inputs or outline toggles, the config still stores the last value but the UI does not show or mutate it.
- Adaptive templates infer screenshot dimensions from metadata; when unknown they start at 1280×720 but reflow immediately once the image loads.
- Screenshot coverage targets: Peak (~65%), Full (~90%), Adaptive (~90% with aspect match), Full+Text (~55% width, full height). Maintain ≥24 px padding.
- Outline icons remain icon-only but must ship with aria-labels and tooltip text so accessibility holds even when certain templates hide labels.
- Export output matches on-canvas visuals for all four templates.
- No new layout rails; everything remains inside the Design sidebar and the Template rail.

## UX Notes & Copy
- Template cards should spell out the assumptions: “Peak – Includes headline + description”, “Full – Screenshot only”, “Adaptive – Matches screenshot ratio”, “Full + Text – Split layout”.
- Sidebar adapts per template. Example: Peak shows Headline + Description inputs, typography controls, background picker, but no Outline section. Adaptive hides text + typography, shows Outline icon buttons + background.
- Outline icon buttons: corner glyph (rounded vs rectangular), soft glass glyph, shadow glyph. Buttons can grow slightly larger for readability and include tooltips (“Rounded corners”, “Soft glass glow”, “Drop shadow”).
- Remove the old “Clean” outline preset; Soft glass (default), rounded/rectangular states, and shadow toggle cover the supported looks.
- Canvas copy: Peak keeps text placeholders (“Bring the heat”). Full and Adaptive default to empty text fields (not rendered) to avoid layout shifts.

## Success Metrics
- Template usage mix: track selections across the four templates to confirm screenshot-first options (Full + Adaptive) get adoption >40%.
- Export completion rate: confirm no drop in successful exports vs baseline.
- Qualitative: collect feedback on whether template descriptions and outline iconography make the experience feel “automatic”.
