# Prisma ORM Integration with Next.js, better-auth, and Supabase Postgres

**Research Date:** 2025-12-20
**Status:** Decision Document
**Purpose:** Document architectural decisions for integrating Prisma ORM with Next.js, better-auth, and Supabase Postgres

---

## Executive Summary

This document captures architectural decisions for implementing Prisma ORM as the data access layer for dopeshot, replacing direct Supabase client usage while maintaining compatibility with Supabase's managed auth schema. The approach focuses on type safety, developer experience, and production-ready patterns.

---

## 1. Prisma + better-auth Integration

### Decision

Use better-auth's official Prisma adapter with **database hooks** to auto-create related records (brand_profiles, user_metadata) when users sign up.

### Implementation

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Auto-create related records on user signup
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Normalize email before creation
          return {
            data: {
              ...user,
              email: user?.email?.toLowerCase(),
            },
          };
        },
        after: async (user) => {
          // Create related records after user creation
          await prisma.brandProfile.create({
            data: {
              userId: user.id,
              // Empty profile - filled during onboarding
            },
          });

          await prisma.userMetadata.create({
            data: {
              userId: user.id,
              subscriptionTier: "free",
              subscriptionStatus: "active",
              exportsThisMonth: 0,
            },
          });
        },
      },
    },
  },

  // Enable experimental joins for performance
  experimental: {
    joins: true,
  },
});
```

### Rationale

1. **Official Integration**: Prisma and better-auth have official integration guides, reducing implementation risk
2. **Database Hooks**: Better Auth's `after` hook is specifically designed for creating related records without blocking the main operation
3. **Automatic Schema Generation**: Better Auth CLI (`npx @better-auth/cli generate`) automatically generates User, Session, Account, and Verification tables
4. **Performance**: Experimental joins feature (since v1.4.0) enables fetching related data in a single query
5. **Separation of Concerns**: Before hooks handle validation/normalization, after hooks handle side effects

### Alternatives Considered

**Option A: Manual user creation listeners**
- **Rejected**: More complex, requires custom event system
- Would need to manually detect signup vs login
- No official support from better-auth

**Option B: Prisma nested writes**
- **Rejected**: better-auth manages User table creation
- Cannot use nested writes from better-auth's internal operations
- Would require forking better-auth adapter

**Option C: Database triggers (Postgres)**
- **Rejected**: Logic lives in database, harder to test and version control
- Requires direct database access, bypassing Prisma's safety
- Difficult to develop/test locally

### Important Notes

- The User, Session, Account, and Verification models are managed by better-auth
- Schema migration is NOT supported through Better Auth CLI - must use Prisma Migrate
- Prisma 7+ requires explicit `output` path in schema configuration
- After hooks receive the complete user object including generated `id`
- Database hooks have access to `ctx` object with adapter methods and utilities

---

## 2. JSON Field Type Safety

### Decision

Use **prisma-json-types-generator** combined with **Zod schemas** for both compile-time type safety and runtime validation of JSON fields.

### Implementation

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
  // Use 'any' for untyped fields (false = 'unknown' for stricter safety)
  useType = "Any"
}

model BrandProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  name         String?

  // Type-safe JSON with custom types
  /// [BrandColorPalette]
  colorPalette Json?

  /// [BrandTypography]
  typography   Json?

  logoUrl      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model GeneratedAsset {
  id              String   @id @default(cuid())
  userId          String
  imageUrl        String

  /// [AssetSettings]
  settingsSnapshot Json

  /// [AssetMetadata]
  metadata         Json?

  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}

model UserMetadata {
  id                   String   @id @default(cuid())
  userId               String   @unique
  subscriptionTier     String   @default("free")
  subscriptionStatus   String   @default("active")

  /// [OnboardingProgress]
  onboardingProgress   Json?

  /// [FeatureFlags]
  featureFlags         Json?

  exportsThisMonth     Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

```typescript
// lib/types/brand.ts
import { z } from "zod";

// Zod schemas for runtime validation
export const brandColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});

export const brandTypographySchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  fontWeights: z.object({
    heading: z.number().optional(),
    body: z.number().optional(),
  }).optional(),
});

