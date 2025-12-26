# Server Actions Reference

## Basic CRUD Actions

### Create Action

```typescript
// app/actions/user.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/app/generated/prisma/client"

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string
  const name = formData.get("name") as string

  try {
    await prisma.user.create({
      data: { email, name },
    })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Email already exists" }
    }
    throw e
  }

  revalidatePath("/users")
  redirect("/users")
}
```

### Update Action

```typescript
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  await prisma.user.update({
    where: { id },
    data: { name, email },
  })

  revalidatePath(`/users/${id}`)
  revalidatePath("/users")
}
```

### Delete Action

```typescript
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  })

  revalidatePath("/users")
  redirect("/users")
}
```

## Type-Safe Action Pattern

```typescript
// lib/action-types.ts
export type ActionState<T = void> =
  | { status: "idle" }
  | { status: "success"; data: T }
  | { status: "error"; error: string }

// app/actions/user.ts
"use server"

import { ActionState } from "@/lib/action-types"
import prisma from "@/lib/prisma"
import { Prisma } from "@/app/generated/prisma/client"

export async function createUser(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  const email = formData.get("email") as string
  const name = formData.get("name") as string

  if (!email || !name) {
    return { status: "error", error: "All fields required" }
  }

  try {
    const user = await prisma.user.create({
      data: { email, name },
    })
    return { status: "success", data: { id: user.id } }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { status: "error", error: "Email already exists" }
    }
    return { status: "error", error: "Something went wrong" }
  }
}
```

## Client Component Usage

```tsx
// components/CreateUserForm.tsx
"use client"

import { useActionState } from "react"
import { createUser } from "@/app/actions/user"

export function CreateUserForm() {
  const [state, action, isPending] = useActionState(createUser, {
    status: "idle",
  })

  return (
    <form action={action}>
      {state.status === "error" && (
        <p className="text-red-500">{state.error}</p>
      )}
      
      <input name="name" placeholder="Name" required disabled={isPending} />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        disabled={isPending}
      />
      
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  )
}
```

## Zod Validation in Actions

```typescript
"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name too short").max(100),
})

export async function createUser(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    name: formData.get("name"),
  }

  const result = CreateUserSchema.safeParse(rawData)

  if (!result.success) {
    return {
      error: result.error.flatten().fieldErrors,
    }
  }

  await prisma.user.create({
    data: result.data,
  })

  revalidatePath("/users")
  return { success: true }
}
```

## Transaction in Server Action

```typescript
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createUserWithProfile(formData: FormData) {
  const email = formData.get("email") as string
  const name = formData.get("name") as string
  const bio = formData.get("bio") as string

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name },
      })

      await tx.profile.create({
        data: {
          bio,
          userId: user.id,
        },
      })

      return user
    })
  } catch (e) {
    return { error: "Failed to create user" }
  }

  revalidatePath("/users")
  return { success: true }
}
```

## Optimistic Updates Pattern

```tsx
// components/TodoList.tsx
"use client"

import { useOptimistic, useTransition } from "react"
import { toggleTodo } from "@/app/actions/todo"

type Todo = { id: string; title: string; completed: boolean }

export function TodoList({ todos }: { todos: Todo[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, { id, completed }: { id: string; completed: boolean }) =>
      state.map((todo) =>
        todo.id === id ? { ...todo, completed } : todo
      )
  )

  const handleToggle = (id: string, currentCompleted: boolean) => {
    startTransition(async () => {
      addOptimistic({ id, completed: !currentCompleted })
      await toggleTodo(id)
    })
  }

  return (
    <ul>
      {optimisticTodos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id, todo.completed)}
            disabled={isPending}
          />
          {todo.title}
        </li>
      ))}
    </ul>
  )
}
```

```typescript
// app/actions/todo.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleTodo(id: string) {
  const todo = await prisma.todo.findUnique({ where: { id } })
  if (!todo) return

  await prisma.todo.update({
    where: { id },
    data: { completed: !todo.completed },
  })

  revalidatePath("/todos")
}
```

## Bound Actions with Additional Data

```tsx
// Server Component
import { deleteUser } from "@/app/actions/user"

export function UserRow({ user }: { user: User }) {
  const deleteUserWithId = deleteUser.bind(null, user.id)

  return (
    <form action={deleteUserWithId}>
      <span>{user.name}</span>
      <button type="submit">Delete</button>
    </form>
  )
}
```

```typescript
// app/actions/user.ts
"use server"

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } })
  revalidatePath("/users")
}
```
