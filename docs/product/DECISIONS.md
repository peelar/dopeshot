# Decisions

High-confidence calls that shape the product today.

## Fonts chosen by vibe, not name
- **Chose**: 8 curated presets labeled by mood (Founder Mode, Terminal, Unhinged, etc.)
- **Because**: Users pick based on feeling; every option should be safe.

## Auto-select template based on aspect ratio
- **Chose**: Popup for vertical, Split for horizontal/square
- **Because**: Removes decision paralysis and yields an instant first result.

## No blank canvas
- **Chose**: Demo screenshot on landing
- **Because**: Shows capability immediately; no empty state.

## Speed as the feature
- **Chose**: Deliver a polished first result in ~2-3 seconds
- **Because**: Fast feedback loops drive repeat use.

## Extract colors, don't ask
- **Chose**: Auto palette extraction with contrast-aware text
- **Because**: Matches the screenshot aesthetic without manual picking.

## Separate structure from styling
- **Chose**: Templates/variants handle layout; styling (gradients/fonts) is bundled into presets
- **Because**: Clear mental model; fewer knobs.

## Variant switching preserves content
- **Chose**: Changing variants keeps user text and assets intact
- **Because**: Encourages exploration without rework.

## No account or watermark (MVP)
- **Chose**: Frictionless try-and-share experience
- **Because**: Optimize for activation and word-of-mouth before pricing.

## Desktop-first workflow
- **Chose**: Optimized for desktop with responsive fallbacks
- **Because**: Target users upload and export from laptops.
