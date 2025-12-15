# Living Documentation for Claude Code: Module READMEs

> **Status**: ✅ Implemented (2024-12-12)
> - Module READMEs created in all `domain/` subdirectories
> - `/sync_docs` command available
> - Workflow integrated into `/4_implement_plan`

## Problem

Your `thoughts/research/` and `thoughts/plans/` docs are great for initial context but become **stale as code evolves**. They're **far from the code**, so Claude Code (and you) waste time piecing together "where things are, how it works" every time you start a new task.

**Goal**: Create artifacts at the module level that Claude Code can quickly read to understand current architecture without expensive exploration.

## Solution: Module-Level READMEs

Add `README.md` to each `domain/` subdirectory that documents **current state**:

```
domain/
├── README.md (architecture overview - already exists)
├── asset/
│   ├── README.md ← NEW
│   └── *.ts
├── gradient-generation/
│   ├── README.md ← NEW
│   └── *.ts
├── layout/
│   ├── README.md ← NEW
│   └── gradients/
│       ├── README.md ← NEW
│       └── *.ts
└── look/
    ├── README.md ← NEW
    └── *.ts
```

**Why this works:**
- Claude Code reads these first before exploring code
- Close to code = harder to forget updating
- Markdown format = works with your existing workflow
- Module-scoped = manageable size

## What Goes in Module READMEs

**Purpose**: Help Claude Code (or you) quickly understand module without reading all the code.

**Essential sections:**
1. **Purpose** - What this module does (2-3 sentences)
2. **File Structure** - What each file is responsible for
3. **Key Exports** - Main functions/types/classes
4. **Dependencies** - What it imports from, what uses it
5. **How It Works** - Brief architecture explanation (if non-trivial)

**Optional sections:**
- Design decisions (inline, not separate ADRs)
- Usage examples
- Related files outside this module

## Template

```markdown
# [Module Name]

## Purpose
[2-3 sentences: what this module does and why it exists]

## File Structure
- `types.ts` - [what's in it]
- `service.ts` - [what's in it]
- `utils.ts` - [what's in it]

## Key Exports
- `exportedFunction()` - [what it does]
- `ExportedType` - [what it represents]

## Dependencies
- Imports from: `domain/other-module`
- Used by: `components/Foo`, `hooks/useBar`

## How It Works
[Brief explanation of architecture/data flow if non-obvious]

## Design Notes
[Why you made certain choices, constraints, patterns to follow]
```

**Keep it short** - aim for 100-200 lines max. Claude Code should be able to read it in seconds.

## Automation: How to Keep READMEs Fresh

### Option 1: Claude Command `/sync_docs` (Recommended)

Add to `.claude/commands/sync_docs.md`:

```markdown
---
description: Update module READMEs after code changes
---

# Sync Module Documentation

After implementing changes to domain code:

1. **Find affected modules**:
   - Run `git diff main --name-only domain/`
   - Identify which domain subdirectories changed

2. **For each changed module**:
   - Read the current module README.md
   - Read all .ts files in that module
   - Identify what's out of sync:
     - New files not listed
     - Removed files still listed
     - Changed exports
     - New dependencies
     - Architecture changes

3. **Update README**:
   - Show proposed changes as diff
   - Apply updates
   - Keep it concise (under 200 lines)

4. **Commit with changes**:
   - Include README updates in same commit as code
```

**Usage**: Run `/sync_docs` at the end of `/4_implement_plan` or before committing.

### Option 2: Integrate into `/4_implement_plan`

Modify `.claude/commands/4_implement_plan.md` to include a final step:

```markdown
5. **After each phase**:
   - Summarize what was completed
   - Show verification results
   - **Update affected module READMEs** ← ADD THIS
   - Confirm before proceeding to next phase
```

This way, docs stay synced automatically during implementation.

### Option 3: Git Hook (Manual Reminder)

Create `.husky/pre-commit`:

```bash
#!/bin/sh
# Remind to update module READMEs if domain code changed

changed_domains=$(git diff --cached --name-only domain/ | grep -o 'domain/[^/]*' | sort -u)

if [ -n "$changed_domains" ]; then
  echo "⚠️  Domain modules changed. Did you update READMEs?"
  echo "$changed_domains" | sed 's/domain/  - domain/g'
  echo ""
  echo "Run: /sync_docs"
  echo ""
  # Don't block commit, just remind
fi
```

Reminder only, doesn't auto-update (since Claude Code does the updates).

## Workflow Integration

**Current flow:**
```
/1_research_codebase → thoughts/research/00N-*.md
/2_create_plan → thoughts/plans/0N-*.md
/4_implement_plan → code changes → commit
```

**Proposed flow:**
```
/1_research_codebase → thoughts/research/00N-*.md (keep as-is)
/2_create_plan → thoughts/plans/0N-*.md (keep as-is)
/4_implement_plan → code changes
/sync_docs → update module READMEs ← NEW
commit (includes code + README updates)
```

**When to update what:**

| Doc Type | When | Keep it? |
|----------|------|----------|
| `thoughts/research/` | Initial exploration | Archive, don't update |
| `thoughts/plans/` | Before implementation | Archive after completion |
| `domain/*/README.md` | **After every code change** | **Living document** |

## Implementation Steps

### 1. Pick One Module to Pilot (10 min)

Start with `domain/gradient-generation` (self-contained, well-architected).

Create `domain/gradient-generation/README.md` using template above.

### 2. Create `/sync_docs` Command (5 min)

Create `.claude/commands/sync_docs.md` with the content from "Option 1" above.

### 3. Test the Workflow (next feature)

Next time you implement something:
- Run `/4_implement_plan` as usual
- Run `/sync_docs` before committing
- Commit code + README together

### 4. Scale Gradually

After 2-3 features, create READMEs for other modules:
- `domain/asset/`
- `domain/layout/`
- `domain/layout/gradients/`
- `domain/look/`

### 5. Optional: Add Git Hook

If you find yourself forgetting, add the pre-commit hook reminder.

## Why This Works for Claude Code

1. **Fast context loading**: Claude reads `domain/X/README.md` before exploring code
2. **Always current**: Updated with code changes, not 3 months ago
3. **Right granularity**: Module-level (5-10 files) not repo-level (hundreds of files)
4. **Low friction**: Command triggers sync, part of existing workflow
5. **Markdown**: Works with current tooling, no new formats

## Key Insight: Skip ADRs

ADRs are popular in industry but don't solve your problem. They're:
- Still detached from code (like research/plans)
- Immutable (can't update as code evolves)
- Ceremony-heavy (status, superseded-by links)

Instead: **Put design decisions inline in module READMEs**. When architecture changes, update the README. No separate ADR files to maintain.

---

**Sources:**
- [Monorepo Best Practices - MoldStud](https://moldstud.com/articles/p-best-practices-and-tips-for-creating-a-monorepo-on-github)
- [Spotify: Solving documentation for monorepos](https://engineering.atspotify.com/2019/10/solving-documentation-for-monoliths-and-monorepos)
- [Living Document Best Practices - Docsie](https://www.docsie.io/blog/glossary/living-document/)
- [Code Documentation Best Practices 2025 - Dualite](https://dualite.dev/blog/code-documentation-best-practices)
