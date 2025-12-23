# Research: Persistent Backgrounds

## Decision 1: Performance Targets

**Decision**: Background library loads within 1s for up to 50 items, and applying
a background updates the canvas within 300ms under typical conditions.

**Rationale**: This aligns with a snappy creative workflow where users expect
immediate feedback while browsing visual options.

**Alternatives considered**:
- 2s load target for larger libraries (rejected: adds perceived lag to browsing).
- No explicit target (rejected: risks regressions on a core UX path).

## Decision 2: Upload Constraints

**Decision**: Limit uploads to 10MB per image, allow PNG, JPG, and WebP formats.

**Rationale**: Balances quality and performance while keeping uploads quick and
storage costs predictable.

**Alternatives considered**:
- 5MB limit (rejected: too restrictive for high-res background assets).
- Allow all image types (rejected: increases validation and compatibility risk).

## Decision 3: Library Scale Assumptions

**Decision**: Curated presets total 10-20 items; personal libraries target up to
50 assets before needing paging or filtering.

**Rationale**: Matches the curated scope described and typical personal asset
collections for lightweight brand kits.

**Alternatives considered**:
- Unlimited personal assets (rejected: would require early pagination design).
- Smaller personal libraries (rejected: limits legitimate brand variants).
