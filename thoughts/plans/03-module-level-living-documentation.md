# Implementation Plan: Module-Level Living Documentation

## Overview

Implement a module-level living documentation system using README.md files in each domain subdirectory. This addresses the problem of documentation decay where research/plan docs become stale as code evolves. The goal is to create artifacts that Claude Code can quickly read to understand current architecture without expensive exploration.

## Implementation Approach

We'll add README.md files to each domain module that document the **current state** of the code. These will be kept up-to-date through a new `/sync_docs` Claude command that integrates into the existing workflow. This approach:

- **Keeps docs close to code**: Harder to forget updating, easier to find
- **Minimal ceremony**: No complex formats or separate ADR files
- **Integrates with existing workflow**: Builds on current `/1_research_codebase`, `/2_create_plan`, `/4_implement_plan` pattern
- **Optimized for Claude Code**: Fast context loading without expensive exploration

**Why this approach:**
- Industry best practice: Module-level READMEs reduce onboarding time by 50% (documented)
- Low friction: Simple Markdown, no new tools required
- Incremental adoption: Start with one module, scale gradually
- Living documentation: Updates with code changes, not a historical snapshot

## Phase 1: Create Template and Pilot Module README

### Changes Required

#### 1. Create Module README Template
**File**: `thoughts/templates/MODULE_README_TEMPLATE.md`
**Changes**: Create a reusable template for all future module READMEs

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

#### 2. Create Pilot Module README
**File**: `domain/gradient-generation/README.md`
**Changes**: Create the first module README using gradient-generation (well-architected, self-contained)

```markdown
# Gradient Generation

## Purpose
Service layer that analyzes images and creates aesthetically pleasing gradients. Extracts dominant colors from uploaded images and applies color theory to build gradient configurations.

## File Structure
- `strategy.ts` - Defines gradient generation strategies (complementary, analogous, triadic)
- `color-manipulation.ts` - Color theory operations (hue shifts, saturation, lightness)
- `gradient-builder.ts` - Constructs gradient objects from color palettes
- `utils.ts` - Shared utilities for color calculations
- `types.ts` - Type definitions for strategies and configurations

## Key Exports
- `generateGradientFromImage(image: string, strategy: Strategy): CustomGradient` - Main entry point
- `GradientStrategy` - Type for strategy selection
- `ColorPalette` - Extracted color information

## Dependencies
- Imports from: `node-vibrant` (color extraction), `culori` (color manipulation)
- Used by: `hooks/useGradientGeneration`, UI components for auto-gradient features

## How It Works
1. Image is analyzed by node-vibrant to extract dominant colors
2. Strategy pattern applies color theory (complementary, analogous, triadic)
3. Color manipulation adjusts hue/saturation/lightness for aesthetics
4. Gradient builder constructs final gradient configuration with stops and angles

## Design Notes
- **Standalone service**: No dependencies on other domain modules, can be tested in isolation
- **Strategy pattern**: Makes it easy to add new gradient generation algorithms
- **Color space**: Uses OKLCH for perceptually uniform color manipulation
- **Type safety**: All color operations are strongly typed to prevent runtime errors
```

### Success Criteria

#### Automated Verification
- [ ] Template file exists at `thoughts/templates/MODULE_README_TEMPLATE.md`
- [ ] README exists at `domain/gradient-generation/README.md`
- [ ] Markdown renders correctly (no syntax errors)

#### Manual Verification
- [ ] Template is reusable and covers all essential sections
- [ ] Gradient generation README accurately describes current module state
- [ ] README is concise (under 200 lines)
- [ ] Claude Code can read it in seconds and understand module purpose
- [ ] All files in the module are listed
- [ ] Key exports are documented

---

## Phase 2: Create `/sync_docs` Claude Command

### Changes Required

#### 1. Create Sync Docs Command
**File**: `.claude/commands/sync_docs.md`
**Changes**: Create a new Claude command that automates README updates