export const assetSettingsSchema = z.object({
  layout: z.string(),
  orientation: z.enum(["landscape", "portrait", "square"]),
  styleToggles: z.record(z.boolean()),
  textOverlay: z.string().optional(),
});

export const assetMetadataSchema = z.object({
  fileSize: z.number(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  format: z.string(),
});

export const onboardingProgressSchema = z.object({
  completedSteps: z.array(z.string()),
  currentStep: z.string().optional(),
});

export const featureFlagsSchema = z.record(z.boolean());

// TypeScript types for prisma-json-types-generator
export type BrandColorPalette = z.infer<typeof brandColorPaletteSchema>;
export type BrandTypography = z.infer<typeof brandTypographySchema>;
export type AssetSettings = z.infer<typeof assetSettingsSchema>;
export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

// Export schemas for runtime validation
export {
  brandColorPaletteSchema,
  brandTypographySchema,
  assetSettingsSchema,
  assetMetadataSchema,
  onboardingProgressSchema,
  featureFlagsSchema,
};
```

```typescript
// lib/types/prisma.d.ts
import type {
  BrandColorPalette,
  BrandTypography,
  AssetSettings,
  AssetMetadata,
  OnboardingProgress,
  FeatureFlags,
} from "./brand";

declare global {
  namespace PrismaJson {
    type BrandColorPalette = import("./brand").BrandColorPalette;
    type BrandTypography = import("./brand").BrandTypography;
    type AssetSettings = import("./brand").AssetSettings;
    type AssetMetadata = import("./brand").AssetMetadata;
    type OnboardingProgress = import("./brand").OnboardingProgress;
    type FeatureFlags = import("./brand").FeatureFlags;
  }
}
```

```typescript
// Example usage with validation
import { prisma } from "@/lib/prisma";
import { brandColorPaletteSchema } from "@/lib/types/brand";

async function updateBrandColors(userId: string, colors: unknown) {
  // Runtime validation
  const validatedColors = brandColorPaletteSchema.parse(colors);

  // TypeScript knows the exact shape now
  return await prisma.brandProfile.update({
    where: { userId },
    data: {
      colorPalette: validatedColors, // Fully typed!
    },
  });
}
```

### Rationale

1. **Dual Safety**: Compile-time types prevent errors during development, runtime validation catches bad data from users/APIs
2. **Single Source of Truth**: Zod schemas generate both TypeScript types and validation logic
3. **Developer Experience**: Full autocomplete and IntelliSense for JSON fields in VS Code
4. **Database Agnostic**: Works across PostgreSQL's JSONB, MySQL JSON, and SQLite TEXT
5. **Production Ready**: Catches malformed data before it reaches the database

### Alternatives Considered

**Option A: Plain JSON without types**
- **Rejected**: No type safety, easy to introduce bugs
- Would require manual validation everywhere
- No IDE autocomplete

**Option B: JSON types only (no runtime validation)**
- **Rejected**: Compile-time safety only, vulnerable to runtime errors
- User input or API responses could break type assumptions
- Silent failures in production

**Option C: Separate tables for structured data**
- **Rejected**: Over-normalization for flexible schema
- Color palette doesn't need querying individually
- Adds complexity with minimal benefit for our use case

### Important Notes

- `prisma-json-types-generator` provides compile-time safety only - does NOT validate at runtime
- Always validate user input with Zod before writing to database
- Types like `JsonFilter` and `JsonWithAggregatesFilter` remain untyped (Prisma limitation)
- Querying inside JSON fields is database-specific (use PostgreSQL operators for filtering)
- Use `unknown` instead of `any` for stricter safety (set `useType = "Unknown"` in generator)

---

## 3. Prisma Client Initialization in Next.js

### Decision

Use the **singleton pattern with `globalThis`** to prevent connection pool exhaustion during development hot-reloading.

### Implementation

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Optional: Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
```

```typescript
// Environment variables (.env.local)
# For connection pooling (pgBouncer) - used by Prisma Client
DATABASE_URL="postgresql://user:password@host:6543/db?pgbouncer=true"

# Direct connection - used by Prisma CLI (migrations, introspection)
DIRECT_URL="postgresql://user:password@host:5432/db"
```

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

```typescript
// Test setup (vitest.config.ts or similar)
import { PrismaClient } from "@prisma/client";

let prismaTest: PrismaClient;

beforeAll(async () => {
  prismaTest = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST,
      },
    },
  });
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

export { prismaTest };
```

### Rationale

1. **Prevents Connection Exhaustion**: Next.js hot-reload creates new PrismaClient on every change without this pattern
2. **Official Pattern**: Recommended by Prisma in official Next.js documentation
3. **Development Logging**: Query logging in dev helps debug, error-only in production reduces overhead
4. **Graceful Shutdown**: Ensures connections close properly in production
5. **Separation of URLs**: pgBouncer for app queries, direct connection for migrations

### Alternatives Considered

**Option A: New PrismaClient per request**
- **Rejected**: Exhausts connection pool quickly
- Creates overhead establishing new connections
- Not recommended by Prisma

**Option B: Prisma Accelerate (managed service)**
- **Considered**: Global database cache and connection pooling as a service
- **Not chosen for MVP**: Additional cost, adds external dependency
- **Future consideration**: Good for scaling globally

**Option C: Global singleton without environment check**
- **Rejected**: Leaks connections in development
- Hot-reload doesn't reuse existing client
- Can hit database connection limits during development

### Important Notes

- The `globalThis` pattern is safe because it's scoped to the Node.js process
- In serverless environments (Vercel), each function invocation may create a new client (acceptable)
- Use connection pooling (pgBouncer) for high-traffic scenarios
- Supabase provides both pooled (port 6543) and direct (port 5432) connection strings
- Test database should be separate to avoid polluting production/development data

---

## 4. Prisma Schema from Existing Supabase

### Decision

Use **`prisma db pull` with external tables** for initial setup, then **Prisma Migrate** for ongoing development, treating Supabase auth schema as externally managed.

### Implementation

#### Step 1: Configure External Tables

```typescript
// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "auth.users",
      "auth.identities",
      "auth.sessions",
      "auth.refresh_tokens",
      "auth.mfa_factors",
      "auth.mfa_challenges",
      "auth.mfa_amr_claims",
      "auth.sso_providers",
      "auth.sso_domains",
      "auth.saml_providers",
      "auth.saml_relay_states",
      "auth.flow_state",
      "auth.audit_log_entries",
      "storage.buckets",
      "storage.objects",
    ],
  },
  enums: {
    external: [
      "auth.aal_level",
      "auth.code_challenge_method",
      "auth.factor_status",
      "auth.factor_type",
    ],
  },
});
```

#### Step 2: Initial Schema Introspection

```bash
# Pull existing schema from Supabase
npx prisma db pull

# This generates schema.prisma with all tables
# External tables will be marked for exclusion from migrations
```

#### Step 3: Clean Up Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["public", "auth", "storage"]
}

