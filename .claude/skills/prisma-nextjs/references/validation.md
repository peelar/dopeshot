# Validation Reference

## Zod + Prisma Extension

Validate data at the Prisma Client level for all operations.

```typescript
// lib/prisma.ts
import { PrismaClient, Prisma } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { z } from "zod"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

// Define schemas
const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

const UserUpdateSchema = UserCreateSchema.partial()

// Extend client with validation
const basePrisma = new PrismaClient({ adapter })

export const prisma = basePrisma.$extends({
  query: {
    user: {
      create({ args, query }) {
        args.data = UserCreateSchema.parse(args.data)
        return query(args)
      },
      update({ args, query }) {
        args.data = UserUpdateSchema.parse(args.data)
        return query(args)
      },
      upsert({ args, query }) {
        args.create = UserCreateSchema.parse(args.create)
        args.update = UserUpdateSchema.parse(args.update)
        return query(args)
      },
    },
  },
})
```

## Schema Definitions

### User Schema

```typescript
import { z } from "zod"

export const UserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name too short").max(100, "Name too long"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
})

export const UserCreateSchema = UserSchema
export const UserUpdateSchema = UserSchema.partial()

export type UserInput = z.infer<typeof UserSchema>
```

### Product Schema with Decimal

```typescript
import { z } from "zod"
import { Prisma } from "@/app/generated/prisma/client"

export const ProductSchema = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  price: z
    .instanceof(Prisma.Decimal)
    .refine(
      (price) => price.gte("0.01") && price.lt("1000000.00"),
      "Price must be between 0.01 and 999,999.99"
    ),
})
```

### Form Data Schema

```typescript
import { z } from "zod"

// For FormData parsing
export const ContactFormSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
})

// Usage in server action
export async function submitContact(formData: FormData) {
  const rawData = Object.fromEntries(formData)
  const result = ContactFormSchema.safeParse(rawData)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  // result.data is type-safe
  await prisma.contact.create({ data: result.data })
}
```

## Prisma.validator Pattern

Type-safe validators without runtime validation.

```typescript
import { Prisma } from "@/app/generated/prisma/client"

// Create type-safe input builder
const createUserInput = (
  name: string,
  email: string,
  postTitle?: string
) => {
  return Prisma.validator<Prisma.UserCreateInput>()({
    name,
    email,
    posts: postTitle
      ? {
          create: { title: postTitle },
        }
      : undefined,
  })
}

// Usage
const userData = createUserInput("Alice", "alice@example.com", "First Post")
await prisma.user.create({ data: userData })
```

## Combined Zod + Prisma.validator

```typescript
import { z } from "zod"
import { Prisma } from "@/app/generated/prisma/client"

// Runtime validation with Zod
const UserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

// Type alignment with Prisma
type UserInput = z.infer<typeof UserInputSchema>

// Ensure types match
const _typeCheck: UserInput extends Prisma.UserCreateInput
  ? true
  : never = true

export async function createUser(input: unknown) {
  // Runtime validation
  const validated = UserInputSchema.parse(input)

  // Type-safe Prisma call
  return prisma.user.create({ data: validated })
}
```

## Error Handling with Validation

```typescript
import { z } from "zod"

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> }

export function validate<T>(
  schema: z.Schema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: result.error.flatten().fieldErrors as Record<string, string[]>,
  }
}

// Usage in action
export async function createUser(
  formData: FormData
): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
  const validation = validate(UserCreateSchema, Object.fromEntries(formData))

  if (!validation.success) {
    return { success: false, errors: validation.errors }
  }

  await prisma.user.create({ data: validation.data })
  return { success: true }
}
```

## Client-Side Validation Hook

```tsx
// hooks/useFormValidation.ts
"use client"

import { useState } from "react"
import { z } from "zod"

export function useFormValidation<T>(schema: z.Schema<T>) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const validate = (data: unknown): data is T => {
    const result = schema.safeParse(data)

    if (result.success) {
      setErrors({})
      return true
    }

    setErrors(result.error.flatten().fieldErrors as Record<string, string[]>)
    return false
  }

  const clearErrors = () => setErrors({})

  return { errors, validate, clearErrors }
}
```

```tsx
// components/UserForm.tsx
"use client"

import { useFormValidation } from "@/hooks/useFormValidation"
import { UserCreateSchema } from "@/lib/schemas"

export function UserForm() {
  const { errors, validate } = useFormValidation(UserCreateSchema)

  const handleSubmit = async (formData: FormData) => {
    const data = Object.fromEntries(formData)

    if (!validate(data)) {
      return // Show errors
    }

    // Submit to server action
  }

  return (
    <form action={handleSubmit}>
      <input name="email" />
      {errors.email && <span>{errors.email[0]}</span>}

      <input name="name" />
      {errors.name && <span>{errors.name[0]}</span>}

      <button type="submit">Create</button>
    </form>
  )
}
```