```markdown
---
description: Update module READMEs after code changes
---

# Sync Module Documentation

After implementing changes to domain code, this command updates module READMEs to reflect the current state.

## Instructions

When the user runs `/sync_docs`:

1. **Find affected modules**:
   - Run `git diff main --name-only domain/` to see changed files
   - Identify which domain subdirectories were modified
   - List affected modules for user confirmation

2. **For each changed module**:
   - Read the current module README.md (if exists)
   - Read all .ts files in that module
   - Analyze and identify what's out of sync:
     - New files not listed in README
     - Removed files still listed in README
     - Changed exports (added/removed functions, types, classes)
     - New dependencies (imports from other modules)
     - Changed architecture or data flow
     - Updated design decisions

3. **Propose updates**:
   - Show proposed changes as a diff/summary
   - Explain what changed and why README needs updating
   - Ask user to review and approve

4. **Update README**:
   - Apply approved changes
   - Keep it concise (under 200 lines)
   - Maintain template structure
   - Preserve design notes unless invalidated by changes

5. **Commit guidance**:
   - Remind user to include README updates in same commit as code
   - Show git status to confirm both code and docs are staged

## Example Output

\```
Found 2 modified modules:
- domain/gradient-generation (3 files changed)
- domain/layout (1 file changed)

Checking domain/gradient-generation/README.md...

Changes detected:
+ New file: advanced-strategies.ts (not documented)
- Removed export: generateSimpleGradient() (still in README)
~ Updated: generateGradientFromImage() now accepts options parameter

Proposed README updates:
[Show diff here]

Apply these changes? [y/n]
\```

## Notes

- If module has no README yet, offer to create one from template
- Don't update README if only comments or formatting changed
- Focus on structural changes: files, exports, dependencies, architecture
- Keep "Design Notes" section unless architectural changes invalidate it
```

### Success Criteria

#### Automated Verification
- [ ] Command file exists at `.claude/commands/sync_docs.md`
- [ ] Command appears in Claude Code's slash command list
- [ ] No syntax errors in command markdown

#### Manual Verification
- [ ] Running `/sync_docs` successfully detects changed modules
- [ ] Command reads current README and module files
- [ ] Proposes accurate updates based on code changes
- [ ] Shows clear diff of what will change
- [ ] Applies updates correctly when approved
- [ ] Handles edge cases (no README exists, no changes needed)

---

## Phase 3: Create Remaining Module READMEs

### Changes Required

#### 1. Asset Module README
**File**: `domain/asset/README.md`
**Changes**: Document asset upload and metadata extraction

Key content:
- Purpose: Handle file uploads and extract metadata (colors, dimensions)
- File structure: types.ts, upload-orchestrator.ts, analyze-colors.ts, get-image-metadata.ts, data-url.ts
- Key exports: Asset type, uploadFile(), analyzeColors()
- Dependencies: FileReader API, node-vibrant
- How it works: Upload → data URL → metadata extraction → Asset object
- Design notes: Browser-dependent (FileReader), async operations

#### 2. Layout Module README
**File**: `domain/layout/README.md`
**Changes**: Document layout configuration and structure

Key content:
- Purpose: Layout models, configuration, and data structures for visual output
- File structure: types.ts, aspect.ts, export.ts, fonts.ts, gradient-presets.ts, etc.
- Key exports: LayoutConfig, BackgroundConfig, aspect ratios
- Dependencies: Imports gradients/, used by all UI components
- Design notes: Central state model, no circular deps with components

#### 3. Layout Gradients Module README
**File**: `domain/layout/gradients/README.md`
**Changes**: Document gradient data models and utilities

Key content:
- Purpose: Gradient type definitions and CSS generation (NOT generation logic)
- File structure: types.ts, utils.ts, generator.ts, colors.ts, index.ts
- Key exports: CustomGradient, GradientStop, toCSSGradient()
- Dependencies: None (pure data models)
- Design notes: Separated from gradient-generation service, no generation algorithms here

#### 4. Look Module README
**File**: `domain/look/README.md`
**Changes**: Document look definitions and registry

Key content:
- Purpose: Pure data definitions of available looks (visual templates)
- File structure: definitions.ts, AUTHORING.md
- Key exports: LOOK_DEFINITIONS array, LookDefinition type
- Dependencies: None (components separated to avoid circular deps)
- Design notes: Components live in components/looks/, this is data-only

### Success Criteria

#### Automated Verification
- [ ] All four README files exist
- [ ] All markdown renders correctly
- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`

#### Manual Verification
- [ ] Each README accurately describes its module
- [ ] All files in each module are documented
- [ ] Dependencies and usage are clear
- [ ] READMEs are concise (under 200 lines each)
- [ ] Claude Code can quickly understand each module from README
- [ ] Cross-references between modules are accurate

---

## Phase 4: Update Root Domain README

### Changes Required

#### 1. Update Domain Architecture Overview
**File**: `domain/README.md`
**Changes**: Add links to new module READMEs and explain the documentation system

Add new section after "Structure":

```markdown
## Module Documentation

