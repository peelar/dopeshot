# Product Decision Frameworks

## Table of Contents
1. [RICE Prioritization](#rice-prioritization)
2. [ICE Scoring](#ice-scoring)
3. [Opportunity Scoring](#opportunity-scoring)
4. [Kano Model](#kano-model)
5. [Jobs-to-be-Done](#jobs-to-be-done)
6. [Two-Way Door Decisions](#two-way-door-decisions)

---

## RICE Prioritization

Score features by: **Reach × Impact × Confidence ÷ Effort**

| Factor | Scale | Description |
|--------|-------|-------------|
| Reach | Users/quarter | How many users will this affect? |
| Impact | 0.25-3 | Minimal (0.25), Low (0.5), Medium (1), High (2), Massive (3) |
| Confidence | 0-100% | How sure are we about the estimates? |
| Effort | Person-weeks | How much work to ship? |

**When to use**: Comparing features across different domains. Good for quarterly planning.

**dopeshot context**: For indie hackers, "reach" often means virality potential (will they share it?).

---

## ICE Scoring

Simpler than RICE: **Impact × Confidence × Ease**

Each factor: 1-10 scale. Multiply for total score.

| Factor | Questions |
|--------|-----------|
| Impact | How much will this move our key metric? |
| Confidence | Do we have evidence this works? |
| Ease | Can we ship this quickly? |

**When to use**: Quick gut-check prioritization. Sprint planning.

---

## Opportunity Scoring

Focus on **unmet needs**: Importance × (Importance - Satisfaction)

1. List user outcomes they want to achieve
2. Rate each: How important? (1-10) How satisfied currently? (1-10)
3. Highest opportunity = High importance + Low satisfaction

**Example for dopeshot**:
- "Make my screenshot look professional" - Importance: 9, Satisfaction: 7 → Score: 18
- "Match my brand colors automatically" - Importance: 8, Satisfaction: 3 → Score: 40 (bigger opportunity!)

---

## Kano Model

Categorize features by user reaction:

| Category | If present | If absent | Build when? |
|----------|------------|-----------|-------------|
| **Must-have** | Expected | Frustrated | First |
| **Performance** | More satisfied | Less satisfied | Second |
| **Delighters** | Excited | Neutral | For differentiation |

**dopeshot context**:
- Must-have: Export works, image quality is good
- Performance: Speed, more layouts, more effects
- Delighters: AI-powered suggestions, brand matching

---

## Jobs-to-be-Done

Frame features as jobs users hire the product to do:

**Formula**: When [situation], I want to [motivation], so I can [outcome].

**dopeshot examples**:
- When **shipping a feature**, I want to **create a quick visual**, so I can **share on Twitter immediately**
- When **building in public**, I want to **consistent visuals**, so I can **build brand recognition**
- When **posting to LinkedIn**, I want to **professional output**, so I can **look credible**

Ask: Does this feature make the job faster/easier/better?

---

## Two-Way Door Decisions

**One-way doors**: Hard/impossible to reverse. Require careful analysis.
- Pricing model changes
- Core architecture decisions
- Public API contracts
- Brand positioning

**Two-way doors**: Easily reversible. Decide fast, iterate.
- UI copy changes
- Feature flag experiments
- Layout variations
- Default settings

**Rule**: Make two-way door decisions in hours, not days. Reserve deep analysis for one-way doors.
