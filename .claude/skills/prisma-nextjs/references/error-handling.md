# Error Handling Reference

## Error Types

### PrismaClientKnownRequestError

Database operation errors with specific error codes.

```typescript
import { Prisma } from "@/app/generated/prisma/client"

try {
  await prisma.user.create({ data })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P2002":
        // Unique constraint violation
        const target = e.meta?.target as string[]
        return { error: `${target?.join(", ")} already exists` }
      case "P2025":
        // Record not found
        return { error: "Record not found" }
      case "P2003":
        // Foreign key constraint failed
        return { error: "Related record not found" }
      case "P2014":
        // Required relation violation
        return { error: "Required relation missing" }
      default:
        throw e
    }
  }
  throw e
}
```

### PrismaClientValidationError

Invalid query structure or data types.

```typescript
import { Prisma } from "@/app/generated/prisma/client"

try {
  await prisma.user.findMany({ where: { invalidField: true } })
} catch (e) {
  if (e instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid query parameters" }
  }
  throw e
}
```

### PrismaClientInitializationError

Connection or initialization failures.

```typescript
import { Prisma } from "@/app/generated/prisma/client"

try {
  await prisma.$connect()
} catch (e) {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection failed:", e.message)
    return { error: "Database unavailable" }
  }
  throw e
}
```

## Common Error Codes

| Code  | Description                        | Common Cause                          |
| ----- | ---------------------------------- | ------------------------------------- |
| P2000 | Value too long                     | String exceeds column length          |
| P2002 | Unique constraint violation        | Duplicate value on unique field       |
| P2003 | Foreign key constraint failed      | Referenced record doesn't exist       |
| P2014 | Required relation violation        | Missing required related record       |
| P2025 | Record not found                   | findUniqueOrThrow/deleteMany no match |

## findUniqueOrThrow Pattern

```typescript
// Throws PrismaClientKnownRequestError with code P2025 if not found
try {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })
  return user
} catch (e) {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2025"
  ) {
    return null // or throw custom NotFoundError
  }
  throw e
}
```

## Transaction Error Handling

```typescript
try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData })
    
    // If this fails, entire transaction rolls back
    await tx.post.create({
      data: { ...postData, authorId: user.id },
    })
    
    // Explicitly throw to rollback
    if (someCondition) {
      throw new Error("Business logic violation")
    }
    
    return user
  })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific database errors
  }
  // All changes rolled back
  throw e
}
```

## Server Action Error Pattern

```typescript
"use server"

import { Prisma } from "@/app/generated/prisma/client"

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function createUser(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await prisma.user.create({
      data: {
        email: formData.get("email") as string,
        name: formData.get("name") as string,
      },
    })
    return { success: true, data: { id: user.id } }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return { success: false, error: "Email already exists" }
      }
    }
    console.error("Unexpected error:", e)
    return { success: false, error: "Something went wrong" }
  }
}
```

## API Route Error Pattern

```typescript
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/app/generated/prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await prisma.user.create({ data: body })
    return NextResponse.json(user, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Resource already exists" },
          { status: 409 }
        )
      }
      if (e.code === "P2025") {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        )
      }
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }
    console.error("Unexpected error:", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Custom Error Classes

```typescript
// lib/errors.ts
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

// Usage in repository
export async function getUserById(id: string) {
  try {
    return await prisma.user.findUniqueOrThrow({ where: { id } })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      throw new NotFoundError("User", id)
    }
    throw e
  }
}
```
