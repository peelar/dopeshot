# TODO

**Goal:** Build the visual identity toolkit for indie hackers  
**Strategy:** Ship fast, validate, iterate

---

## PHASE 1: VALIDATE CORE (Current Priority)

**Goal:** Prove that screenshot enhancement works and people use it repeatedly.

**Status:** MVP exists, needs validation

### Batch 1.1 - Polish MVP ⚡

**Time:** 1-2 weeks

**Tasks:**

- [ ] Bug fixes and edge cases for current templates
- [ ] Improve color extraction accuracy
- [ ] Optimize gradient generation (readability)
- [ ] Add error handling (bad uploads, timeouts)
- [ ] Improve mobile experience
- [ ] Add basic analytics (track usage patterns)

**Success Criteria:**

- 95%+ of uploads produce good output
- < 15 second full flow
- Users export without customizing (most of the time)

**Why First:** Can't expand if core doesn't work reliably.

---

### Batch 1.2 - Activation & Distribution

**Time:** 1 week

**Tasks:**

- [ ] Add social share buttons to exports ("Made with Dope Shot")
- [ ] Create example gallery on landing page (show range)
- [ ] Add "Try with example" demo flow
- [ ] Write launch post (Twitter/LinkedIn)
- [ ] Post in indie hacker communities

**Success Criteria:**

- 100+ uploads in first week
- 20%+ return within 7 days
- Clear feedback on what works/doesn't

**Why Now:** Need users to validate if this is useful.

---

## PHASE 2: EXPAND USE CASES

**Goal:** Prove Dope Shot is useful beyond just product screenshots.

### Batch 2.1 - Text-Only Content Covers ⚡ NEXT BIG THING

**Time:** 2-3 weeks

**New Feature:**

- Create graphics WITHOUT screenshots
- Just typography + gradient/pattern backgrounds
- Same font system ("Founder Mode" etc)

**Use Cases:**

- Podcast episode covers
- Newsletter issue covers
- Blog post headers
- Video thumbnails
- Announcement graphics

**Tasks:**

- [ ] Design 3-5 text-only templates
- [ ] Build background pattern/gradient system
- [ ] Add "No screenshot" option to upload flow
- [ ] Create examples for each use case
- [ ] Update landing page with examples

**Success Criteria:**

- 30%+ of users try text-only mode
- Equal quality output to screenshot mode
- Users create series of matching covers

**Why This:** Highest value expansion. Same tech, broader use case. Validates "content toolkit" positioning.

---

### Batch 2.2 - Profile Headers

**Time:** 2-3 weeks

**New Feature:**

- Generate Twitter/LinkedIn/Substack headers
- Pull colors from user's brand (uploaded screenshot or saved palette)
- Specific dimensions for each platform

**Tasks:**

- [ ] Research header dimensions (Twitter, LinkedIn, Substack)
- [ ] Design 3-5 header templates
- [ ] Add header mode to tool
- [ ] Multi-size export (one design → all platforms)
- [ ] Create header-specific examples

**Success Criteria:**

- Users create headers that match their product shots
- Clear cohesive brand across profile + content
- 40%+ of existing users try header mode

**Why This:** Completes the "visual identity" promise. Screenshots + headers + covers = full toolkit.

---

## PHASE 3: BRAND CONSISTENCY SYSTEM

**Goal:** Make all of a user's graphics feel cohesive without manual work.

### Batch 3.1 - Saved Preferences

**Time:** 2 weeks

**New Feature:**

- Save color palette + font choice
- Apply automatically to new graphics
- "Use my Dope Shot style" one-click option

**Tasks:**

- [ ] Build preferences storage (local or account-based)
- [ ] Add "Save as my style" button after first export
- [ ] Auto-apply saved style to subsequent uploads
- [ ] Allow style editing/reset
- [ ] Track style consistency across user's exports

**Success Criteria:**

