# dopeshot Product Context

## Table of Contents
1. [Product Summary](#product-summary)
2. [Target User](#target-user)
3. [Core Value Proposition](#core-value-proposition)
4. [Current Architecture](#current-architecture)
5. [Monetization Model](#monetization-model)
6. [Key Decisions Made](#key-decisions-made)
7. [Open Questions](#open-questions)

---

## Product Summary

**One-liner**: Turn a raw product screenshot into a share-ready graphic in under 15 seconds.

**Category**: Visual identity toolkit for indie hackers and small builders.

**Core flow**:
1. Upload screenshot (PNG/JPG)
2. Auto-detect aspect, extract palette, select layout
3. Apply auto-matched background gradient
4. Optional: choose orientation, toggle effects, edit text
5. Export PNG for Twitter/LinkedIn

---

## Target User

**Primary**: Indie hackers and small builders who:
- Ship fast, post often
- Want professional visuals without design skills
- Value speed over customization
- Post to Twitter and LinkedIn regularly

**Secondary** (future): Small teams wanting brand consistency.

**Not targeting**:
- Enterprise with complex approval workflows
- Designers who want full creative control
- Users who need batch processing

---

## Core Value Proposition

| Attribute | Value |
|-----------|-------|
| Speed | First polished result in ~3 seconds |
| Quality | Output is "post without hesitation" quality |
| Consistency | Posts look like the same brand |
| Simplicity | No tutorials, no onboarding |

---

## Current Architecture

**Three-layer model**:
- **Layouts**: Geometry/structure (Popup, Split, etc.)
- **Effects**: Independent toggles (Grain, Glow, Grid)
- **Backgrounds**: Auto-generated from palette

**Technical stack**:
- Next.js 16 + React 19
- Prisma ORM + Supabase Postgres
- Supabase Storage for files
- Jotai for state management

---

## Monetization Model

**Free tier**: Random beautiful outputs
- Proves value
- Drives word-of-mouth
- No account required

**Paid tier (Brand)**: Brand-consistent outputs
- Logo integration
- Brand color palette (5 colors)
- Typography choices
- Saved brand profile

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Typography | Single font (hardcoded) | Speed + cohesion; brand tier restores choice |
| Layout selection | Auto based on aspect ratio | No decision paralysis |
| Landing state | Demo screenshot | Shows capability immediately |
| Color handling | Auto palette extraction | Matches screenshot without manual work |
| Structure | Layouts/Effects/Backgrounds separated | Clear mental model, composable |
| Account requirement | None (MVP) | Optimize activation before pricing |
| Platform | Desktop-first | Target users work on laptops |

---

## Open Questions

These require product decisions:

1. **Layout memory**: Remember last orientation per user, or always auto-detect?
2. **Palette fallback**: If extraction fails: branded default, neutral gradient, or curated set?
3. **Multi-format export**: One format at a time, or batch export?
4. **Effect defaults**: All-on, all-off, or layout-specific presets?
5. **Brand token injection**: Auto-apply or user opt-in per export?

---

## Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time to first result | <3s | Speed is the feature |
| Upload to export | <15s | Complete flow fast |
| Post-worthy rate | >80% | Quality bar |
| Weekly return rate | >30% | Habit formation |
| Share rate | >10% | Viral growth |

---

## Product Principles

1. **Speed first**: Upload to export in seconds
2. **Smart defaults**: Everything looks good out of the box
3. **Consistent voice**: Outputs share the same energy
4. **Repeat use**: Faster and more familiar each return
5. **No blank canvas**: Start from user content, not empty state
6. **Few choices**: Curated options, not dozens of knobs
