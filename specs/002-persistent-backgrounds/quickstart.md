# Quickstart: Persistent Backgrounds

## Goal

Verify preset and brand backgrounds persist across sessions for branded and
logged-in users.

## Steps

1. Sign in with a branded account.
2. Open the background sidebar and select a preset background.
3. Refresh the page or open a new session, then confirm the preset library is
   still available and selectable.
4. Upload a brand background and confirm it appears in the personal library.
5. Select the brand background and verify it applies to the canvas.
6. Refresh or return later and confirm the brand background remains available.
7. Remove a brand background and confirm it no longer appears.

## Expected Results

- Preset background library is available to branded users and selections persist.
- Personal uploads persist across sessions and are private to the owner.
- Upload failures surface clear feedback without losing the current selection.

## Validation Notes

- Not run locally (requires Supabase credentials, storage buckets, and branded test user).