- 60%+ of repeat users save a style
- Saved style reduces customization time
- Users comment on brand consistency

**Why This:** Creates stickiness. Once they have a style, switching tools means rebuilding their brand.

---

### Batch 3.2 - Series Templates

**Time:** 2-3 weeks

**New Feature:**

- Create numbered/dated series
- "Day 1 of building" → generates matching Day 2, 3, 4...
- Weekly update templates
- Tutorial series with episode numbers

**Tasks:**

- [ ] Design series template variations
- [ ] Add series metadata (numbers, dates)
- [ ] Auto-increment for new graphics in series
- [ ] Create series presets ("Build in Public", "Weekly Update", etc)

**Success Criteria:**

- Users create 5+ graphics in a series
- Series graphics clearly belong together
- Reduces time for recurring content

**Why This:** Deepens habit loop. Tuesday = weekly update = open Dope Shot.

---

## PHASE 4: MONETIZATION & SCALE

**Goal:** Convert free users to paid, sustain the product.

### Batch 4.1 - Pricing Tiers

**Time:** 1-2 weeks

**Free Tier:**

- Product screenshots (core feature)
- 3 exports per week
- Optional "Made with Dope Shot" badge

**Pro ($9-15/month):**

- Unlimited exports
- Headers + content covers
- Brand consistency (saved styles)
- No watermark
- Multi-platform export

**Premium ($29-49/month):**

- Everything in Pro
- Series templates
- Priority support
- API access (future)
- Custom font uploads (future)

**Tasks:**

- [ ] Implement export limits for free tier
- [ ] Build payment integration (Stripe)
- [ ] Create upgrade prompts (non-annoying)
- [ ] Build simple account system
- [ ] Track conversion metrics

**Success Criteria:**

- 5-10% conversion to paid in first month
- Clear value prop for each tier
- Paid users export 3x more than free

---

### Batch 4.2 - Multi-Platform Export

**Time:** 1-2 weeks

**New Feature:**

- One design → auto-resize for Twitter, LinkedIn, IG, etc
- Batch export all sizes
- Platform-specific optimizations

**Tasks:**

- [ ] Map platform dimensions (Twitter, LinkedIn, IG, Facebook, etc)
- [ ] Build multi-export system
- [ ] Add export preview (show all sizes)
- [ ] Optimize layouts for each platform

**Success Criteria:**

- Saves users 10+ minutes per post
- Becomes primary reason to upgrade to Pro
- 70%+ of Pro users use multi-export

---

## PHASE 5: ECOSYSTEM FEATURES

**Goal:** Become indispensable part of indie hacker workflow.

### Batch 5.1 - Integrations (FUTURE)

**Time:** 3-4 weeks

**Possible Integrations:**

- GitHub (auto-generate graphics from commits)
- Analytics tools (milestone graphics from metrics)
- Newsletter platforms (auto-create issue covers)
- Twitter API (post directly)

**Why Later:** Need strong core product + paid users before building integrations.

---

### Batch 5.2 - Community Features (FUTURE)

**Time:** 3-4 weeks

**Possible Features:**

- Template marketplace (users share styles)
- Gallery of great examples
- "Made with Dope Shot" showcase
- Social discovery

**Why Later:** Need critical mass of users first.

---

## HOW TO PRIORITIZE

**For each new feature, ask:**

1. **Does it serve repeat use?** (If no → deprioritize)
2. **Does it maintain speed?** (If it slows core flow → rethink)
3. **Is it monetizable?** (Free features should drive paid upgrade)
4. **Can we validate quickly?** (Ship small, test, iterate)

**Red flags:**

- "Power users want this" (but normies don't need it)
- "Would be cool to have" (no clear repeat-use case)
- "Competitors do this" (not our user, not our problem)

**Green lights:**

- "I would use this weekly" (repeat use)
- "This makes brand consistency easier" (core value prop)
- "This saves 10 minutes every time" (clear time value)
