---
status: TODO
---

# Screenshot-First Preview PRD

## Objective
- Let creators ship export-ready previews that look polished with only a screenshot.
- Make titles/descriptions optional without the canvas feeling empty or unbalanced.
- Keep the creative workflow fast by auto-sizing assets and applying curated backgrounds.

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
- **Screenshot-first mode trigger**: If both title and description fields are empty (ignoring whitespace), the renderer switches to “Screenshot Focused” state. Re-populating either field switches back to the template’s default composition.
- **Auto scaling & positioning**: In focused state, the screenshot scales to fill ~70% of the preview width/height while preserving aspect ratio. Maintain smart padding so rounded corners and drop shadows stay visible. If text reappears, scale snaps back to the template’s baseline allocation.
- **Curated frame presets**: Provide three selectable presets surfaced in the Design sidebar: (1) Adaptive gradient blur sampled from the screenshot, (2) Neutral solid with soft drop shadow, (3) Frosted glass card with thin stroke. One preset (gradient) is default; users only pick between these options—no manual sliders.
- **Logo behavior**: Logo upload remains optional. If the active template variant defines a logo slot it stays in that slot; otherwise it remains hidden. No additional floating badge control is introduced.
- **Fluid layout transitions**: When switching between templates or variants, remember whether text is present and animate the screenshot resizing over 150–200 ms for polish. Full layout variant (“Full”) shows the entire screenshot edge-to-edge when text is empty.
- **Responsive handling**: Apply the same logic across breakpoints; on small canvases ensure padding never drops below 16 px so the frame still reads cleanly.

## Requirements
- Detect empty title/description at runtime without extra save actions (e.g., compute from editor state).
- Focused mode must update preview instantly (<100 ms) to reinforce the “auto” model.
- Screenshot max coverage capped at ~70% of the preview while respecting rounded corners and maintaining at least 24 px padding from canvas edges on desktop.
- Provide exactly three background presets; store selection per design so exports stay consistent.
- Gradient preset should sample dominant colors from the screenshot (reuse existing palette tooling if available; otherwise fall back to brand gradient).
- Ensure logos keep their existing layout slot rules; if the slot would overlap the scaled screenshot, hide it automatically.
- Export output (PNG/MP4/etc.) must match what is seen on canvas regardless of mode.
- No new settings in the Layout rail or Template rail; all behavior lives inside existing layout logic and the Design sidebar preset chip.

## UX Notes & Copy
- Sidebar section label: “Screenshot frame”. Preset chips labeled “Auto gradient (default)”, “Clean solid”, “Frosted glass”.
- Canvas hint: When text fields are empty, show a subtle inline helper “Screenshot-focused layout active” for 2 seconds.
- No additional toggles for scaling—emphasize automatic behavior in onboarding tooltip if needed.

## Success Metrics
- TBD. Once shipped we will instrument adoption (percentage of exports without text) and gather qualitative feedback, but no explicit KPI targets are required for this phase.
