---
name: prisma-nextjs
description: Robust Prisma 7 operations in Next.js applications. Use when implementing database operations with Prisma ORM in Next.js projects, including client initialization, CRUD operations, transactions, error handling, server actions, API routes, and serverless deployment patterns. Covers Prisma 7's driver adapter architecture, connection pooling, soft deletes, optimistic updates, and type-safe queries.
---

# Prisma 7 + Next.js Operations

## Critical: Prisma 7 Breaking Changes

Prisma 7 requires driver adapters - no default database drivers included.

### Generator Configuration

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}
```

### Correct Import Path

```typescript
// ✅ CORRECT - must include /client at end
import { PrismaClient } from "../app/generated/prisma/client"

// ❌ WRONG - will break application
import { PrismaClient } from "@prisma/client"
import { PrismaClient } from "../app/generated/prisma"
```

## Client Initialization

### Standard Setup (PostgreSQL)

```typescript
// lib/prisma.ts
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
```

### Vercel Fluid Compute Setup

```typescript
// lib/prisma.ts
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/app/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
attachDatabasePool(pool)

const adapter = new PrismaPg(pool)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

## Query Patterns

### Select vs Include

```typescript
// Select specific fields only
const user = await prisma.user.findFirst({
  select: {
    id: true,
    email: true,
    posts: {
      select: { title: true },
    },
  },
})

// Include returns all fields + relations
const user = await prisma.user.findFirst({
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: "desc" },
    },
  },
})

// ❌ Cannot use select and include at same level
```

### Upsert Pattern

```typescript
const user = await prisma.user.upsert({
  where: { email: "user@example.com" },
  update: { name: "Updated Name" },
  create: { email: "user@example.com", name: "New User" },
})
```

### Batch Operations

```typescript
// Create many
const users = await prisma.user.createMany({
  data: [
    { email: "a@test.com", name: "Alice" },
    { email: "b@test.com", name: "Bob" },
  ],
  skipDuplicates: true,
})

// Update many - returns count only
const updated = await prisma.user.updateMany({
  where: { role: "USER" },
  data: { active: true },
})
```

## Error Handling

See [references/error-handling.md](references/error-handling.md) for comprehensive error patterns.

### Quick Reference

```typescript
import { Prisma } from "@/app/generated/prisma/client"

try {
  await prisma.user.create({ data })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      // Unique constraint violation
    }
    if (e.code === "P2025") {
      // Record not found
    }
  }
}
```

## Transactions

```typescript
// Interactive transaction with error handling
try {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData })
    const post = await tx.post.create({
      data: { ...postData, authorId: user.id },
    })
    return { user, post }
  })
} catch (err) {
  // Entire transaction rolled back
}

// Sequential transaction
await prisma.$transaction([
  prisma.post.deleteMany({ where: { authorId: 1 } }),
  prisma.user.delete({ where: { id: 1 } }),
])
```

## Server Actions

See [references/server-actions.md](references/server-actions.md) for complete patterns.

### Basic Pattern

```typescript
// app/actions/user.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string
  const name = formData.get("name") as string

  await prisma.user.create({ data: { email, name } })
  revalidatePath("/users")
}
```

## API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await prisma.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

## Extensions Pattern

Prisma 7 uses extensions instead of middleware:

```typescript
// ❌ Old middleware (removed in v7)
prisma.$use(async (params, next) => { ... })

// ✅ New extensions
const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
    },
  },
})
```

## Soft Deletes Extension

```typescript
const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async delete({ args, query }) {
        return prisma[args.model].update({
          where: args.where,
          data: { deletedAt: new Date() },
        })
      },
    },
  },
})
```

## Validation with Zod

See [references/validation.md](references/validation.md) for Zod integration patterns.

## Connection Pooling

### Serverless Recommendations

- Start with `connection_limit=1` for serverless
- Use Prisma Accelerate or PgBouncer for production
- Implement singleton pattern to prevent connection leaks

### Environment Variables

```env
# Basic
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=1"

# With PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true"
```

## Deployment Checklist

1. Run `prisma generate` in build step
2. Add to `postinstall` script: `"postinstall": "prisma generate"`
3. Use `prisma migrate deploy` in CI/CD (never `migrate dev` in production)
4. Set `connection_limit` based on environment
5. Configure preview environments with separate databases
