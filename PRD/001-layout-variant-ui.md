---
status: COMPLETED
---

# Layout Variant UI PRD

## Objective
- Reduce clutter when adding new layout variants (e.g., full-bleed image) while keeping variant discovery obvious.
- Separate mental models: templates = distinct visual systems; layouts = positions inside a template.
- Keep the Design sidebar focused on styling (type, shadow, background), not structural switching.

## Background
- Current template rail shows every variant as its own card (e.g., Popup & Gradient Left/Right/Center), which will not scale once full-bleed or additional placements are added.
- Layout state is already modeled as `LayoutConfig` with `templateId` (template) and `variant` (layout). Variants should be selectable without replacing the whole template or resetting user content.

## Problem Statement
- More variants (full-size image, alt logo positions, text-only) will explode the top rail and push the Design sidebar toward structural controls. Users risk losing clarity on what is a new template versus a layout within one.

## Goals
- Fast switch between compositions and layouts with minimal cursor travel.
- Keep preview context while switching layouts (no sidebar clutter, no modal).
- Maintain user-applied content (text, assets, background, colors, shadow) when changing variants.

## Non-Goals
- Designing the new full-bleed layout itself (covered in template work).
- Introducing template-level filters/tags or multi-page navigation.

## Users & Use Cases
- Fast exporters: pick a composition, try a couple of layout placements, export.
- Brand matchers: keep their gradient/type while flipping layouts to see copy fit.
- New users: understand “design family” vs “layout position” without reading docs.

## Proposed Solution
- **Template rail (top, existing slot):** One card per template family. Default preview uses the primary variant (e.g., Right). Variant count or dots optional but not required now.
- **Layout toggle bar (above canvas, subtle):** When a composition has >1 variant, show a small segmented control with text labels (“Left”, “Center”, “Right”, “Full”) and minimal iconography (alignment glyphs). Lives just above the live preview, left-aligned; collapses to a pill-dropdown on narrow widths.
- **Behavior:** Selecting a composition switches to its default variant and preserves user content/background/shadow. Selecting a layout toggles only `variant` in `LayoutConfig` and re-renders preview; no sidebar changes. Hide the bar if only one variant exists.
- **Full-bleed variant entry:** Add “Full”/“Full-bleed” to the layout toggle for templates that support it (e.g., a full-size screenshot background). Badge it once (“New”) until user switches away.
- **Discoverability cues:** Light hover highlight on the toggle bar; optional hint text “Layouts” above the control in 12px muted text. No persistent chips in the sidebar.
- **Keyboard/accessibility:** Segmented control is a radiogroup; arrow keys cycle variants; focus ring visible.

## Requirements
- Template rail shows unique templates only; selecting another template updates preview without clearing user content.
- Layout toggle appears only when `template.variants.length > 1`; hides for single-variant templates.
- Variant selection must be idempotent: switching variants cannot remove user-uploaded assets, background choice, font, or shadow.
- Responsive: bar wraps or turns into a dropdown on small screens without overlapping the preview.
- State persistence: last chosen composition + variant should survive a page refresh (existing behavior via config state).
- Empty states: if assets missing, keep variant selection available and show existing placeholder copy.

## UX Notes & Copy
- Toggle label above control: “Layouts”.
- Buttons: “Left”, “Center”, “Right”, “Full” (short text, optional alignment icons).
- Avoid sidebar entries for layouts; keep sidebar sections to Typography, Shadow, Background, Assets.

## Success Metrics
- Time to first variant switch after composition selection (<5s median).
- Variant exploration depth: average variants tried per session (+X% vs baseline).
- Export rate after ≥2 layout switches (indicator that exploration is frictionless).
- Qual: fewer user mentions of “crowded sidebar” / “hard to find layout” in feedback.

## Release Plan
- Phase 1: Ship composition rail + layout toggle bar using existing templates/variants; no visual redesign of cards.
- Phase 2: Add full-bleed variant to applicable templates and surface “Full” option; remove “New” badge after 1 selection or session.
- Phase 3 (optional): Add inline variant previews on hover (micro modal) if users still struggle to distinguish layouts.

## Open Questions
- Naming: “Compositions” vs “Designs” vs “Templates” for the top rail—pick one label and apply across UI.
- Default variant per composition: keep Right as default, or choose the last-used variant per user?
- Should the layout bar be sticky on scroll for long panels, or stay anchored to the canvas only?
