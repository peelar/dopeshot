# dopeshot — Monetization

## Model

Screenshots are the free hook. Brand consistency and additional formats are the paid product.

## Tiers

| Tier | Screenshots | Testimonials + future formats | Brand styling |
|------|------------|-------------------------------|---------------|
| **Free (no account)** | Full access, neutral styling | Locked | No |
| **Free (account)** | Full access, neutral styling | Locked | No |
| **Paid** | Full access, brand styling | Full access, brand styling | Yes |

## Why this split

- **Screenshots stay free forever.** They prove the tool's quality, drive word-of-mouth, and bring users in the door. No watermark, no degradation.
- **Additional formats are paid.** Testimonials are the first gated format. Future formats (announcements, changelogs, feature launches) follow the same pattern. Format gating is binary and obvious — you can either make them or you can't.
- **Brand consistency is the second lever.** Personality styling (Founder/Hipster/Kawaii/Hacker), brand colors, fonts, and logo integration make paid outputs visually distinct from free. This lever gets stronger as the brand system matures.

## Compounding moat

Each new format added to dopeshot makes the paid tier more valuable without changing the price. A user paying for testimonials today automatically gets announcements tomorrow. The more formats behind the paywall, the stickier the subscription becomes.

The long-term moat is not any single format — it's that the user's entire visual identity lives in dopeshot. Switching cost grows with every format they use.

## Trial period

A trial period (likely ~2 weeks) will let free users experience paid formats before committing. Details (trigger, duration, scope) to be decided when we implement the paywall.

## Decisions

- **No transparent background export.** Users want finished, share-ready graphics, not raw assets to composite elsewhere.
- **No watermark on free tier.** Watermarking screenshots would degrade the free experience. Watermarking only some formats creates inconsistency. Format gating is cleaner.
- **No testimonial collection/storage.** We own the "format" step (turning raw text into a beautiful visual), not the "collect" or "store" steps. Tools like Senja and Testimonial.to own collection. We own the last visible mile.

## Pipeline positioning

```
Collect → Store → Format → Share
                    ↑
              dopeshot lives here
```

The "format" step is the visible mile. Nobody sees how a testimonial was collected. Everyone sees how it looks when shared.

## Future considerations

- **Tweet-to-testimonial**: Paste a tweet URL, auto-extract quote + avatar + name, generate branded testimonial graphic. Extends slightly upstream into "collect" without building a testimonial CRM.
- **Platform export presets**: Label aspect ratios by platform ("Instagram Post", "LinkedIn", "Story") instead of raw ratios. Add 1:1 square format.
- **Multi-format export**: Export for multiple platforms at once.
