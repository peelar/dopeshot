# Decision Thinking Tools

Lightweight tools for when you need more structure than a gut call. Don't default to these — use them when a conversation needs a sharper frame.

---

## Jobs-to-be-Done

The most useful lens for dopeshot. Frame features as jobs users hire the product to do:

**When [situation], I want to [motivation], so I can [outcome].**

dopeshot examples:
- When **shipping a feature**, I want to **create a quick visual**, so I can **share on Twitter immediately**
- When **building in public**, I want **consistent visuals**, so I can **build brand recognition**
- When **posting to LinkedIn**, I want **professional output**, so I can **look credible**
- When **writing a changelog**, I want **matching graphics**, so I can **make updates look polished**
- When **launching on Product Hunt**, I want **a gallery of screenshots**, so I can **make a strong first impression**

The question to ask: Does this feature make the job faster, easier, or better?

---

## Two-Way Door Test

**Two-way doors** — easy to reverse. Decide fast, ship, iterate.
- UI copy, default values, layout options, effect settings, visual tweaks
- Adding a new template, changing font options, adjusting gradient algorithms

**One-way doors** — hard to undo. Think harder, get alignment.
- Pricing model, core architecture, public API, data schema, brand positioning
- Authentication system, payment provider, database structure

Rule: If you can revert it in an afternoon, just ship it.

---

## Quick Comparison

When comparing 2-3 options and gut feel isn't enough, score each on three things:

- **Impact**: How much does this move the needle? (low / medium / high)
- **Confidence**: Do we have evidence, or is this a guess? (guess / some signal / strong signal)
- **Effort**: How long to ship? (hours / days / weeks)

Don't multiply numbers. Just eyeball which option has the best ratio of impact-to-effort with reasonable confidence. If two options are close, pick the one that ships faster.

---

## Revenue Impact Check

For any feature that touches monetization:

1. **Revenue impact?** Does this directly enable charging, increase conversion, or reduce churn?
2. **Distribution impact?** Does this make free tier more shareable or viral?
3. **Scope check:** Can you build an MVP in <1 week? If not, can you slice it smaller?
4. **Alternative cost:** What won't get built if you build this?

If it doesn't hit #1 or #2, it's probably a distraction.

---

## Priority Stack

When multiple things compete for attention, stack them:

1. **Blockers** — anything preventing current users from paying or using
2. **Revenue features** — direct path to payment (brand profiles, auth, pricing)
3. **Retention features** — keep paid users (asset history, more layouts)
4. **Growth features** — attract new users (new asset types, integrations, virality)

---

## Rabbit Hole Detector

Warning signs to stop and reassess:
- You're 3+ iterations deep with no clear improvement
- The solution requires more knobs than the original problem
- You're solving a problem users haven't complained about
- The "better" version isn't obviously better to a stranger in 5 seconds
- You've spent more than 2 days on something scoped as "quick"

When stuck, zoom out: "What job is the user actually trying to do?"

---

## Ship-or-Wait Checklist

Before deciding to hold vs. ship:

- [ ] Does the 80% version deliver clear value?
- [ ] Will real user feedback improve this faster than more building?
- [ ] Is the remaining 20% genuinely blocking, or just uncomfortable?
- [ ] Can you add the polish in a follow-up without breaking anything?

If you checked 3 of 4 — ship it.
