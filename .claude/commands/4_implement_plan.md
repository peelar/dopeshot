---
description: Execute a plan systematically, phase by phase
---

# Implement Plan Command

## Purpose
Execute a plan systematically, phase by phase, with verification at each step.

## Instructions

When given a plan file or description:

1. **Load the plan** from the specified path or find the most recent relevant plan

2. **Create a todo list** from the plan phases

3. **For each phase**:
   - Announce which phase you're starting
   - Implement all changes for that phase
   - **Add appropriate test coverage** for new functionality (unit, component, integration, or E2E tests)
   - Run automated verification commands
   - Report results
   - Update checkboxes in the plan
   - **For Documentation phase**: Ensure README.md reflects all new commands, options, and usage examples
   - Handle any blockers by:
     - Clearly explaining the issue
     - Suggesting resolution steps
     - Pausing for user input if needed

4. **After completing all changes for a phase**:
   - Summarize what was completed
   - Show verification results
   - **Verify test coverage** - Run `pnpm test:ui` and `pnpm test:e2e` to ensure new tests pass
   - **If domain code was modified, run `/sync_docs` to update module READMEs**
   - Confirm before proceeding to next phase (if configured)

5. **On completion**:
   - Summarize all changes made
   - List any manual verification needed
   - **Verify README.md was updated** with new features/commands
   - **Confirm module READMEs were updated (if domain code changed)**
   - Suggest next steps

## Blocker Handling

When encountering issues:
```
⚠️ Blocker Found:
[Description of the issue]

To resolve:
1. [Step to fix]
2. [Step to verify]

Once resolved, I'll continue with [current phase].
```

## Example Usage
> /4_implement_plan
> thoughts/shared/plans/oauth2_integration.md
