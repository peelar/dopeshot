---
name: landing-page-builder
description: Create distinctive, production-grade SaaS landing pages with high design quality and conversion optimization following 2025 best practices. Use when users request to (1) Build/create a landing page, (2) Design a high-converting page, (3) Audit or improve an existing landing page, (4) Implement modern landing page patterns (bento grids, scroll experiences, micro-interactions), or (5) Optimize landing page copy and conversion elements. Produces polished React artifacts with Tailwind CSS that avoid generic AI aesthetics.
---

# Landing Page Builder

Build high-converting SaaS landing pages that combine cutting-edge 2025 design patterns with proven conversion optimization principles.

## Overview

This skill provides two primary workflows:

1. **Creation workflow**: Generate new landing pages from scratch
2. **Audit & modification workflow**: Analyze and improve existing landing pages

Both workflows emphasize modern design aesthetics, strong copywriting, and conversion-focused architecture.

## Core Design Principles (2025)

### Visual Design Language

**Bento Grid Layouts**
- Use asymmetric grid systems with varying cell sizes
- Create visual hierarchy through intentional whitespace
- Break traditional columnar layouts with overlapping elements
- Implement with CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(...))` or explicit grid areas

**Spatial Design & Depth**
- Layer elements with subtle shadows and backdrop blur: `backdrop-blur-xl`, `shadow-2xl`
- Use z-index strategically to create depth perception
- Implement glassmorphism sparingly: semi-transparent backgrounds with blur
- Add subtle gradients for dimensionality: `bg-gradient-to-br from-[color]/20`

**Micro-interactions**
- Hover states that feel alive: `group-hover:scale-105 transition-transform duration-300`
- Magnetic buttons (subtle pull effect on hover)
- Ripple effects on clicks
- Smooth state transitions: `transition-all duration-500 ease-out`
- Loading skeleton states for async content

**Rich Scroll Experiences**
- Parallax scrolling for hero backgrounds (use `transform: translateY()` with scroll position)
- Fade-in animations on scroll: intersection observer pattern
- Sticky sections that transform as you scroll
- Progress indicators that track reading position
- Smooth scroll behavior: `scroll-behavior: smooth`

### Copywriting Frameworks

**Hierarchy of messaging:**
1. **Hero headline**: Promise a specific outcome (not feature description)
2. **Hero subheadline**: Expand on who it's for and why now
3. **Social proof**: Immediate credibility (logos, metrics, testimonials)
4. **Value proposition sections**: Problem → Solution → Outcome pattern
5. **Feature sections**: Benefits-first, not feature lists
6. **Final CTA**: Remove friction, create urgency

**Voice & Tone:**
- Active voice, present tense
- Specific numbers over vague claims ("10x faster" not "much faster")
- Customer language, not company jargon
- Scannable: short paragraphs, bullets for lists
- Conversational but authoritative

**Conversion-focused patterns:**
- PAS (Problem-Agitate-Solution)
- AIDA (Attention-Interest-Desire-Action)
- Before/After/Bridge
- Feature → Advantage → Benefit translation

## Creation Workflow

When building a new landing page, follow this sequence:

### 1. Understand the Product/Service

Gather context before writing any code:
- What problem does this solve?
- Who is the target audience? (ICP - Ideal Customer Profile)
- What's the primary conversion goal? (signup, demo, purchase)
- What makes it different from competitors?
- What specific outcome does the user achieve?

### 2. Structure the Page Architecture

Standard high-converting SaaS landing page structure:

```
1. Hero Section
   - Headline (outcome-focused)
   - Subheadline (context + credibility)
   - Primary CTA
   - Visual (product screenshot, demo video, or illustration)
   - Social proof teaser (logos or metrics)

2. Social Proof Section
   - Customer logos / testimonials
   - Key metrics (users, revenue, time saved)
   - Trust badges (security, compliance)

3. Problem Section
   - Agitate the pain point
   - Show the current broken state
   - Build emotional resonance

4. Solution Overview
   - How the product solves it
   - 2-3 key differentiators
   - Visual demonstration

5. Features/Benefits Sections (2-3 sections)
   - Each focuses on ONE core benefit
   - Use bento grid layouts to showcase
   - Include micro-interactions
   - Pair features with outcomes

6. How It Works
   - 3-4 step process
   - Visual progression
   - Reduce perceived complexity

7. Deeper Social Proof
   - Detailed testimonials with photos
   - Case studies or results
   - Video testimonials if available

8. Pricing (if applicable)
   - Clear tiers
   - Highlight recommended option
   - Annual vs monthly toggle
   - FAQ for objections

