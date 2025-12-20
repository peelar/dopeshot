---
"dopeshot-app": patch
---

CRITICAL SECURITY FIX: Fix authentication and data leakage vulnerabilities

Fixed two catastrophic P0 security vulnerabilities where React's cache() memoization without arguments caused authentication state and database clients to be shared across all users:

**Authentication Bypass (P0 - CRITICAL)**
- verifySession() cached the first user's authentication state and returned it to all subsequent users
- Any user making a request would be authenticated as the first logged-in user
- Fixed by removing cache() wrapper entirely - authentication must never be cached without request-specific keys

**Data Access Layer Leakage (P0 - CRITICAL)**
- getUserDb() cached the first user's Prisma client and returned it to all subsequent users
- Users could read/write other users' data through the shared database client
- Fixed by adding userId parameter to create unique cache keys per user

Changes:
- Removed cache() from verifySession() - authentication is now verified per-request
- Updated getUserDb() to accept userId as argument, creating proper cache keys
- Updated all data access functions (getBrandProfile, getUserMetadata, getGeneratedAssets) to accept userId
- Updated all API route callers to pass userId explicitly
- Each user now gets isolated authentication state and database client
