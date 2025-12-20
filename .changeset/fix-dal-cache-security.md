---
"dopeshot-app": patch
---

CRITICAL SECURITY FIX: Fix user data leakage in cached database client

Fixed a critical P0 security vulnerability where React's cache() memoization without arguments caused the user-scoped Prisma client to be shared across all users. The first user's session would be cached and reused for all subsequent users, allowing unauthorized access to other users' data.

Changes:
- Updated getUserDb() to accept userId as argument, creating proper cache keys
- Updated all data access functions (getBrandProfile, getUserMetadata, getGeneratedAssets) to accept userId
- Updated all API route callers to pass userId explicitly
- Each user now gets their own cached Prisma client instance, preventing cross-user data access