9. Final CTA Section
   - Restate core value proposition
   - Remove friction (free trial, no CC required)
   - Create urgency (limited spots, ending soon)
   - Secondary CTA option (demo, contact)

10. Footer
    - Trust signals
    - Quick links
    - Contact info
```

Adapt this structure based on the specific product, but maintain conversion-focused flow.

### 3. Implement with Technical Excellence

**Component Architecture:**
```jsx
// Use section-based components for modularity
const HeroSection = () => { ... }
const SocialProofBanner = () => { ... }
const ProblemSection = () => { ... }
const FeatureBento = () => { ... }
const TestimonialCarousel = () => { ... }
const PricingSection = () => { ... }
const FinalCTA = () => { ... }
```

**Tailwind Best Practices:**
- Use design tokens via Tailwind config (colors, spacing, typography)
- Leverage `@apply` for repeated patterns in custom CSS
- Use Tailwind's built-in animations: `animate-pulse`, `animate-bounce`, etc.
- Create custom animations in Tailwind config for brand-specific motion
- Responsive design: mobile-first with `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints
- Dark mode support: `dark:` variant (if appropriate)

**Performance Optimization:**
- Lazy load images: `loading="lazy"`
- Use next-gen formats: WebP with fallbacks
- Implement intersection observer for scroll animations
- Minimize layout shifts: explicit width/height on images
- Font optimization: preload critical fonts, font-display: swap

**Accessibility:**
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`
- ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast (WCAG AA minimum)
- Focus indicators: `focus:ring-2 focus:ring-offset-2`

### 4. Micro-interaction Patterns

Implement these interaction details:

```jsx
// Button with magnetic hover effect
<button className="group relative overflow-hidden rounded-xl bg-blue-600 px-8 py-4 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
  <span className="relative z-10">Get Started</span>
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
</button>

// Card with depth on hover
<div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
  {/* content */}
</div>

// Scroll-triggered fade-in
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    },
    { threshold: 0.1 }
  );
  
  document.querySelectorAll('.fade-in-on-scroll').forEach((el) => observer.observe(el));
}, []);
```

### 5. Copy That Converts

**Hero headline formula:**
- [Desired Outcome] for [Target Audience] without [Pain Point]
- Examples:
  - "Ship features 10x faster without sacrificing quality"
  - "Close deals in minutes, not months"
  - "Scale your content without hiring writers"

**Feature → Benefit translation:**
- ❌ "Advanced analytics dashboard"
- ✅ "See exactly which features drive revenue"

**Social proof specificity:**
- ❌ "Trusted by thousands"
- ✅ "Trusted by 12,847 companies in 94 countries"

**CTA optimization:**
- ❌ "Submit" / "Click Here"
- ✅ "Start your free trial" / "Get instant access" / "Show me how"

## Audit & Modification Workflow

When improving an existing landing page, follow this diagnostic approach:

### 1. Comprehensive Audit

Analyze the existing page across these dimensions:

**Visual Hierarchy (Scoring: 1-10)**
- Is the most important information immediately visible?
- Does the eye flow naturally through the page?
- Are CTAs visually prominent?
- Is there sufficient whitespace?

**Messaging Clarity (Scoring: 1-10)**
- Within 5 seconds, can you understand what this product does?
- Is the value proposition customer-focused (outcome) or feature-focused?
- Is the headline specific or generic?
- Does copy address the ICP's actual pain points?

**Conversion Architecture (Scoring: 1-10)**
- Is there a clear primary CTA above the fold?
- Are there multiple conversion opportunities throughout?
- Is friction minimized? (too many form fields, unclear next steps)
- Are objections addressed before the CTA?

**Design Modernity (Scoring: 1-10)**
- Does it use 2025 patterns or feel dated (2020-2022 style)?
- Are there micro-interactions and delightful moments?
- Is the layout predictable or interesting?
- Does it use modern typography and spacing?

**Technical Performance (Scoring: 1-10)**
- Page load speed (<3s ideal)
- Mobile responsiveness
- Animation performance (no jank)
- Accessibility compliance

### 2. Prioritized Recommendations

After audit, provide specific, actionable improvements ranked by impact:

**High Impact (do first):**
- Hero headline/subheadline rewrites
- CTA copy and placement optimization
- Add missing social proof
- Fix critical design hierarchy issues
- Mobile responsiveness fixes

**Medium Impact:**
- Feature section restructuring (benefits-first)
- Add micro-interactions to CTAs
- Improve visual design (bento grids, depth)
- Testimonial placement and formatting
- Scroll experience enhancements

**Low Impact (polish):**
- Animation refinements
- Copy tweaks for voice consistency
- Footer optimization
- Secondary page elements

### 3. Implement Improvements

When modifying existing code:
- Preserve working functionality
- Implement changes incrementally
- Test responsive behavior after each change
- Maintain or improve performance
- Document significant architectural changes

## Common Patterns & Examples

### Bento Grid Feature Section

```jsx
<section className="py-24 px-4">
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4">
      {/* Large feature - spans 2x2 */}
      <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <h3 className="text-2xl font-bold mb-4">Primary Feature</h3>
        {/* content */}
      </div>
      
      {/* Medium features - span 1x2 or 2x1 */}
      <div className="md:col-span-2 md:row-span-1 rounded-3xl bg-white border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-2">Secondary Feature</h3>
        {/* content */}
      </div>
      
      {/* Small features - 1x1 */}
      <div className="rounded-3xl bg-white border border-gray-200 p-6">
        {/* content */}
      </div>
      
      <div className="rounded-3xl bg-gradient-to-br from-green-50 to-blue-50 p-6">
        {/* content */}
      </div>
      
      <div className="md:col-span-2 rounded-3xl bg-white border border-gray-200 p-6">
        {/* content */}
      </div>
    </div>
  </div>
