# Quickstart: Prisma ORM Setup

**Feature**: Replace Supabase Client with Prisma ORM
**Date**: 2025-12-20
**For**: Developers setting up Prisma for the first time

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Supabase project with Postgres database
- Database connection string from Supabase

## 1. Install Dependencies

```bash
cd apps/app

# Install Prisma and related packages
pnpm add prisma @prisma/client prisma-json-types-generator zod better-auth server-only

# Install dev dependencies
pnpm add -D @types/node
```

## 2. Configure Environment Variables

Create or update `apps/app/.env.local`:

```bash
# Prisma Database URLs
# Pooled connection (port 6543) - used by Prisma Client
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public,auth"

# Direct connection (port 5432) - used by Prisma CLI for migrations
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres?schema=public,auth"

# Better Auth
BETTER_AUTH_SECRET="your-32-char-secret-here" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# Existing Supabase vars (for Storage)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Get your Supabase connection strings:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy "Connection string" with `[password]` placeholder
3. Replace `[password]` with your actual database password
4. For `DATABASE_URL`, use port 6543 (pooled connection) and add `?pgbouncer=true`
5. For `DIRECT_URL`, use port 5432 (direct connection)

## 3. Configure External Tables

Create `apps/app/prisma.config.ts`:

```typescript
import { defineConfig } from "prisma/config";

export default defineConfig({
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "auth.users",
      "auth.sessions",
      "auth.accounts",
      "auth.verifications",
      // Add other Supabase auth tables as needed
    ],
  },
});
```

## 4. Create Prisma Schema

Create `apps/app/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
  useType = "Any"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["public", "auth"]
}

// External table (managed by better-auth)
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  brandProfile    BrandProfile?
  userMetadata    UserMetadata?
  generatedAssets GeneratedAsset[]

  @@map("users")
  @@schema("auth")
}

// Copy the rest from data-model.md
// (BrandProfile, UserMetadata, GeneratedAsset models)
```

**Full schema**: See [data-model.md](./data-model.md#prisma-schema-file)

## 5. Pull Existing Schema (Optional)

If Supabase already has auth tables:

```bash
# Pull existing schema
npx prisma db pull

# This will add the auth.users table to schema.prisma
# Manually add your managed tables (BrandProfile, etc.)
```

## 6. Create Initial Migration

```bash
# Generate initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create prisma/migrations/TIMESTAMP_init/ directory
# 2. Generate SQL migration file
# 3. Apply migration to database
# 4. Generate Prisma Client
```

## 7. Create Prisma Client Singleton

Create `apps/app/src/lib/prisma.ts`:

```typescript
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
```

## 8. Create Type Safety Layer

Create `apps/app/src/lib/types/brand.ts`:

```typescript
import { z } from "zod";

// Zod schemas for JSON fields
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

// Export types
export type BrandColorPalette = z.infer<typeof brandColorPaletteSchema>;
export type BrandTypography = z.infer<typeof brandTypographySchema>;

// Add more schemas from data-model.md
```

Create `apps/app/src/lib/types/prisma.d.ts`:

```typescript
declare global {
  namespace PrismaJson {
    type BrandColorPalette = import("./brand").BrandColorPalette;
    type BrandTypography = import("./brand").BrandTypography;
    // Add more types
  }
}

export {};
```

## 9. Configure Better Auth with Prisma

Update `apps/app/src/lib/auth/auth-server.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Auto-create brand profile and metadata on signup
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.brandProfile.create({
            data: { userId: user.id },
          });

          await prisma.userMetadata.create({
            data: {
              userId: user.id,
              subscriptionTier: "free",
              subscriptionStatus: "active",
            },
          });
        },
      },
    },
  },

  // ... rest of better-auth config
});
```

## 10. Verify Setup

```bash
# Verify Prisma Client is generated correctly
npx prisma generate

# Check database connection
npx prisma db execute --stdin <<< "SELECT 1"

# Run type checking
pnpm typecheck

# Start dev server
pnpm dev
```

## 11. Test Database Operations

Create a test script `apps/app/scripts/test-prisma.ts`:

```typescript
import { prisma } from "../src/lib/prisma";

async function main() {
  // Test connection
  const userCount = await prisma.user.count();
  console.log("Total users:", userCount);

  // Test creating brand profile
  const testUser = await prisma.user.findFirst();
  if (testUser) {
    const profile = await prisma.brandProfile.upsert({
      where: { userId: testUser.id },
      create: {
        userId: testUser.id,
        name: "Test Brand",
      },
      update: {
        name: "Test Brand Updated",
      },
    });
    console.log("Brand profile:", profile);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the test:

```bash
npx tsx apps/app/scripts/test-prisma.ts
```

## Common Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply new migration
npx prisma migrate dev --name description

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only - DELETES ALL DATA)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### Error: "Environment variable not found: DATABASE_URL"

Check that `.env.local` exists and contains `DATABASE_URL`. Restart your dev server.

### Error: "Can't reach database server"

1. Verify connection string is correct
2. Check that IP is allowed in Supabase dashboard (Database → Settings → Connection pooling)
3. Try using `DIRECT_URL` instead of `DATABASE_URL` temporarily

### Migration fails: "Table already exists"

If you're migrating from existing Supabase schema:

```bash
# Create migration without running it
npx prisma migrate dev --create-only --name init

# Mark it as applied (don't actually run it)
npx prisma migrate resolve --applied TIMESTAMP_init
```

### Type errors on JSON fields

Make sure you:
1. Added `/// [TypeName]` comments in schema.prisma
2. Defined types in `lib/types/prisma.d.ts`
3. Ran `npx prisma generate`

## Next Steps

After setup is complete:

1. **Replace Supabase client calls** with Prisma queries in API routes
2. **Add authorization layer** - see [research.md#5-authorization-patterns](./research.md#5-authorization-patterns)
3. **Write tests** for Prisma queries and API routes
4. **Update documentation** for new database patterns

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/database/prisma)
- [Better Auth + Prisma Integration](https://www.better-auth.com/docs/adapters/prisma)
- [Research Document](./research.md) - Detailed architecture decisions
- [Data Model](./data-model.md) - Schema reference
