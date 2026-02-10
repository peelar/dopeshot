# Decision Log

Append-only record of product decisions made during brainstorms. Newest entries at the top. The Head of Product reads this on every conversation to avoid re-litigating settled questions and to build on past thinking.

---

## 2026-02-10 — No free logged-in tier; sign up = 14-day brand trial

**Status**: Decision made, not yet implemented.

**Decision**: Kill the free logged-in tier. When a user signs up, they start a 14-day trial of the full brand experience. After trial ends, they get a "read-only downgrade" — existing designs stay viewable/re-exportable, brand profile stays saved but greyed out, and they drop back to the anonymous screenshot-only experience. Locked format cards remain visible as upgrade nudge.

**Why**: The free logged-in tier had no compelling value prop (just "save 10 designs") and no investment planned. Getting users into brand features fast validates the paid value and shortens the learning loop. Read-only downgrade creates natural upgrade pressure through sunk cost. The real growth bottleneck is distribution, not tier design.

**Revisit if**: Trial-to-paid conversion is near zero and a gentler stepping stone is needed, or user volume grows enough that a nurture funnel between free and paid becomes valuable.

---

## 2025-12-16 — Brand tokens auto-apply, no UI toggle

**Decision**: When a paid user exports, brand colors/fonts/logo apply automatically. No "use my brand" toggle.

**Why**: The paid value is "your brand is already the default." Adding a toggle undermines that and adds a decision to the flow.

**Revisit if**: Users explicitly ask to export without brand for a specific use case.

---

## 2025-12-16 — Layouts are geometry only, renamed from "looks"

**Decision**: Renamed "looks" to "layouts." Layouts define only geometry/structure (where elements sit). Color comes from swatches, not from the layout itself.

**Why**: Separation of concerns. Lets us change colors without rebuilding layouts. Thumbnails become wireframes.

**Revisit if**: Users consistently confused by wireframe thumbnails not showing final colors.

---

## 2025-12-16 — Flat variant rail (no nested selection)

**Decision**: Each variant (Peek Left, Peek Center, Peek Right) is its own thumbnail in a flat rail. No layout -> variant two-step.

**Why**: Reduces decision complexity by one layer. Users see all options at once.

**Revisit if**: Variant count grows beyond ~12 and the rail gets unwieldy.

---

## 2025-12-16 — Style toggles are combinable and persist

**Decision**: Grain/Glow/Grid can all be on simultaneously and persist across layout changes.

**Why**: Users shouldn't have to re-decide effects every time they try a different layout. Combinations are more expressive than single-select.

**Revisit if**: Certain combinations look bad consistently — might need "known good" presets.

---

## 2025-12-04 — Free tier = varied, Paid tier = consistent

**Decision**: Free users get random beautiful outputs (screenshot-sampled colors). Paid users get brand-consistent outputs (brand tokens as defaults).

**Why**: The free tier proves value through delight and variety. The paid tier captures value through consistency. The upgrade trigger is wanting consistency.

**Revisit if**: Free tier delight is too low (outputs look random/bad) or paid tier consistency is too rigid (users want variety within brand).

---

## 2025-12-04 — No account required for free tier

**Decision**: Free tier works without signup. Auth only gates paid features.

**Why**: Every gate before the "wow" moment loses users. Anonymous-first, ask for account only when there's a reason.

**Revisit if**: We need analytics badly enough to justify the friction, or abuse becomes a problem.

---

*Add new entries above this line. Format: date, title, decision, why, revisit-if.*