// External tables (managed by Supabase Auth)
// These are ignored by Prisma Migrate but available in Prisma Client

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @map("updated_at")

  // Relations to our managed tables
  brandProfile    BrandProfile?
  userMetadata    UserMetadata?
  generatedAssets GeneratedAsset[]

  @@map("users")
  @@schema("auth")
}

// Our managed tables (in public schema)

model BrandProfile {
  id           String   @id @default(cuid())
  userId       String   @unique @map("user_id")
  name         String?
  colorPalette Json?    @map("color_palette")
  typography   Json?
  logoUrl      String?  @map("logo_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("brand_profiles")
}

model GeneratedAsset {
  id               String   @id @default(cuid())
  userId           String   @map("user_id")
  imageUrl         String   @map("image_url")
  settingsSnapshot Json     @map("settings_snapshot")
  metadata         Json?
  createdAt        DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("generated_assets")
}

model UserMetadata {
  id                 String   @id @default(cuid())
  userId             String   @unique @map("user_id")
  subscriptionTier   String   @default("free") @map("subscription_tier")
  subscriptionStatus String   @default("active") @map("subscription_status")
  onboardingProgress Json?    @map("onboarding_progress")
  featureFlags       Json?    @map("feature_flags")
  exportsThisMonth   Int      @default(0) @map("exports_this_month")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_metadata")
}
```

#### Step 4: Baseline Migration

```bash
# Create initial migration (empty, since DB already has tables)
npx prisma migrate dev --name init --create-only

# Mark migration as applied (don't run it)
npx prisma migrate resolve --applied 20250120000000_init
```

#### Step 5: Fresh DB Reset Workflow

```bash
# For local development - reset to clean state

# 1. Reset Prisma migrations (keeps Supabase auth)
npx prisma migrate reset

# 2. Re-pull schema if Supabase auth updated
npx prisma db pull

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Run seeds if needed
npx prisma db seed
```

### Rationale

1. **Leverages Existing Schema**: No need to recreate auth.users, Supabase manages it
2. **External Tables Feature**: Prisma can reference auth.users without migrating it
3. **Safe Updates**: When Supabase updates auth schema, re-run `db pull` to sync
4. **Migration Safety**: Baseline prevents Prisma from trying to recreate existing tables
5. **Multi-Schema Support**: Prisma's `multiSchema` feature handles public + auth + storage schemas

### Alternatives Considered

**Option A: Ignore auth schema entirely**
- **Rejected**: Cannot create foreign key relationships to auth.users
- Would need string userId without referential integrity
- Loses database-level cascading deletes

**Option B: Manually maintain auth schema in Prisma**
- **Rejected**: Supabase updates auth schema for new features
- Would cause migration conflicts
- High maintenance burden

**Option C: Use Supabase client for auth, Prisma for everything else**
- **Rejected**: Two different clients, inconsistent patterns
- No unified type system
- Complicates transactions spanning auth + app data

### Important Notes

- **NEVER** run `npx prisma migrate reset` on production - it drops all data
- Always run `prisma db pull` after Supabase updates to sync external tables
- External tables are read-only from Prisma Migrate perspective
- Relations FROM external tables TO managed tables work fine
- Use `directUrl` for all CLI commands (pull, push, migrate)
- For CI/CD, store baseline migration in version control

---

## 5. Authorization Patterns

### Decision

Implement **application-level authorization** using a **Data Access Layer (DAL)** pattern with per-request Prisma client extension for user context, combined with **middleware for route protection**.

### Implementation

#### Step 1: Session Helper (Server-Only)

```typescript
// lib/auth/session.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

// Memoized session verification (per-request cache)
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return { isAuth: false, userId: null };
  }

  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: `session=${sessionToken}`,
      },
    });

    if (!session) {
      return { isAuth: false, userId: null };
    }

    return {
      isAuth: true,
      userId: session.user.id,
      session,
    };
  } catch {
    return { isAuth: false, userId: null };
  }
});
```

#### Step 2: Data Access Layer (DAL)

```typescript
// lib/data/dal.ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

