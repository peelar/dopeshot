---
"dopeshot-app": patch
---

CRITICAL SECURITY FIX: Fix authentication and data leakage vulnerabilities + Prisma 7 adapter configuration

Fixed two catastrophic P0 security vulnerabilities where React's cache() memoization without arguments caused authentication state and database clients to be shared across all users:

**Authentication Bypass (P0 - CRITICAL)**
- verifySession() cached the first user's authentication state and returned it to all subsequent users
- Any user making a request would be authenticated as the first logged-in user
- Fixed by removing cache() wrapper entirely - authentication must never be cached without request-specific keys

**Data Access Layer Leakage (P0 - CRITICAL)**
- getUserDb() cached the first user's Prisma client and returned it to all subsequent users
- Users could read/write other users' data through the shared database client
- Fixed by adding userId parameter to create unique cache keys per user

**Feature Flag Enforcement**
- Brand-related UI features are now properly hidden behind showBrandExperienceFlag (dev only)
- Disabled database queries for brand features when flag is off
- Updated useBrandLogoAutoApply hook to respect feature flag

**Prisma 7 Configuration**
- Added @prisma/adapter-pg and pg driver for PostgreSQL adapter support (required in Prisma 7)
- Configured PrismaClient with PrismaPg adapter for direct database connections
- Resolved build errors related to missing adapter configuration

Changes:
- Removed cache() from verifySession() - authentication is now verified per-request
- Updated getUserDb() to accept userId as argument, creating proper cache keys
- Updated all data access functions (getBrandProfile, getUserMetadata, getGeneratedAssets) to accept userId
- Updated all API route callers to pass userId explicitly
- Added `enabled` parameter to useBrandLogoAutoApply hook
- Installed @prisma/adapter-pg and pg packages
- Configured Prisma client with PostgreSQL adapter
- Each user now gets isolated authentication state and database client
