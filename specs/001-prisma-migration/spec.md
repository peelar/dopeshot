# Feature Specification: Replace Supabase Client with Prisma ORM

**Feature Branch**: `001-prisma-migration`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Migrate from calling a supabase directly to implementing a Prisma ORM and using supabase as storage/postgres provider."

**Context**: Database features are behind a feature flag and app is not in production. Fresh database setup is acceptable - no data migration needed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type-Safe Database Operations (Priority: P1)

As a developer working on dopeshot, I need all database operations (brand profiles, user metadata, generated assets) to work through a type-safe Prisma ORM layer instead of direct Supabase client calls, so that I can catch data-related bugs at compile time and have autocomplete for database queries.

**Why this priority**: Core functionality - brand profiles, user metadata, and asset tracking must work. This is the foundation for all database-backed features.

**Independent Test**: Can be fully tested by running test suite and performing CRUD operations on brand profiles, verifying all operations work with type safety.

**Acceptance Scenarios**:

1. **Given** a user signs up for an account, **When** the authentication completes, **Then** brand_profiles and user_metadata records are automatically created
2. **Given** a user uploads a logo, **When** the upload completes, **Then** the brand_profiles table is updated with logo_path via Prisma
3. **Given** a user updates their brand colors, **When** they save changes, **Then** the color_palette is persisted correctly via Prisma upsert
4. **Given** a user requests their profile data, **When** the API fetches from database, **Then** all data is returned with full type safety

---

### User Story 2 - Storage Operations Work with Prisma (Priority: P1)

As a user of dopeshot, I need to upload my brand logo and have it stored securely, where Supabase Storage handles files and Prisma handles database records, so that file uploads work seamlessly with the database.

**Why this priority**: Logo upload is a key brand feature. Storage and database must work together.

**Independent Test**: Can be tested by uploading a logo, verifying it appears in Supabase Storage bucket, and confirming signed URLs are generated correctly.

**Acceptance Scenarios**:

1. **Given** a user has a logo file, **When** they upload it via the brand profile UI, **Then** the file is stored in Supabase Storage brand-logos bucket
2. **Given** a logo is stored, **When** the user requests their profile, **Then** a signed URL is generated for the logo
3. **Given** a logo path is stored in database via Prisma, **When** storage operations reference that path, **Then** file retrieval works correctly

---

### User Story 3 - Schema as Code (Priority: P2)

As a developer, I need Prisma schema to be the single source of truth for database structure, so that schema changes automatically generate TypeScript types and I can evolve the database easily.

**Why this priority**: Enables fast iteration on database schema. Not critical for initial setup but essential for development velocity.

**Independent Test**: Can be tested by making a schema change, running `prisma generate`, and verifying TypeScript types update automatically.

**Acceptance Scenarios**:

1. **Given** the database schema defined in `schema.prisma`, **When** `prisma generate` runs, **Then** TypeScript types are generated for all models
2. **Given** a schema change is needed, **When** developer modifies `schema.prisma`, **Then** `prisma migrate dev` generates and applies migration SQL
3. **Given** the Prisma schema, **When** deployed to production, **Then** `prisma migrate deploy` applies migrations safely

---

### Edge Cases

- What happens when Prisma client initialization fails due to missing DATABASE_URL?
- How does the system handle concurrent updates to brand_profiles?
- What happens if storage operations succeed but Prisma database updates fail (transaction rollback)?
- How are authorization checks enforced in API routes without Supabase RLS?
- What happens when better-auth and Prisma both reference auth.users table?
- How does seed data work with Prisma seeding?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support all database operations (SELECT, INSERT, UPDATE, UPSERT, DELETE) via Prisma client
- **FR-002**: System MUST preserve Supabase Storage integration for brand-logos and generated-assets buckets
- **FR-003**: System MUST provide compile-time type safety for all database queries using Prisma-generated types
- **FR-004**: Prisma schema MUST define all required tables (brand_profiles, generated_assets, user_metadata)
- **FR-005**: System MUST enforce user data isolation through application-level authorization checks in API routes
- **FR-006**: System MUST automatically create brand_profiles and user_metadata records when new users sign up
- **FR-007**: System MUST support upsert operations for brand profile updates (using user_id as unique constraint)
- **FR-008**: System MUST handle JSON fields (color_palette, typography, settings, metadata, usage, feature_flags) correctly
- **FR-009**: System MUST automatically update brand_profiles.updated_at timestamp on modifications
- **FR-010**: System MUST maintain foreign key relationships between tables (user_id references)
- **FR-011**: System MUST work with better-auth integration (better-auth manages auth.users, Prisma references it)

