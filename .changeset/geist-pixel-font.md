---
"dopeshot-app": patch
---

Replace IBM Plex Mono with Geist Pixel Square for the Hacker personality font.

- Upgrade `geist` package to 1.7.0 for pixel font support
- Swap Terminal/Hacker font from IBM Plex Mono to Geist Pixel Square (bitmap-inspired display font)
- Remove `font-mono` Tailwind class from terminal style since Geist Pixel is not a monospace font
