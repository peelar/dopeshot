# Decisions

High-confidence calls that shape the product today.

## Hardcoded typography for speed
- **Chose**: Single production font (formerly 8 vibe presets)
- **Because**: Removes decision paralysis; optimizes for speed and cohesion; future brand integration will restore choice via brand tokens.

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
- **Chose**: Layouts control geometry; effects (Grain/Glow/Grid) are independent toggles; backgrounds are auto-generated
- **Because**: Clear mental model with three distinct concerns; composable and brand-ready.

## Layout switching preserves content
- **Chose**: Changing layouts (formerly templates/variants) keeps user text and assets intact
- **Because**: Encourages exploration without rework.

## Layouts show structure, not style
- **Chose**: Wireframe thumbnails for layout selection; effects applied after layout choice
- **Because**: Separates geometry from styling; faster cognitive load; brand-ready architecture.

## Effects as independent toggles
- **Chose**: Grain, Glow, Grid live in sidebar as on/off switches
- **Because**: Composable treatments work across all layouts; no bundled "style variants."

## Orientation selector over fixed aspect
- **Chose**: Three aspect ratio modes (Horizontal/Vertical/Square) replace auto-detection only
- **Because**: Gives users control while maintaining speed; matches common social platform formats.

## No account or watermark (MVP)
- **Chose**: Frictionless try-and-share experience
- **Because**: Optimize for activation and word-of-mouth before pricing.

## Desktop-first workflow
- **Chose**: Optimized for desktop with responsive fallbacks
- **Because**: Target users upload and export from laptops.
