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

```
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
```

## Notes

- If module has no README yet, offer to create one from template
- Don't update README if only comments or formatting changed
- Focus on structural changes: files, exports, dependencies, architecture
- Keep "Design Notes" section unless architectural changes invalidate it
