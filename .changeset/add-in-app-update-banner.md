---
"dopeshot-app": patch
---

Add a compact in-app “What’s new” banner at the top of the playground.

- Shows the current update (“User accounts & saving designs”) with a primary **Sign up** CTA
- Can be dismissed with a subtle height/opacity animation
- Persists dismissal per update id via `localStorage`, so it automatically reappears for future updates

