---
"dopeshot-app": patch
---

Upgrade screenshot/frame shadows to a layered depth model with background-aware tinting.

- Replace single-layer `low|medium|high` shadows with multi-layer contact + ambient stacks for more realistic elevation
- Apply surface-aware tinting so shadows adapt to the active background color instead of always reading as pure black
- Update screenshot frame fallback shadows to use the shared layered shadow system
- Add focused tests for shadow layering, tint behavior, and zero-shadow personality cases
- Add research documentation for findings, performance considerations, and rollout recommendations