// Get user-scoped Prisma client
export const getUserDb = cache(async () => {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized");
  }

  // Return extended client with user context
  return prisma.$extends({
    query: {
      brandProfile: {
        async findMany({ args, query }) {
          // Auto-inject user_id filter
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
      },
      generatedAsset: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
      },
      userMetadata: {
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
      },
    },
  });
});

// Specific data access functions
export const getBrandProfile = cache(async () => {
  const db = await getUserDb();
  return db.brandProfile.findUnique({
    where: { userId: "" }, // userId auto-injected by extension
  });
});

export const getGeneratedAssets = cache(async () => {
  const db = await getUserDb();
  return db.generatedAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
});

export const getUserMetadata = cache(async () => {
  const db = await getUserDb();
  return db.userMetadata.findUnique({
    where: { userId: "" }, // userId auto-injected
  });
});
```

#### Step 3: Middleware for Route Protection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isProtectedPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/profile");

  // Redirect authenticated users away from auth pages
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedPage && !session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

#### Step 4: Server Action Authorization

```typescript
// app/actions/brand.ts
"use server";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { brandColorPaletteSchema } from "@/lib/types/brand";
import { revalidatePath } from "next/cache";

export async function updateBrandColors(colors: unknown) {
  // Verify session
  const session = await verifySession();
  if (!session.isAuth) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedColors = brandColorPaletteSchema.parse(colors);

  // Get user-scoped database
  const db = await getUserDb();

  // Update (userId automatically filtered)
  const updated = await db.brandProfile.update({
    where: { userId: "" }, // Auto-injected
    data: {
      colorPalette: validatedColors,
    },
  });

  revalidatePath("/dashboard");
  return updated;
}
```

#### Step 5: Route Handler Authorization

```typescript
// app/api/assets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user-scoped data
    const db = await getUserDb();
    const assets = await db.generatedAsset.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Rationale

