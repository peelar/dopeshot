# dopeshot — Product One-Pager

## Promise
Turn a raw product screenshot into a share-ready graphic in under 15 seconds, with defaults that already look postable.

## Who it's for
Indie hackers and small builders shipping fast, posting often, and wanting professional visuals without fiddling with design tools.

## Core flow
1. Upload a screenshot (PNG/JPG)
2. Auto-detect aspect, extract palette, and pick a template
3. Apply gradient + typography preset (8 vibes)
4. Optional: tweak headline/subheadline or swap layout variant
5. Export a PNG sized for Twitter/LinkedIn

## Current capabilities
- Smart upload: aspect detection, palette extraction, and template suggestion
- Templates: Popup for vertical, Split for horizontal/square, with quick variant switching
- Typography: 8 vibe-based presets; smart text sizing and contrast-aware colors
- Backgrounds: auto gradients matched to the screenshot aesthetic
- Export: high-res PNG optimized for Twitter/LinkedIn

## In flight / near term
- Layout rail and variant switching clarity (PRD-001)
- Screenshot-first templates (Peak/Full/Adaptive) evaluation
- Additional text color options beyond the default safe pick

## Boundaries (intentional)
- Single-image flow; no batch export
- Twitter/LinkedIn formats only until multi-format work lands
- No saved brand kits or accounts yet; local-only experience
- Desktop-first; mobile is responsive but secondary
- No watermark until pricing is defined

## Performance targets
- First polished result in ≤3s; upload to export in ≤10s
- Color analysis <1s, render <2s, export <3s
