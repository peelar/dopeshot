---
"dopeshot-app": minor
---

Refactor brand personalities with visual style tokens

Replace the existing 5 personalities (technical, business, creative, friendly, premium) with 7 new ones:

- **Tech** — Sharp, clean, precise (8px corners, crisp shadow, Geist Sans)
- **Hipster** — Warm, grainy, handcrafted (14px corners, warm-tinted shadow, grain texture, Libre Baskerville)
- **Hacker** — Terminal vibes, functional (2px corners, no shadow, scanlines stub, IBM Plex Mono)
- **Kawaii** — Soft, rounded, friendly (24px corners, soft blur shadow, Nunito)
- **Corporate** — Safe, polished, standard (8px corners, classic shadow, Geist Sans)
- **Brutalist** — Raw, harsh, confrontational (0px corners, hard offset shadow, heavy grain, Bricolage Grotesque)
- **Vapor** — Dreamy, glowy, retrofuturistic (16px corners, purple glow shadow, Bricolage Grotesque)

Each personality now controls concrete visual tokens:
- Corner radius on screenshot frames
- Shadow style (blur, spread, offset, tint)
- Texture overlay (grain, noise, scanlines stub, dots stub)
- Typography (font family)

Added new `PersonalityStyle` type and `getStyleForPersonality()` function for retrieving style tokens.
Added Libre Baskerville font for the Hipster personality.