### Non-Functional Requirements (Constitution Compliance)

- **NFR-001**: Feature MUST include test coverage (unit tests for Prisma queries, integration tests for API routes, E2E tests for full workflows) per Principle I
- **NFR-002**: Database queries MUST respond quickly (perceived as instant for user interactions) per Principle V
- **NFR-003**: All database operations MUST include proper error handling and logging per Principle IV
- **NFR-004**: Code MUST follow simplicity guidelines - use Prisma's built-in features rather than creating custom abstractions per Principle III
- **NFR-005**: Developer experience MUST be excellent - autocomplete, type checking, and refactoring safety

### Key Entities *(include if feature involves data)*

- **BrandProfile**: Represents user's brand identity with name, color palette (array of 5 colors), typography settings (heading/body fonts), and logo storage reference. One-to-one relationship with User.
- **GeneratedAsset**: Represents a screenshot/asset created by the user. Contains storage path reference, settings snapshot (layout, styles, orientation), text overlays, metadata (file size, dimensions), and public sharing flag. Many-to-one relationship with User.
- **UserMetadata**: Extends user with subscription information (tier: free/paid, status: active/cancelled/past_due), onboarding progress (completed steps array), usage tracking (exports count), and feature flags. One-to-one relationship with User.
- **User**: Authentication user managed by better-auth, referenced by all other entities via user_id foreign key. Not managed by Prisma directly.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All API endpoints (/api/brand/profile, /api/brand/update-profile, /api/brand/upload-logo) work correctly with Prisma
- **SC-002**: Database operations feel instant to users (API responses under 200ms for typical queries)
- **SC-003**: TypeScript compilation catches type mismatches in database queries (compile-time safety)
- **SC-004**: Test suite (unit + integration + E2E) passes at 100% rate
- **SC-005**: Codebase contains zero direct Supabase database query calls (only storage operations remain)
- **SC-006**: Developers have full autocomplete and type safety when writing database queries
- **SC-007**: Schema changes can be made and deployed in under 5 minutes using Prisma Migrate workflow

## Assumptions

- **A-001**: Database can be purged and set up fresh (no existing production data to preserve)
- **A-002**: Supabase Postgres connection string (DATABASE_URL) is available and stable
- **A-003**: Better-auth manages auth.users table; Prisma only references it (no modifications)
- **A-004**: Supabase Storage remains the file storage solution (only database layer changes)
- **A-005**: Authorization checks will be implemented at application level (API route middleware)
- **A-006**: Database features are behind feature flag and can be updated without user impact

## Dependencies

- **D-001**: Prisma ORM package and CLI tools
- **D-002**: Existing Supabase Postgres database (connection string)
- **D-003**: Better-auth integration must remain functional
- **D-004**: Supabase Storage SDK for file operations
- **D-005**: Existing API route structure and authentication middleware

## Risks & Mitigation

- **R-001**: JSON field type handling may differ between Prisma and expected types
  *Mitigation*: Validate all JSON field operations (color_palette, typography, etc.) with comprehensive tests

- **R-002**: Authorization bugs without database-level RLS enforcement
  *Mitigation*: Implement and test authorization middleware thoroughly, ensure all API routes check user ownership

- **R-003**: Better-auth and Prisma conflict over auth.users table management
  *Mitigation*: Configure Prisma to reference auth.users without modifying it; let better-auth own that table

- **R-004**: Missing or incorrect foreign key constraints in Prisma schema
  *Mitigation*: Carefully define schema relationships and test cascading deletes

## Out of Scope

- Changing authentication system from better-auth (it stays as-is)
- Migrating file storage from Supabase Storage (only database changes)
- Schema redesign or refactoring (use current schema design)
- Changes to API route signatures or response formats (only internal implementation changes)
- Frontend changes (this is backend-only)
- Supabase Edge Functions or Realtime features (not used in this app)
