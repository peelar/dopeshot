---
status: DRAFT
---

# Template + Layout System PRD (DopeShot)

## Objective
- Introduce a template (composition) and layout (positioning) system that keeps compositions consistent while allowing positional variation per template.
- Auto-select a recommended template + layout based on screenshot aspect ratio, with user override.
- Ensure oversized images always scale down inside a safe frame without cropping, bleeding, or changing composition.

## Background
- Current experience blends composition and positioning, making it unclear what changes when switching variants.
- Oversized screenshots sometimes dictate canvas sizing or cause overflow; the canvas should remain the authority.
- Need predictable behavior across wide aspect ratios (tall mobile to wide desktop) without shifting templates.

## Principles
- Templates define composition; layouts define positioning; scaling defines containment.
- No template changes triggered by image dimensions; layout persists unless the user changes it.
- Contained visuals: no bleed, no unintended clipping, no overflow; hierarchy and spacing stay intact.

## Templates & Layout Variants
- **Popup:** Image rises from bottom. Layouts: left, center, right.
- **Split:** Text and image in separate regions. Layouts: left, right, top, bottom.
- **Overlay:** Screenshot fills canvas; text overlays with gradient. Layouts: bottom, top, center.

## Auto-Selection Rules
- Aspect ratio < 0.75 → Popup (center).
- Aspect ratio > 1.3 → Split (left).
- Otherwise → Split (top).
- User can override template and layout at any time; overrides persist in state.

## Image Sizing & Safe Frame
- Canvas defines maximum visual area; screenshot never sets canvas size.
- Each layout provides an internal safe frame; images scale proportionally to fit within it.
- Oversized images always scale down to fit; never crop or distort; maintain margins and hierarchy.
- No overflow/bleed beyond the safe frame; consistent gutters across aspect ratios.

## UX Flow
1) User uploads screenshot.
2) Detect aspect ratio.
3) Auto-select recommended template + layout.
4) User can switch template.
5) User chooses layout variant within the template.
6) Image scales as needed to fit inside the layout’s safe frame.

## UX & UI Requirements
- Template selection visible and switchable (rail or cards); one card per template family.
- Layout selection visible and switchable for the active template; variants labeled (Left/Right/Top/Bottom/Center).
- Auto-selected defaults shown; changes update preview without clearing user content.
- Overlay templates use gradients to ensure text legibility on top of screenshots.
- Responsive controls: layout picker adapts to narrow widths (e.g., pill dropdown).
- State persistence for chosen template + layout across refresh (align with existing config state).

## Functional Requirements
- Applying a layout changes positioning only; preserves user content, backgrounds, typography, shadows, and assets.
- Large images scale down inside the safe frame; no composition shift when image is oversized.
- Safe frame bounds prevent cropping, bleeding, and overflow for all aspect ratios.
- Export matches preview sizing and containment rules.
- Empty state still shows template/layout selectors and placeholders; drop zones accept uploads.

## Acceptance Criteria
- Templates and layouts are selectable and applied correctly per definitions above.
- Large images scale proportionally inside safe frames without distortion or layout shifts.
- No overflow, cropping, or bleed into the canvas across aspect ratios.
- Design hierarchy and spacing remain intact for all image sizes and layouts.

## Success Metrics
- Reduced user reports of cropped/overflowing images.
- Time to first layout switch after template selection <5s median.
- Increased exports after ≥2 layout switches (evidence exploration is easy).

## Open Questions
- Do we need per-template default layout variations beyond the auto-selection rule?
- Should safe frame margins be template-specific or global?
- How do we surface recommended layouts when user overrides the auto choice (badge, hint, or tooltip)?