</section>
```

### Glassmorphism CTA Card

```jsx
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-px">
  <div className="relative rounded-3xl bg-white/10 backdrop-blur-xl p-12">
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
    <div className="relative z-10">
      <h2 className="text-4xl font-bold text-white mb-4">
        Ready to 10x your productivity?
      </h2>
      <p className="text-xl text-white/90 mb-8">
        Join 12,000+ teams shipping faster with [Product]
      </p>
      <button className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all hover:scale-105">
        Start Free Trial
      </button>
    </div>
  </div>
</div>
```

### Scroll-triggered Stats Counter

```jsx
const [hasAnimated, setHasAnimated] = useState(false);
const [count, setCount] = useState(0);
const targetCount = 12847;

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = 0;
        const duration = 2000;
        const increment = targetCount / (duration / 16);
        
        const timer = setInterval(() => {
          start += increment;
          if (start >= targetCount) {
            setCount(targetCount);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
      }
    },
    { threshold: 0.5 }
  );
  
  const element = document.getElementById('stats-counter');
  if (element) observer.observe(element);
  
  return () => observer.disconnect();
}, [hasAnimated]);

return (
  <div id="stats-counter" className="text-6xl font-bold">
    {count.toLocaleString()}+
  </div>
);
```

## Quality Checklist

Before delivering, verify:

**Design:**
- [ ] Visual hierarchy is clear and intentional
- [ ] Bento grids or asymmetric layouts used (not rigid columns)
- [ ] Micro-interactions on all interactive elements
- [ ] Smooth transitions (300-500ms duration)
- [ ] Proper use of depth and shadows
- [ ] Responsive on mobile, tablet, desktop

**Copy:**
- [ ] Headline focuses on outcome, not feature
- [ ] Benefits mentioned before features
- [ ] Specific numbers and claims
- [ ] Active voice, present tense
- [ ] No jargon or buzzwords
- [ ] Clear, prominent CTAs

**Conversion:**
- [ ] Primary CTA above the fold
- [ ] Social proof in first screen
- [ ] Objections addressed before CTA
- [ ] Multiple conversion opportunities
- [ ] Friction minimized (simple forms)
- [ ] Clear value proposition

**Technical:**
- [ ] Semantic HTML structure
- [ ] Accessibility compliant
- [ ] Fast page load (<3s)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Smooth animations (60fps)

## Anti-Patterns to Avoid

**Design:**
- ❌ Generic stock photos (especially handshake/team photos)
- ❌ Centered everything (creates boring symmetry)
- ❌ Overuse of animations (causes distraction)
- ❌ Inconsistent spacing and sizing
- ❌ Poor color contrast (unreadable text)

**Copy:**
- ❌ "Industry-leading solution" (generic, meaningless)
- ❌ "We are passionate about..." (company-focused, not customer-focused)
- ❌ Long paragraphs (hard to scan)
- ❌ Feature lists without context
- ❌ Vague CTAs ("Learn More", "Click Here")

**Conversion:**
- ❌ No clear CTA above fold
- ❌ Too many competing CTAs
- ❌ Forms with 10+ fields
- ❌ No social proof
- ❌ Burying pricing information
- ❌ Auto-playing videos with sound

## Reference Resources

For deeper understanding of specific topics, refer to:

- **Copywriting frameworks**: See references/copywriting-formulas.md
- **Tailwind design patterns**: See references/tailwind-patterns.md
- **Conversion optimization tactics**: See references/conversion-tactics.md
- **Animation examples**: See references/animation-cookbook.md

Load these reference files only when working on specific aspects that require deeper knowledge.
