# Analysis Templates

Use these templates for structured product analysis.

---

## Feature Decision Template

Use when evaluating whether to build a feature.

```markdown
## Feature: [Name]

### The Ask
[One sentence describing what's being requested]

### Jobs-to-be-Done
When [situation], user wants to [motivation], so they can [outcome].

### Scoring (ICE)
- Impact (1-10): [score] — [why]
- Confidence (1-10): [score] — [evidence level]
- Ease (1-10): [score] — [effort estimate]
- **Total**: [I×C×E]

### Risk Assessment
- **Type**: One-way door / Two-way door
- **Reversibility**: [How hard to undo?]
- **Blast radius**: [What breaks if this fails?]

### Alignment Check
- [ ] Supports primary job-to-be-done
- [ ] Doesn't slow core flow
- [ ] User has actually asked for this
- [ ] Can ship in <1 week
- [ ] Visible in output (drives sharing)

### Recommendation
**Build / Don't build / Defer / Needs more info**

[Reasoning in 2-3 sentences]
```

---

## Prioritization Template

Use when comparing multiple features.

```markdown
## Prioritization: [Sprint/Quarter]

### Candidates

| Feature | Impact | Confidence | Ease | Score | Ship in |
|---------|--------|------------|------|-------|---------|
| [A]     | [1-10] | [1-10]     | [1-10]| [I×C×E]| [weeks] |
| [B]     | [1-10] | [1-10]     | [1-10]| [I×C×E]| [weeks] |
| [C]     | [1-10] | [1-10]     | [1-10]| [I×C×E]| [weeks] |

### Stack Rank
1. [Feature] — [one-line reason]
2. [Feature] — [one-line reason]
3. [Feature] — [one-line reason]

### Deferred (with reasons)
- [Feature]: [why not now]

### Dependencies
- [Feature A] blocks [Feature B]
- [Feature C] requires [external dependency]
```

---

## Open Question Template

Use when resolving product ambiguity.

```markdown
## Question: [The specific question]

### Context
[Why this decision matters now]

### Options

**Option A: [Name]**
- How it works: [description]
- Pros: [benefits]
- Cons: [drawbacks]
- Effort: [estimate]

**Option B: [Name]**
- How it works: [description]
- Pros: [benefits]
- Cons: [drawbacks]
- Effort: [estimate]

### Recommendation
**Go with Option [X]** because [core reasoning].

### Reversibility
[Can we change this later? How hard?]

### Next Steps
1. [Action]
2. [Action]
```

---

## User Feedback Analysis Template

Use when synthesizing user feedback into actionable insights.

```markdown
## Feedback Analysis: [Topic/Feature]

### Raw Feedback
- "[Quote 1]" — [context]
- "[Quote 2]" — [context]
- "[Quote 3]" — [context]

### Patterns
What users are actually saying (underlying need, not surface request):
1. [Pattern]
2. [Pattern]

### Jobs Affected
- [Job-to-be-done that's impacted]

### Severity
- Frequency: [How often mentioned]
- Impact: [How much it affects core flow]
- Urgency: [Time-sensitive?]

### Recommended Action
[Build / Investigate / Defer / Won't do]

[Reasoning]
```

---

## Launch Checklist Template

Use before shipping a feature.

```markdown
## Launch: [Feature Name]

### Pre-launch
- [ ] Core flow tested end-to-end
- [ ] Analytics events added
- [ ] Error states handled
- [ ] Mobile responsive (if applicable)
- [ ] Performance acceptable (<Xms)

### User Experience
- [ ] No new onboarding required
- [ ] Discoverable without explanation
- [ ] Doesn't slow existing flow
- [ ] Default behavior is sensible

### Rollout Plan
- [ ] Feature flag ready (if applicable)
- [ ] Rollback plan documented
- [ ] Success metrics defined

### Post-launch
- [ ] Monitor for errors
- [ ] Track adoption metrics
- [ ] Collect user feedback
- [ ] Schedule retrospective
```

---

## Competitive Analysis Template

Use when evaluating competitive landscape.

```markdown
## Competitor: [Name]

### Overview
- What they do: [one sentence]
- Target user: [who]
- Pricing: [model]

### Strengths
- [Strength 1]
- [Strength 2]

### Weaknesses
- [Weakness 1]
- [Weakness 2]

### Our Differentiation
- [How dopeshot is different/better]

### What We Can Learn
- [Idea to borrow]
- [Pattern to avoid]
```