1. **Centralized Authorization**: DAL pattern ensures all data access goes through user-scoped client
2. **Per-Request Isolation**: Each request gets its own extended Prisma client with user context
3. **Automatic Filtering**: Prisma Client Extensions automatically inject userId WHERE clauses
4. **Defense in Depth**: Middleware handles routing, DAL handles data access, both check auth
5. **React Cache Integration**: `cache()` prevents redundant session checks within a single request
6. **Type Safety**: Full TypeScript support throughout the stack
7. **Server-Only**: `"server-only"` package prevents accidental client-side usage

### Alternatives Considered

**Option A: Manual WHERE clauses everywhere**
- **Rejected**: Easy to forget, error-prone
- Would need code review to catch missing filters
- No enforcement mechanism

**Option B: Supabase RLS (Row Level Security)**
- **Rejected**: We're using Prisma instead of Supabase client
- RLS policies are database-level, we want application-level control
- Harder to test and debug

**Option C: Third-party authorization libraries (Permit.io, ZenStack)**
- **Considered**: @permitio/permit-prisma provides automatic filtering
- **Not chosen for MVP**: Additional dependency, external service
- **Future consideration**: Good for complex RBAC/ReBAC needs

**Option D: Middleware-only authorization**
- **Rejected**: Only protects routes, not data access
- Server Actions bypass middleware
- Direct database queries could leak data

**Option E: GraphQL with field-level permissions**
- **Rejected**: Adds complexity (GraphQL layer)
- Overkill for simple user-owns-data model
- Slower development velocity

### Important Notes

- **Server Actions MUST check authorization** - they are public endpoints
- Middleware is Edge Runtime (limited Node.js APIs)
- React `cache()` is scoped to single request/render, NOT across requests
- Prisma Client Extensions create a new client instance (acceptable per-request)
- Use `"server-only"` package to prevent bundling server code in client
- Always use `verifySession()` before `getUserDb()` for explicit auth check
- Consider using `@permitio/permit-prisma` if scaling to team-based permissions

---

## Implementation Checklist

### Phase 1: Setup

- [ ] Install dependencies: `prisma`, `@prisma/client`, `prisma-json-types-generator`, `zod`, `better-auth`, `better-auth/adapters/prisma`
- [ ] Create `prisma.config.ts` with external tables configuration
- [ ] Set up environment variables (`DATABASE_URL`, `DIRECT_URL`)
- [ ] Run `npx prisma db pull` to introspect existing schema
- [ ] Clean up `schema.prisma` to mark auth tables as external
- [ ] Create baseline migration with `npx prisma migrate resolve --applied`

### Phase 2: Type Safety

- [ ] Add `prisma-json-types-generator` to schema.prisma
- [ ] Create Zod schemas in `lib/types/brand.ts`
- [ ] Add `lib/types/prisma.d.ts` with PrismaJson namespace
- [ ] Run `npx prisma generate` to generate typed client

### Phase 3: Auth Integration

- [ ] Create `lib/prisma.ts` with singleton pattern
- [ ] Create `lib/auth.ts` with better-auth configuration
- [ ] Add database hooks for auto-creating brand_profile and user_metadata
- [ ] Test signup flow creates all related records

### Phase 4: Authorization

- [ ] Create `lib/auth/session.ts` with verifySession helper
- [ ] Create `lib/data/dal.ts` with user-scoped Prisma extensions
- [ ] Add middleware.ts for route protection
- [ ] Update all Server Actions to use verifySession + getUserDb
- [ ] Update all Route Handlers to use verifySession + getUserDb

### Phase 5: Testing

- [ ] Set up test database configuration
- [ ] Create test factories for user, brandProfile, generatedAsset
- [ ] Write integration tests for DAL functions
- [ ] Write tests for authorization (should reject unauthorized access)
- [ ] Test database hooks (user creation auto-creates related records)

