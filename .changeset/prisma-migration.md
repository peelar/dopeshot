---
"dopeshot-app": minor
---

Migrate database layer from Supabase client to Prisma ORM

- Added Prisma ORM with external tables support for better-auth integration
- Created type-safe database schema with JSON field validation using Zod
- Implemented Data Access Layer (DAL) with automatic user-scoped authorization
- Migrated all brand API routes to use Prisma for database operations
- Maintained Supabase Storage integration for file uploads
- Added database hooks for automatic brand profile and user metadata creation
- Replaced non-null assertions with tiny-invariant for better runtime safety
