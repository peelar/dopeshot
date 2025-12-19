# Release workflow (changesets)

This repo uses [Changesets](https://github.com/changesets/changesets) to track human-written change notes and create release PRs. Nothing is published to npm.

## Daily flow

1. Add a changeset in each PR that should be part of the next release:
   - `pnpm changeset` → choose the package (just `dopeshot`) and version bump type (usually `patch`).
   - Write a short, user-facing summary. Keep it to one bullet per change.
   - Commit the generated file under `.changeset/`.
2. Merge PRs as usual. The release workflow will stack all pending changesets on `main`.
3. Wait for the Release workflow to open a PR titled `chore: release`. That PR contains:
   - Version bump in `package.json`.
   - Updated `CHANGELOG.md`.
   - Updated lockfile.
   - CI on that PR uses the existing `Test` workflow.
4. Merge the `chore: release` PR when green. That finalizes the release (no publish step runs).

## Local commands

- See pending changesets: `pnpm changeset:status`
- Bump versions and regenerate changelog locally (mirrors the GitHub Action): `pnpm release`
- Just run the version step (no tests): `pnpm changeset:version`
- Start a new changeset: `pnpm changeset`

## Writing good changesets (human + LLM friendly)

Changesets are both the public changelog and a compact history for assistants/tools, so write them like structured release notes:

- Lead with the user-facing outcome, not the implementation.
- One change per bullet; keep each bullet short (<= 120 chars).
- Use consistent prefixes: `Added:`, `Changed:`, `Fixed:`, `Removed:`.
- Mention important scope: affected feature/area, or a key file/module if it matters.
- Call out behavior changes, defaults, migrations, or breaking shifts explicitly.
- Avoid internal-only wording (e.g., “refactor”) unless it changes behavior.
- If it impacts tests, perf, or DX in a meaningful way, say so.

Example:

```
- Added: Export presets for mobile (9:16) and desktop (16:9) layouts.
- Fixed: Gradient generator now preserves contrast for dark screenshots.
- Changed: Look rail default is now "Peak" for first-time users.
```

## CI details

- `.github/workflows/release.yml` watches `main` and `workflow_dispatch`.
- It installs dependencies, runs `changesets/action@v1` to open/update the release PR, and skips publishing via a no-op command.
- The existing `.github/workflows/test.yml` runs on PRs (including the release PR) to execute lint/typecheck/unit/e2e tests. Merge only when green.