---

## Sources

### Prisma + better-auth Integration
- [How to use Prisma ORM and Prisma Postgres with Better Auth and Next.js | Prisma Documentation](https://www.prisma.io/docs/guides/betterauth-nextjs)
- [Prisma | Better Auth](https://www.better-auth.com/docs/adapters/prisma)
- [Complete Better Auth Integration Guide for Next.js with Prisma](https://jb.desishub.com/blog/nextjs-better-auth)
- [How to setup nextjs with prisma, better-auth, postgres | Medium](https://medium.com/@kundalikjadhav5545/how-to-setup-nextjs-with-prisma-better-auth-postgress-62802bd29ac0)

### External Tables
- [Externally managed tables | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/externally-managed-tables)
- [How to exclude Supabase auth schema from Prisma migrations](https://www.answeroverflow.com/m/1414886626764787834)
- [How to reference a table that is not public · prisma/prisma · Discussion #9128](https://github.com/prisma/prisma/discussions/9128?sort=top)

### JSON Field Type Safety
- [prisma-json-types-generator - npm](https://www.npmjs.com/package/prisma-json-types-generator)
- [GitHub - arthurfiorette/prisma-json-types-generator](https://github.com/arthurfiorette/prisma-json-types-generator)
- [Working with Json fields (Concepts) | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
- [A backwards compatible, type safe system for JSON fields in Prisma](https://www.wking.dev/guides/a-backwards-compatible-type-safe-system-for-json-fields-in-prisma)
- [Typing Prisma Json Fields? Yes, You Can! - DEV Community](https://dev.to/zenstack/typing-prisma-json-fields-yes-you-can-2in4)

### Prisma Client Singleton
- [Optimizing Connection Pools with PrismaClient Singleton Pattern in Next.js](https://dev.to/_877737de2d34ff8c6265/optimizing-connection-pools-with-prismaclient-singleton-pattern-in-nextjs-3emf)
- [Comprehensive Guide to Using Prisma ORM with Next.js | Prisma Documentation](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help)
- [Best Practices for Instantiating Prisma Client with Next.js](https://www.sheltonma.top/blog/prisma_with_nextjs)
- ["globalThis", "declare global" and the solution of Singleton Prisma client | Medium](https://medium.com/@truongtronghai/globalthis-declare-global-and-the-solution-of-singleton-prisma-client-7706a769c9d3)

### Prisma Schema from Supabase
- [Prisma | Supabase Docs](https://supabase.com/docs/guides/database/prisma)
- [Using Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Troubleshooting prisma errors | Supabase Docs](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)
- [Making Prisma and Supabase play nicely | Medium](https://medium.com/@warren_74490/making-prisma-and-supabase-play-nicely-5acfe2255591)
- [Supabase and Prisma workflow compilation · Discussion #7659](https://github.com/orgs/supabase/discussions/7659)

### Authorization Patterns
- [Guides: Authentication | Next.js](https://nextjs.org/docs/app/guides/authentication)
- [Modeling Authorization in Prisma - No Theory, Just Code | ZenStack](https://zenstack.dev/blog/model-authz)
- [Prisma ORM Data Filtering with ReBAC](https://www.permit.io/blog/prisma-orm-data-filtering-with-rebac)
- [Permit-Prisma Client Extension | Permit.io Documentation](https://docs.permit.io/sdk/permit-prisma-extension/)
- [Prisma Client extensions | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/client-extensions)
- [Auth.js | Protecting](https://authjs.dev/getting-started/session-management/protecting)

### Database Hooks
- [Database | Better Auth](https://www.better-auth.com/docs/concepts/database)
- [Hooks | Better Auth](https://www.better-auth.com/docs/concepts/hooks)

---

## Conclusion

This architecture provides:
- Type-safe database access with Prisma
- Secure authentication with better-auth
- Automatic user-scoped data filtering
- Runtime validation with Zod
- Production-ready patterns for Next.js
- Maintainable separation of concerns

The approach balances developer experience (type safety, autocomplete) with production requirements (security, performance, maintainability) while maintaining compatibility with Supabase's managed services.
