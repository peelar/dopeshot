---
"dopeshot-app": minor
---

Refactor brand personalities with visual style tokens

Replace the existing 5 personalities (technical, business, creative, friendly, premium) with 4 new ones:

- **Hipster** — Warm, grainy, handcrafted (14px corners, warm-tinted shadow, grain texture, Bricolage Grotesque)
- **Founder** — Sharp, clean, precise (8px corners, crisp shadow, Geist Sans)
- **Hacker** — Terminal vibes, functional (2px corners, no shadow, scanlines stub, IBM Plex Mono)
- **Kawaii** — Soft, rounded, Studio Ghibli warmth (24px corners, soft blur shadow, Kiwi Maru)

Each personality now controls concrete visual tokens:
- Corner radius on screenshot frames
- Shadow style (blur, spread, offset, tint)
- Texture overlay (grain, scanlines stub)
- Typography (font family)

Added new `PersonalityStyle` type and `getStyleForPersonality()` function for retrieving style tokens.
