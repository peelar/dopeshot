# dopeshot Product Context

## Product Summary

**One-liner**: Turn a raw product screenshot into a share-ready graphic in under 15 seconds.

**Elevator pitch**: DopeShot makes your screenshots not look like shit. Upload ugly, download ready.

**Bigger vision**: Instant visual polish for everything indie hackers need to share — screenshots, code snippets, headshots, podcast covers. Upload ugly, download ready.

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
- Judge tools in 30 seconds or less

**Secondary** (future): Small teams wanting brand consistency.

**Not targeting**:
- Enterprise with complex approval workflows
- Designers who want full creative control
- Users who need batch processing (yet)

---

## Core Value Proposition

| Attribute | Value |
|-----------|-------|
| Speed | First polished result in ~3 seconds |
| Quality | Output is "post without hesitation" quality |
| Consistency | Posts look like the same brand |
| Simplicity | No tutorials, no onboarding |

---

## Architecture

### Three-Layer Model
- **Layouts**: Geometry/structure only (Peek Left, Peek Center, Peek Right, Spotlight, Backdrop, etc.)
  - Thumbnails are wireframes, no color
  - Each variant is its own thumbnail in a flat rail
- **Effects**: Independent combinable toggles (Grain, Glow, Grid) — persist across layout changes
- **Backgrounds**: Auto-generated from palette (screenshot sampling for free, brand tokens for paid)

### Input -> Format -> Template Pipeline
The product is evolving toward handling multiple input types:
- **Inputs**: Screenshot (current), code snippet, portrait, quote, audio waveform (future)
- **Formats**: Horizontal 16:9, Vertical 9:16, Square 1:1
- **Templates**: Fully-specified visual recipes (layout + font + background + effects)

### Technical Stack
- Next.js 16 + React 19
- Prisma ORM + Supabase Postgres
- Supabase Storage for files + Supabase Auth
- Jotai for state management

---

## Monetization Model

**Free tier**: Random beautiful outputs
- Proves value, drives word-of-mouth
- No account required
- Colors sampled from screenshot — varied, delightful

**Paid tier (Brand)**: Brand-consistent outputs
- Brand tokens auto-applied (colors, fonts, logo)
- Key insight: The paid value isn't "more options" — it's "your brand is already the default"
- No dropdown to select "My Brand" — when logged in as paid, brand is baked in

**Pricing target**: $20/month via Polar.sh (MoR — handles VAT, compliance)

**The upgrade trigger**: The moment someone wants consistency, not variety.

**The gate principle**: Gate convenience, not capability. Free tier stays genuinely useful. Paid tier removes friction for repeat users who want consistency.

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Typography | Single font (hardcoded free), brand font (paid) | Speed + cohesion |
| Layout selection | Auto based on aspect ratio | No decision paralysis |
| Landing state | Demo screenshot pre-loaded | Shows capability immediately |
| Color handling | Auto palette extraction (free), brand tokens (paid) | Core differentiator |
| Structure | Layouts/Effects/Backgrounds separated | Clear mental model, composable |
| Account requirement | None for free tier | Optimize activation before pricing |
| Platform | Desktop-first | Target users work on laptops |
| Variants | Flat rail (no nested toggles) | Each variant is its own thumbnail |
| Style toggles | Combinable, persist across layouts | Consistency without re-deciding |
| Payment provider | Polar.sh | MoR, 4% fee, no tax headaches |

---

## Open Questions

These require product decisions:

1. **Brand backgrounds**: Algorithmic blending vs. curated library vs. hybrid?
2. **Layout memory**: Remember last orientation per user, or always auto-detect?
3. **Palette fallback**: If extraction fails: branded default, neutral gradient, or curated set?
4. **Multi-format export**: One format at a time, or batch export?
5. **Effect defaults**: All-on, all-off, or layout-specific presets?
6. **Brand token injection**: Auto-apply or user opt-in per export?
7. **Asset type expansion**: What's the second input type after screenshots?

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
7. **Free is distribution**: Every free export is potential word-of-mouth
8. **Paid is consistency**: Brand tokens, not more features
