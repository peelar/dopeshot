---
"dopeshot-app": patch
---

Simplified gradient system by removing unused abstractions:

- Removed gradient presets (Hyper, Oceanic, Cotton Candy, etc.) - all gradients now derive from screenshot colors
- Removed `gradientSource` field from BackgroundConfig - no longer needed since there's only one source
- Removed `color-source.ts` abstraction layer - simplified gradient generation pipeline
- Removed brand gradient mode feature that wasn't working correctly

The gradient picker now shows 6 screenshot-derived options: 3 linear gradients, 1 mesh gradient, and 2 ambient gradients with blob overlays.