Each subdirectory contains a README.md documenting its current architecture:

- [asset/](./asset/README.md) - Asset upload and metadata extraction
- [gradient-generation/](./gradient-generation/README.md) - Gradient generation service
- [layout/](./layout/README.md) - Layout configuration and models
- [layout/gradients/](./layout/gradients/README.md) - Gradient type definitions
- [look/](./look/README.md) - Look definitions (visual templates)

**For Claude Code**: Always read module READMEs first before exploring code. They document the current state and are updated with code changes.

**For developers**: When modifying domain code, run `/sync_docs` before committing to update affected module READMEs.
```

Update the "Dependencies Flow" section to reference module READMEs:

```markdown
**Important**:
- `gradient-generation` is independent and could import types from `layout/gradients` if needed
- `layout/gradients` should NEVER import from `gradient-generation`
- Domain layer should NEVER import from `components/` or `hooks/`

See individual module READMEs for detailed dependency information.
```

### Success Criteria

#### Automated Verification
- [ ] Domain README renders correctly
- [ ] All links to module READMEs work
- [ ] Build passes: `pnpm build`

#### Manual Verification
- [ ] Navigation between domain README and module READMEs is clear
- [ ] Instructions for Claude Code and developers are prominent
- [ ] Architecture overview still accurate
- [ ] Cross-references don't create confusion

---

## Phase 5: Documentation and Workflow Integration

### Changes Required

#### 1. Update Implementation Command
**File**: `.claude/commands/4_implement_plan.md`
**Changes**: Add step to sync docs after implementation

Add new step in "Instructions" section after step 3:

```markdown
4. **After completing all changes for a phase**:
   - Run automated verification commands
   - Report results
   - **If domain code was modified, run `/sync_docs`** ← NEW
   - Update checkboxes in the plan
```

Update "On completion" section:

```markdown
5. **On completion**:
   - Summarize all changes made
   - List any manual verification needed
   - **Confirm module READMEs were updated (if domain code changed)** ← NEW
   - Suggest next steps
```

#### 2. Create Workflow Documentation
**File**: `thoughts/research/005-living-documentation-workflow.md`
**Status**: Already exists
**Changes**: Add "Implementation Completed" note at top

```markdown
> **Status**: ✅ Implemented
> See module READMEs in `domain/` subdirectories.
> Use `/sync_docs` command to keep them updated.
```

#### 3. Add Pre-commit Hook Reminder (Optional)
**File**: `.husky/pre-commit` (create if desired)
**Changes**: Optional reminder if domain files changed

```bash
#!/bin/sh
# Remind to update module READMEs if domain code changed

changed_domains=$(git diff --cached --name-only domain/ | grep -o 'domain/[^/]*' | sort -u)

if [ -n "$changed_domains" ]; then
  echo ""
  echo "⚠️  Domain modules changed. Did you update READMEs?"
  echo "$changed_domains" | sed 's/domain/  - domain/g'
  echo ""
  echo "Run: /sync_docs"
  echo ""
  # Don't block commit, just remind
fi
```

**Note**: This is optional. Only add if you find yourself forgetting to sync docs.

### Success Criteria

#### Automated Verification
- [ ] Implementation command updated correctly
- [ ] Research doc has completion note
- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`

#### Manual Verification
- [ ] `/4_implement_plan` now includes docs sync step
- [ ] Workflow documentation is clear and complete
- [ ] Optional pre-commit hook works if installed
- [ ] Overall workflow makes sense: research → plan → implement → sync docs → commit

---

## Phase 6: Test and Validate Complete Workflow

### Changes Required

No file changes - this is a validation phase.

### Validation Steps

#### 1. Test `/sync_docs` with Real Changes

Make a small change to test the workflow:

1. Add a new function to `domain/gradient-generation/utils.ts`:
```typescript
export function testFunction() {
  return "test";
}
```

2. Run `/sync_docs`
3. Verify it detects the change
4. Verify it proposes updating the README
5. Apply the update
6. Verify README now mentions testFunction
7. Revert the test change

#### 2. Test Full Workflow with New Feature

