---
"dopeshot-app": patch
---

Fix stale saved designs count after login by removing localStorage caching

Previously, memory items were cached in localStorage, causing stale data to appear after logout/login cycles. This fix:
- Removes all localStorage caching for memory items
- Uses hard navigation after login to ensure Jotai atoms reset
- Relies on server-side `use cache` for caching instead

The server cache (`getCachedMemoryItems` with `use cache` directive) handles caching, while `revalidateTag` properly invalidates on save/delete.
