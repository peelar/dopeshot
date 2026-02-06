# Initial Canvas Unification Spec

## Decision

Use one default behavior across formats: start from a `demo canvas`, never an empty canvas.

This applies to Screenshot and Testimonial, for both first-time and returning users when they start a new design.

## Problem

Current behavior is inconsistent:

- Screenshot path often lands on an empty canvas (`Drop an image to start`)
- Testimonial path lands on prefilled demo content (quote, name, avatar)

This creates unnecessary cognitive friction and conflicts with the product principle of smart defaults.

## Recommendation

Ship a unified `demo-first` model:

1. Selecting Screenshot seeds a screenshot demo preset.
2. Selecting Testimonial seeds a testimonial demo preset.
3. Both formats show a clear "this is demo content" helper and a one-click path to personalize.

This is a two-way door and can be iterated quickly.

## Scope

In scope:

- Initial seed behavior for first visit and returning visits
- Format switching defaults
- New design reset behavior
- Exact copy for helper UI
- Neutral testimonial demo identity (remove founder identity from defaults)

Out of scope:

- Pricing or auth gating changes
- Memory/save architecture changes
- New layout designs

## State Logic

### Inputs

- `isLoggedIn`
- `activeFormat` (`none | screenshot | testimonial`)
- `loadedMemoryItemId` (saved design loaded or not)
- `isNewDesignSession` (first load or explicit `New` action)

### Rules

1. If `loadedMemoryItemId` exists, load that design unchanged.
2. If no saved design is loaded and `activeFormat === none`, show the format chooser.
3. After format choice:
   - `screenshot` => apply screenshot demo preset.
   - `testimonial` => apply testimonial demo preset.
4. On `New`, return to format chooser and then apply the selected demo preset.
5. Never show a blank canvas immediately after format selection.

### First Visit vs Returning Visit

| Scenario | Behavior |
|---|---|
| First visit, no saved design loaded | Format chooser -> demo preset for chosen format |
| Returning visit, no saved design loaded | Same as first visit |
| Returning visit with saved design route | Load saved design; do not override with demo |
| User clicks `New` | Format chooser -> demo preset for chosen format |

## UX Copy (Exact)

### Format chooser

- Heading: `What do you want to ship today?`
- Screenshot card description: `Wrap a screenshot in a beautiful layout`
- Testimonial card description: `Create a social proof graphic`

### Screenshot demo helper

- Badge: `Demo`
- Helper line: `Drop your screenshot to personalize this design.`
- Primary action: `Upload screenshot`

### Testimonial demo helper

- Badge: `Demo`
- Helper line: `Replace the quote, author, and avatar with your own.`
- Primary action: `Edit testimonial`

### Locked testimonial (logged out)

- Tooltip title: `Sign in to create testimonials`
- Link label: `Sign in`

## Demo Content Defaults

Use neutral defaults only.

Testimonial:

- Quote: `This product completely transformed how we work. The results speak for themselves.`
- Name: `Alex Morgan`
- Title: `Founder`
- Company: `Northstar Labs`
- Rating: `5`
- Avatar: neutral generic avatar (not founder photo)

Screenshot:

- Keep existing screenshot demo preset as baseline
- Preserve strong visual quality so first render is post-worthy

## Implementation Notes (Engineering)

Primary files:

- `apps/app/src/app/(playground)/_components/playground-page.tsx`
- `apps/app/src/components/selectors/layout-selector.tsx`
- `apps/app/src/domain/demo/presets.ts`
- `apps/app/src/domain/layout-def/definitions.ts`
- `apps/app/src/hooks/use-memory.ts`
- `apps/app/src/components/ui/adrian-avatar.tsx` (replace usage in testimonial demo path)

Recommended implementation shape:

1. Add format-specific preset helpers in `domain/demo/presets.ts`.
2. Replace empty-config initialization path for logged-in new sessions with demo seeding after format selection.
3. On format tab switch, seed with format demo preset (not raw `createConfig()`).
4. Change testimonial defaults to neutral author identity.
5. Keep helper CTA visible until first meaningful user edit in that format.

## Acceptance Criteria

1. Choosing Screenshot never lands on an empty canvas.
2. Choosing Testimonial never lands on founder identity defaults.
3. First-time and returning users see identical default behavior when starting a new design.
4. Saved design loading behavior is unchanged.
5. `New` returns user to chooser and demo-seeded start, not blank state.
6. Core flow speed remains under current target (no noticeable regression).

## Metrics

Track:

- `format_chosen` with `format`
- `demo_seed_applied` with `format`
- `demo_personalized` with `format` and `action_type` (`upload_screenshot`, `edit_text`, `upload_avatar`, `upload_logo`)

Success signal:

- Lower drop-off between format choice and first export for Screenshot and Testimonial.