Pick a small real feature to implement:

1. Run `/1_research_codebase` (if needed)
2. Run `/2_create_plan`
3. Run `/4_implement_plan`
4. Verify plan includes "sync docs" step
5. Run `/sync_docs` as part of implementation
6. Verify affected module READMEs are updated
7. Commit code + README together
8. Review commit to ensure both are included

#### 3. Verify Claude Code Benefits

Test that the documentation helps Claude Code:

1. Start a new task involving a domain module
2. Note if Claude reads the module README first
3. Verify it doesn't spend excessive time exploring code
4. Confirm README provided sufficient context
5. Note any improvements in context loading speed

### Success Criteria

#### Automated Verification
- [ ] All previous phase checks still pass
- [ ] No regression in build/tests/types

#### Manual Verification
- [ ] `/sync_docs` detects changes correctly
- [ ] README updates are accurate and useful
- [ ] Full workflow (research → plan → implement → sync → commit) works smoothly
- [ ] Documentation actually helps Claude Code understand modules faster
- [ ] No friction points in day-to-day usage
- [ ] READMEs stay under 200 lines
- [ ] Information is accurate and up-to-date

---

## Rollback Plan

If the living documentation system doesn't work as expected, rollback is straightforward:

### Immediate Rollback (any phase)

```bash
# Remove module READMEs (keep template and research doc)
rm domain/asset/README.md
rm domain/gradient-generation/README.md
rm domain/layout/README.md
rm domain/layout/gradients/README.md
rm domain/look/README.md

# Remove sync command
rm .claude/commands/sync_docs.md

# Revert changes to other files
git checkout domain/README.md
git checkout .claude/commands/4_implement_plan.md

# Verify build
pnpm build
```

### Partial Rollback

If only specific aspects don't work:

- **Remove git hook**: Delete `.husky/pre-commit` if it's annoying
- **Keep some module READMEs**: Remove unhelpful ones, keep useful ones
- **Modify sync command**: Adjust behavior without removing entirely
- **Keep template**: Even if not using now, it's a good reference

### Lessons Learned Documentation

If rolling back, document why in the research file:

```markdown
## Rollback Notes (if applicable)

[Date]: Rolled back living documentation system because:
- [Reason 1]
- [Reason 2]

What didn't work:
- [Issue 1]

What to try differently:
- [Alternative approach]
```

---

## Dependencies

**Required:**
- None! Just Markdown files and Claude commands

**Optional:**
- Husky (for git hooks): `pnpm add -D husky` - only if you want pre-commit reminders

---

## Timeline Estimate

- **Phase 1**: 20-30 minutes (template + pilot README)
- **Phase 2**: 20-30 minutes (sync command)
- **Phase 3**: 45-60 minutes (4 module READMEs)
- **Phase 4**: 10-15 minutes (update root README)
- **Phase 5**: 15-20 minutes (workflow integration)
- **Phase 6**: 30-45 minutes (testing and validation)

**Total**: 2.5-3.5 hours including testing

---

## Success Metrics

After implementation, measure success by:

**Quantitative:**
- Time for Claude Code to load module context: < 30 seconds (vs 2-5 minutes exploring)
- README freshness: Updated within same commit as code changes
- Coverage: 100% of domain modules have READMEs

**Qualitative:**
- Claude Code can understand module purpose without reading all files
- You don't waste time piecing together "where things are, how it works"
- Documentation stays current (not 3 months outdated)
- Low friction to update (part of workflow, not extra work)
- READMEs are actually useful (you reference them, not ignore them)

---

## Notes

### Why Start with Gradient Generation?

It's the ideal pilot module because:
- Self-contained (no dependencies on other domain modules)
- Well-architected (clear separation of concerns)
- Complex enough to test documentation value
- Not too large (manageable scope)
- Recently worked on (fresh in mind)

### Avoiding Over-Documentation

Keep READMEs focused:
- **Do document**: Structure, exports, dependencies, architecture
- **Don't document**: Implementation details, line-by-line code explanations, historical context

The goal is to help Claude Code understand "what and where", not replace reading the code entirely.

### Future Enhancements

Once the system is proven:
- Add READMEs to other top-level directories (`components/`, `hooks/`)
- Generate module graphs showing dependencies
- Add examples/usage snippets to READMEs
- Create a docs site if project goes open source

But start simple: just domain modules, just the essentials.
