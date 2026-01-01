# Feature Flag Rollout Workflow (DB-Backed)

## Goals

- Ship features to production disabled by default.
- Enable features for specific users (self/trusted) before general rollout.
- Provide a controlled, incremental rollout path without over-engineering.

## Current State

- `user_metadata.feature_flags` exists (JSONB) but is not wired to runtime gating.
- A static runtime flag in `apps/app/src/lib/feature-flags.ts` has been removed.
- Brand UI is currently disabled by default in the app entrypoint.

## Proposed Data Model

### Per-user overrides (existing)

- Table: `user_metadata`
- Column: `feature_flags` (JSONB)
- Shape: `{ "features.some-flag": true }`

### Global configs (new, small table)

`feature_flag_configs`
- `key` (text, primary key)
- `description` (text)
- `default_value` (boolean, default false)
- `rollout_percentage` (int, default 0)
- `enabled` (boolean, default true)
- `updated_at` (timestamp)

## Evaluation Order (Server-side)

1) User override in `user_metadata.feature_flags` (explicit true/false wins)
2) Global `enabled = false` hard-disables the feature
3) `rollout_percentage` using deterministic hash of `user_id + key`
4) `default_value` fallback

## Workflow

1) Create new flag in `feature_flag_configs` with:
   - `default_value = false`
   - `rollout_percentage = 0`
   - `enabled = true`
2) Gate feature behavior with `isFeatureEnabled(userId, "features.xyz")`.
3) Add user overrides for self/trusted users in `user_metadata.feature_flags`.
4) Increase rollout gradually (5% -> 25% -> 50% -> 100%).
5) When stable, set `rollout_percentage = 100` or flip `default_value = true`.

## Operational Notes

- Flags should be evaluated server-side; only send needed flags to the client.
- Do not rely on client-side flags for authorization.
- Add a minimal admin-only path to set per-user overrides safely.

## Follow-ups

- Add Prisma model + migration for `feature_flag_configs`.
- Add a helper `isFeatureEnabled(userId, key)` with deterministic hashing.
- Wire in feature flag reads where needed (brand experience and future flags).
