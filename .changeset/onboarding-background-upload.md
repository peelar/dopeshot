---
"dopeshot-app": minor
---

Add optional brand background upload to onboarding modal

- Reorganize onboarding into 4-card bento grid: Logo, Background, Colors, Personality
- Background card in position 2 explains backgrounds are reusable across designs
- Compact personality selector with 2x2 grid layout
- Dashed border on background card signals optional upload
- Background upload uses shared hook with auto-crop to 16:9 and compression
- Track has_background in onboarding completion analytics
