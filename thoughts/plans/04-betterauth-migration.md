# Implementation Plan: Migrate from Supabase Auth to BetterAuth

## Overview

This plan migrates dopeshot from Supabase Auth to BetterAuth while keeping Supabase as the persistence layer. The goal is to make identity a product primitive that's owned by dopeshot, not dictated by external auth services. Since dopeshot is pre-users, we can do a clean migration without worrying about existing sessions.

**Key Principle:** Auth becomes an implementation detail. Product code talks about "identity" through a clean API, never imports auth libraries directly.

## Implementation Approach

**Why BetterAuth?**

- Supports Supabase as database adapter (no data migration needed)
- Identity logic is product-owned (not vendor-locked to Supabase Auth)
- Extensible for future needs (teams, SSO, multi-tenancy)
- Enables "progressive commitment" (anonymous → authenticated)
- No rewrite needed when adding payments or brand features

**Migration Strategy:**

1. Clean up broken Supabase Auth references (missing hook)
2. Install BetterAuth with Supabase adapter
3. Create identity abstraction layer at `/lib/auth/`
4. Update UI components to use new auth API
5. Test complete auth flow (signup, login, logout)
6. Add analytics tracking for auth events

**What Stays:**

- Supabase Postgres database (all existing tables)
- RLS policies (continue to protect user data)
- Storage buckets (brand logos, generated assets)
- Database triggers (auto-create profiles on signup)

**What Changes:**

- Auth client: `lib/supabase-client.ts` → `lib/auth/client.ts`
- Auth provider: `SupabaseAuthProvider` → `AuthProvider`
- Auth hook: `useSupabaseAuth()` → `useAuth()`
- Session management: Supabase Auth SDK → BetterAuth

---

## Phase 1: Remove Broken Supabase Auth References

### Goal

Clean up all references to the non-existent `use-supabase-auth` hook so the app can build without errors. This prepares for BetterAuth implementation.

### Changes Required

#### 1. Remove Auth Provider from Layout

**File**: `app/layout.tsx`
**Changes**: Remove `SupabaseAuthProvider` import and wrapper

```typescript
// REMOVE THIS LINE (Line 16):
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";

// REMOVE THIS WRAPPER (Lines 141-147):
// Before:
<SupabaseAuthProvider>
  <UmamiProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  </UmamiProvider>
</SupabaseAuthProvider>

// After:
<UmamiProvider>
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    {children}
  </ThemeProvider>
</UmamiProvider>
```

#### 2. Temporarily Disable Auth Form

**File**: `components/auth/auth-form.tsx`
**Changes**: Comment out hook usage to prevent build errors

```typescript
// COMMENT OUT LINE 9:
// import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

// COMMENT OUT LINE 14 and replace with stub:
// const { user, signInWithEmail, signUpWithEmail, signOut, isAuthenticating } = useSupabaseAuth();
const user = null;
const isAuthenticating = false;
const signInWithEmail = async () => ({ error: { message: "Auth not configured" } });
const signUpWithEmail = async () => ({ error: { message: "Auth not configured" } });
const signOut = async () => ({ error: { message: "Auth not configured" } });
```

#### 3. Keep Supabase Client for Direct Queries

**File**: `lib/supabase-client.ts`
**Changes**: None - keep this file for direct database queries (not auth)

**Rename** for clarity:

```bash
mv lib/supabase-client.ts lib/supabase-db.ts
```

Update the client to remove auth config:

```typescript
// lib/supabase-db.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in the environment.",
  );
}

// Client for direct database queries (not auth)
export const supabaseDb = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Auth handled by BetterAuth
    autoRefreshToken: false,
  },
});
```

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] No import errors for missing hooks

#### Manual Verification

- [ ] App loads without crashing
- [ ] Main playground still works (auth-agnostic)
- [ ] Auth page shows form but buttons don't work (expected)
- [ ] No console errors about missing modules

---

## Phase 2: Install and Configure BetterAuth

### Goal

Install BetterAuth with the Supabase database adapter and configure it to work with the existing database schema.

### Changes Required

#### 1. Install BetterAuth Dependencies

**Command**: Install via pnpm

```bash
pnpm add better-auth @better-auth/supabase-adapter
pnpm add -D @types/better-auth
```

#### 2. Add Environment Variables

**File**: `.env.example`
**Changes**: Add BetterAuth configuration

```env
# Supabase configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# BetterAuth configuration (new)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

**File**: `.env.local`
**Changes**: Generate and add secret

```bash
# Generate a secure secret (32+ characters)
openssl rand -base64 32
```

Add to `.env.local`:

```env
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3000
```

#### 3. Create BetterAuth Server Client

**File**: `lib/auth/auth-server.ts` (new file)
**Purpose**: Server-side auth client for API routes and server components

```typescript
import { betterAuth } from "better-auth";
import { supabaseAdapter } from "@better-auth/supabase-adapter";

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enable later with email service
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

#### 4. Create BetterAuth Client (React)

**File**: `lib/auth/auth-client.ts` (new file)
**Purpose**: Client-side auth client for React components

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession, $Infer } = authClient;
```

#### 5. Create API Route Handler

**File**: `app/api/auth/[...all]/route.ts` (new file)
**Purpose**: Handle all auth-related API requests

```typescript
import { auth } from "@/lib/auth/auth-server";

export const { GET, POST } = auth.handler;
```

#### 6. Update Environment Variables Type Safety

**File**: `lib/auth/env.ts` (new file)
**Purpose**: Validate required environment variables

```typescript
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const authEnv = {
  supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  betterAuthSecret: getEnvVar("BETTER_AUTH_SECRET"),
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:3000",
} as const;
```

Update `lib/auth/auth-server.ts` to use validated env:

```typescript
import { authEnv } from "./env";

export const auth = betterAuth({
  database: supabaseAdapter({
    url: authEnv.supabaseUrl,
    key: authEnv.supabaseServiceRoleKey,
  }),
  // ... rest of config
  secret: authEnv.betterAuthSecret,
  baseURL: authEnv.betterAuthUrl,
});
```

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] No TypeScript errors in auth files
- [ ] Environment variables validated

#### Manual Verification

- [ ] API route responds: `curl http://localhost:3000/api/auth/session`
- [ ] Returns `{"session": null}` when not authenticated
- [ ] No errors in server logs
- [ ] BetterAuth client initializes without errors

---

## Phase 3: Create Identity Abstraction Layer

### Goal

Create a clean product-facing API for identity that wraps BetterAuth. Product code never imports BetterAuth directly.

### Changes Required

#### 1. Create Identity Types

**File**: `lib/auth/types.ts` (new file)
**Purpose**: Product-facing identity types

```typescript
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  user: User;
  expiresAt: Date;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResult {
  error?: AuthError;
  user?: User;
  session?: Session;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string | null;
  color_palette: string[];
  typography: {
    heading: string;
    body: string;
  };
  logo_path: string | null;
  created_at: string;
  updated_at: string;
}
```

#### 2. Create Auth Context Provider

**File**: `lib/auth/provider.tsx` (new file)
**Purpose**: React context provider for auth state

```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/lib/auth/auth-client";
import type { User, Session } from "./types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending } = useSession();

  const user = sessionData?.session
    ? {
        id: sessionData.session.userId,
        email: sessionData.user.email,
        created_at: sessionData.user.createdAt,
      }
    : null;

  const session = sessionData?.session
    ? {
        user: user!,
        expiresAt: new Date(sessionData.session.expiresAt),
      }
    : null;

  const value: AuthContextValue = {
    user,
    session,
    isLoading: isPending,
    isAuthenticated: !!sessionData?.session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

#### 3. Create Auth Actions

**File**: `lib/auth/actions.ts` (new file)
**Purpose**: Wrapper functions for auth operations with analytics tracking

```typescript
"use client";

import { signIn, signUp, signOut } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import type { AuthResult } from "./types";

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      track("auth_sign_in_failed", {
        error: result.error.message,
        method: "email",
      });
      return { error: { message: result.error.message } };
    }

    track("auth_sign_in_success", {
      method: "email",
      user_id: result.data?.user?.id,
    });

    return {
      user: {
        id: result.data!.user!.id,
        email: result.data!.user!.email,
        created_at: result.data!.user!.createdAt,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    track("auth_sign_in_error", { error: message });
    return { error: { message } };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const result = await signUp.email({
      email,
      password,
    });

    if (result.error) {
      track("auth_sign_up_failed", {
        error: result.error.message,
        method: "email",
      });
      return { error: { message: result.error.message } };
    }

    track("auth_sign_up_success", {
      method: "email",
      user_id: result.data?.user?.id,
    });

    return {
      user: {
        id: result.data!.user!.id,
        email: result.data!.user!.email,
        created_at: result.data!.user!.createdAt,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed";
    track("auth_sign_up_error", { error: message });
    return { error: { message } };
  }
}

export async function signOutUser(): Promise<AuthResult> {
  try {
    await signOut();
    track("auth_sign_out_success");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed";
    track("auth_sign_out_error", { error: message });
    return { error: { message } };
  }
}
```

#### 4. Create Public API Barrel Export

**File**: `lib/auth/index.ts` (new file)
**Purpose**: Single entry point for all auth-related imports

```typescript
// Provider and hooks
export { AuthProvider, useAuth } from "./provider";

// Actions
export { signInWithEmail, signUpWithEmail, signOutUser } from "./actions";

// Types
export type { User, Session, AuthError, AuthResult, BrandProfile } from "./types";
```

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] All exports resolve correctly
- [ ] No circular dependency warnings

#### Manual Verification

- [ ] Can import from `@/lib/auth` without errors
- [ ] `useAuth()` hook returns expected shape
- [ ] Auth actions are properly typed
- [ ] Context provider doesn't crash

---

## Phase 4: Update UI Components

### Goal

Update all UI components to use the new auth abstraction layer. Remove all direct Supabase Auth references.

### Changes Required

#### 1. Update Root Layout

**File**: `app/layout.tsx`
**Changes**: Replace Supabase provider with new AuthProvider

```typescript
// ADD THIS IMPORT (Line 16):
import { AuthProvider } from "@/lib/auth";

// REMOVE THIS (if still present):
// import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";

// UPDATE PROVIDER WRAPPER (Lines 141-147):
<AuthProvider>
  <UmamiProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  </UmamiProvider>
</AuthProvider>
```

#### 2. Update Auth Form Component

**File**: `components/auth/auth-form.tsx`
**Changes**: Use new auth API

```typescript
// REPLACE IMPORTS (Lines 1-9):
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth, signInWithEmail, signUpWithEmail, signOutUser } from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  // REPLACE LINE 14 with new hook:
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // ... form handlers stay the same ...

  // UPDATE handleSubmit (Lines 31-65):
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !form.password) {
      setStatus({ type: "error", message: "Email and password are required." });
      return;
    }

    if (mode === "sign-up" && form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords must match." });
      return;
    }

    const handler =
      mode === "sign-in"
        ? () => signInWithEmail(trimmedEmail, form.password)
        : () => signUpWithEmail(trimmedEmail, form.password);

    const { error } = await handler();
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({
      type: "success",
      message: mode === "sign-in" ? "Signed in successfully." : "Account created successfully.",
    });

    if (mode === "sign-in") {
      setForm((prev) => ({ ...prev, password: "" }));
    } else {
      resetForm();
    }
  };

  // UPDATE handleSignOut (Lines 67-75):
  const handleSignOut = async () => {
    setStatus(null);
    const { error } = await signOutUser();
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }
    setStatus({ type: "success", message: "Signed out successfully." });
  };

  // UPDATE LINE 93 (disabled state):
  <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
    Sign out
  </Button>

  // UPDATE LINE 150 (disabled state):
  <Button type="submit" className="w-full" disabled={isLoading}>
    {mode === "sign-in" ? "Sign in" : "Create account"}
  </Button>

  // Rest of JSX stays the same
}
```

#### 3. Update Supabase DB Client References

**File**: Search and replace any imports of `supabase-client.ts`

```bash
# Find all files importing old client
grep -r "from '@/lib/supabase-client'" .
```

Update any found files to use the renamed client:

```typescript
// OLD:
import { supabase } from "@/lib/supabase-client";

// NEW:
import { supabaseDb } from "@/lib/supabase-db";
```

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] No unused imports

#### Manual Verification

- [ ] Auth form renders without errors
- [ ] Sign up flow works (creates account)
- [ ] Sign in flow works (authenticates)
- [ ] Sign out flow works (clears session)
- [ ] User email displays correctly when authenticated
- [ ] Loading states show during auth operations
- [ ] Error messages display properly
- [ ] Success messages display properly

---

## Phase 5: Database Schema Compatibility

### Goal

Ensure BetterAuth works with the existing Supabase schema. Add any missing tables or columns BetterAuth requires.

### Changes Required

#### 1. Check BetterAuth Table Requirements

**Investigation**: Review what tables BetterAuth expects

BetterAuth typically expects:

- `auth.users` table (Supabase has this)
- `sessions` table (may need to create)
- `accounts` table (for OAuth, not needed yet)

Our existing schema:

```sql
-- Supabase automatically provides:
auth.users (id, email, created_at, encrypted_password, etc.)

-- We have:
public.brand_profiles (references auth.users.id)
public.generated_assets (references auth.users.id)
public.user_metadata (references auth.users.id)
```

#### 2. Create Migration for Sessions Table (if needed)

**File**: `supabase/migrations/20250116T000000_betterauth_sessions.sql` (new file)
**Purpose**: Add session storage for BetterAuth (if using database sessions)

```sql
-- Create sessions table for BetterAuth
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast session lookups
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_token_idx on public.sessions(token);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

-- RLS policies
alter table public.sessions enable row level security;

-- Only the owner can see their sessions
create policy "Owners can select sessions"
  on public.sessions
  for select
  using (user_id = auth.uid());

-- Service role can manage all sessions (for BetterAuth)
-- No policy needed - service role bypasses RLS

-- Clean up expired sessions periodically
create or replace function public.cleanup_expired_sessions()
returns void as $$
begin
  delete from public.sessions where expires_at < now();
end;
$$ language plpgsql security definer;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- select cron.schedule('cleanup-sessions', '0 * * * *', 'select public.cleanup_expired_sessions()');
```

#### 3. Apply Migration

**Command**: Apply via Supabase CLI or MCP

```bash
# Option 1: Using Supabase MCP
# Use mcp__supabase__apply_migration with the SQL above

# Option 2: Using Supabase CLI (if installed)
supabase db push
```

#### 4. Update BetterAuth Config for Database Sessions

**File**: `lib/auth/auth-server.ts`
**Changes**: Configure session storage (only if using database sessions)

```typescript
export const auth = betterAuth({
  database: supabaseAdapter({
    url: authEnv.supabaseUrl,
    key: authEnv.supabaseServiceRoleKey,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    strategy: "jwt", // Start with JWT (no database table needed)
    // OR use database sessions:
    // strategy: "database",
    // sessionTable: "sessions",
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  secret: authEnv.betterAuthSecret,
  baseURL: authEnv.betterAuthUrl,
  trustedOrigins: ["http://localhost:3000"],
});
```

**Note**: Start with JWT sessions (simpler, no migration needed). Only add database sessions if you need instant revocation.

### Success Criteria

#### Automated Verification

- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Migration applies without errors

#### Manual Verification

- [ ] Sign up creates user in `auth.users` table
- [ ] User ID is UUID format
- [ ] `brand_profiles` auto-created via trigger
- [ ] `user_metadata` auto-created via trigger
- [ ] Session persists across page refresh
- [ ] Sign out clears session properly
- [ ] RLS policies still work (users can't access other users' data)

---

## Phase 6: Testing and Verification

### Goal

Comprehensively test the auth system to ensure all flows work correctly.

### Changes Required

#### 1. Create Auth Test Suite

**File**: `tests/auth.test.ts` (new file)
**Purpose**: Unit tests for auth functions

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signInWithEmail, signUpWithEmail, signOutUser } from "@/lib/auth/actions";

// Note: These tests require a test Supabase instance
// Skip in CI if test credentials not available

describe("Auth Actions", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  afterEach(async () => {
    // Clean up: sign out after each test
    await signOutUser();
  });

  it("should sign up a new user", async () => {
    const result = await signUpWithEmail(testEmail, testPassword);
    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
  });

  it("should sign in an existing user", async () => {
    // First create the user
    await signUpWithEmail(testEmail, testPassword);
    await signOutUser();

    // Then sign in
    const result = await signInWithEmail(testEmail, testPassword);
    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
  });

  it("should reject invalid credentials", async () => {
    const result = await signInWithEmail(testEmail, "wrong-password");
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("Invalid");
  });

  it("should sign out successfully", async () => {
    await signUpWithEmail(testEmail, testPassword);
    const result = await signOutUser();
    expect(result.error).toBeUndefined();
  });
});
```

#### 2. Create E2E Auth Tests

**File**: `tests/e2e/auth.spec.ts` (new file)
**Purpose**: End-to-end tests with Playwright

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  test("should complete sign up flow", async ({ page }) => {
    await page.goto("/auth");

    // Switch to sign-up mode
    await page.click('text="Create account"');

    // Fill form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="auth-password"]', testPassword);
    await page.fill('input[id="auth-password-confirm"]', testPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator("text=Account created successfully")).toBeVisible();
  });

  test("should complete sign in flow", async ({ page }) => {
    // Prerequisite: User must exist (run sign up test first or use fixture)

    await page.goto("/auth");

    // Fill form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Verify user is shown
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();
  });

  test("should sign out", async ({ page }) => {
    // Prerequisite: User must be signed in

    await page.goto("/auth");

    // Click sign out
    await page.click('text="Sign out"');

    // Verify sign in form is shown again
    await expect(page.locator('text="Sign in"')).toBeVisible();
  });

  test("should show error for invalid email", async ({ page }) => {
    await page.goto("/auth");

    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid")).toBeVisible();
  });

  test("should require matching passwords on sign up", async ({ page }) => {
    await page.goto("/auth");
    await page.click('text="Create account"');

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="auth-password"]', testPassword);
    await page.fill('input[id="auth-password-confirm"]', "different-password");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Passwords must match")).toBeVisible();
  });
});
```

#### 3. Update Test Scripts

**File**: `package.json`
**Changes**: Add auth test commands

```json
{
  "scripts": {
    "test:auth": "vitest run tests/auth.test.ts",
    "test:e2e:auth": "playwright test tests/e2e/auth.spec.ts",
    "test:all": "pnpm typecheck && pnpm test:domain && pnpm test:ui && pnpm test:auth && pnpm test:e2e"
  }
}
```

#### 4. Manual Test Checklist

Create a manual testing checklist in the docs.

**File**: `docs/AUTH_TESTING.md` (new file)

```markdown
# Auth Testing Checklist

## Sign Up Flow

- [ ] Can access `/auth` page
- [ ] Form shows "Create account" tab
- [ ] Email field validates format
- [ ] Password field enforces minimum length
- [ ] Confirm password field checks match
- [ ] Submit button disabled during processing
- [ ] Success message shown on completion
- [ ] User email displayed after signup
- [ ] New user appears in Supabase dashboard → Authentication → Users
- [ ] `brand_profiles` record auto-created (check Supabase Table Editor)
- [ ] `user_metadata` record auto-created (check Supabase Table Editor)

## Sign In Flow

- [ ] Can switch to "Sign in" tab
- [ ] Email/password fields work
- [ ] Invalid credentials show error
- [ ] Valid credentials authenticate
- [ ] User email displayed after signin
- [ ] Session persists across page refresh
- [ ] Session persists across browser tabs

## Sign Out Flow

- [ ] "Sign out" button visible when authenticated
- [ ] Click signs out successfully
- [ ] Returns to sign in form
- [ ] Session cleared (refresh shows unauthenticated)

## Analytics Tracking

- [ ] `auth_sign_up_success` event fires on signup (check browser console)
- [ ] `auth_sign_in_success` event fires on signin
- [ ] `auth_sign_out_success` event fires on signout
- [ ] `auth_sign_in_failed` event fires on wrong password

## Security

- [ ] Can't access other users' brand profiles (test with 2 accounts)
- [ ] Can't view other users' generated assets
- [ ] RLS policies enforced (try direct API calls)
- [ ] Service role key not exposed in client code

## Error Handling

- [ ] Network error shows user-friendly message
- [ ] Invalid email format rejected
- [ ] Weak password rejected (if configured)
- [ ] Duplicate email rejected on signup
```

### Success Criteria

#### Automated Verification

- [ ] All unit tests pass: `pnpm test:auth`
- [ ] All E2E tests pass: `pnpm test:e2e:auth`
- [ ] Full test suite passes: `pnpm test:all`
- [ ] Build passes: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`

#### Manual Verification

- [ ] All items in `docs/AUTH_TESTING.md` checklist pass
- [ ] Analytics events tracked correctly
- [ ] Auth works in both development and production build
- [ ] Sessions persist correctly
- [ ] RLS policies enforced

---

## Phase 7: Documentation

### Goal

Document the new auth system for future developers and users.

### Changes Required

#### 1. Update Project README

**File**: `README.md`
**Changes**: Document auth architecture

Add new section after existing content:

````markdown
## Authentication

dopeshot uses [BetterAuth](https://www.better-auth.com/) for authentication with Supabase as the persistence layer.

### Architecture

- **Identity Logic**: BetterAuth manages sessions, authentication flows
- **Data Storage**: Supabase Postgres stores user data, profiles, assets
- **Product API**: All components use `@/lib/auth` (never import BetterAuth directly)

### Auth API

```typescript
import { useAuth, signInWithEmail, signUpWithEmail, signOutUser } from "@/lib/auth";

// In components:
const { user, session, isLoading, isAuthenticated } = useAuth();

// Sign up:
const result = await signUpWithEmail(email, password);

// Sign in:
const result = await signInWithEmail(email, password);

// Sign out:
const result = await signOutUser();
```
````

### Database Schema

User-related data is stored in Supabase:

- `auth.users` - Core auth records (managed by BetterAuth)
- `public.brand_profiles` - User brand identity (colors, fonts, logo)
- `public.generated_assets` - Screenshot history
- `public.user_metadata` - Subscription tier, feature flags

All tables protected by Row-Level Security (RLS).

### Environment Variables

Required for auth to work:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# BetterAuth
BETTER_AUTH_SECRET=your-secret-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### Testing Auth

```bash
# Run auth unit tests
pnpm test:auth

# Run auth E2E tests
pnpm test:e2e:auth

# Manual test checklist
See docs/AUTH_TESTING.md
```

````

#### 2. Create Auth Architecture Doc
**File**: `docs/ARCHITECTURE_AUTH.md` (new file)

```markdown
# Auth Architecture

## Design Principles

1. **Identity is a Product Primitive** - Auth is part of dopeshot's product model, not an external service
2. **Separation of Concerns** - Identity logic (BetterAuth) is separate from data storage (Supabase)
3. **Progressive Commitment** - Users can start anonymous, attach identity later (future)
4. **Extensible** - Ready for teams, SSO, multi-tenancy without rewrites

## Why BetterAuth?

We chose BetterAuth over Supabase Auth because:

- **Product Ownership**: Identity logic lives in dopeshot code, not vendor SDK
- **Flexibility**: Can swap storage backends without changing product code
- **Future-Proof**: Supports advanced features (teams, SSO) without vendor lock-in
- **Compatibility**: Uses Supabase as database (no data migration needed)

## Component Layers

````

┌─────────────────────────────────────────────┐
│ Product Code (components, pages) │
│ Imports from: @/lib/auth │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Identity Abstraction (@/lib/auth/) │
│ • useAuth() hook │
│ • signInWithEmail(), signUpWithEmail() │
│ • AuthProvider context │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ BetterAuth (better-auth) │
│ • Session management │
│ • Password hashing │
│ • API routes (/api/auth/\*) │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Supabase Postgres │
│ • auth.users (core records) │
│ • public.brand_profiles │
│ • public.user_metadata │
│ • public.sessions (if using DB sessions) │
└─────────────────────────────────────────────┘

````

## Data Flow

### Sign Up
1. User fills form → `signUpWithEmail(email, password)`
2. BetterAuth hashes password, creates user in `auth.users`
3. Supabase trigger fires, creates `brand_profiles` + `user_metadata`
4. Session created (JWT or DB), returned to client
5. Analytics event tracked: `auth_sign_up_success`

### Sign In
1. User fills form → `signInWithEmail(email, password)`
2. BetterAuth verifies password hash
3. Session created, returned to client
4. `useAuth()` hook updates, components re-render
5. Analytics event tracked: `auth_sign_in_success`

### Session Persistence
- JWT sessions: Stored in HTTP-only cookie, validated per-request
- DB sessions: Stored in `sessions` table, cookie contains session ID

### Sign Out
1. User clicks "Sign out" → `signOutUser()`
2. BetterAuth invalidates session (clears cookie or deletes DB record)
3. `useAuth()` hook updates, components re-render
4. Analytics event tracked: `auth_sign_out_success`

## Security

### Row-Level Security (RLS)
All user data protected by Supabase RLS policies:

```sql
-- Users can only access their own data
create policy "Owners can select brand profile"
  on public.brand_profiles
  for select
  using (user_id = auth.uid());
````

### Service Role Key

- Used by BetterAuth (server-side only)
- Never exposed to client
- Bypasses RLS for auth operations

### Password Security

- Hashed using BetterAuth's default (bcrypt)
- Minimum length enforced (8 chars)
- Stored in `auth.users.encrypted_password`

## Future Extensions

### Anonymous Sessions

- Allow users to use playground without account
- Attach identity later with "Sign up to save"
- Migrate local state → database on signup

### OAuth Providers

- Add Google, GitHub sign-in
- BetterAuth handles OAuth flow
- Link to existing email accounts

### Multi-Tenancy / Teams

- Add `teams` table with member relationships
- Extend `brand_profiles` to support team ownership
- BetterAuth supports organization context

````

#### 3. Update Development Setup Docs
**File**: `docs/DEVELOPMENT.md` (update or create)

Add section on running the auth system locally:

```markdown
## Running Auth Locally

1. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
````

2. **Add Supabase credentials**:
   - Get from Supabase dashboard → Project Settings → API
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Get service role key from Supabase dashboard (keep secret!)

3. **Generate BetterAuth secret**:

   ```bash
   openssl rand -base64 32
   ```

   Add to `.env.local` as `BETTER_AUTH_SECRET`

4. **Apply database migrations**:
   - Migrations in `supabase/migrations/` are already applied
   - If adding new migrations, use Supabase CLI or MCP

5. **Start dev server**:

   ```bash
   pnpm dev
   ```

6. **Test auth**:
   - Visit http://localhost:3000/auth
   - Create account, sign in, sign out
   - Check Supabase dashboard for created users

````

### Success Criteria

#### Automated Verification
- [ ] README renders correctly in markdown preview
- [ ] All internal links work
- [ ] Code examples are valid TypeScript

#### Manual Verification
- [ ] Auth API is clearly documented
- [ ] Architecture diagrams are accurate
- [ ] Setup instructions are complete
- [ ] Examples match actual code
- [ ] Future developers can understand system from docs alone

---

## Rollback Plan

If the migration fails or causes critical issues, here's how to revert:

### Quick Rollback (Emergency)

1. **Revert to previous commit** (if changes were committed):
   ```bash
   git revert HEAD
   pnpm install
   pnpm build
````

2. **Or reset to before migration**:
   ```bash
   git log --oneline  # Find commit before migration
   git reset --hard <commit-hash>
   pnpm install
   ```

### Selective Rollback (Keep Some Changes)

1. **Revert auth files only**:

   ```bash
   git checkout HEAD~1 -- lib/auth/
   git checkout HEAD~1 -- app/api/auth/
   git checkout HEAD~1 -- components/auth/auth-form.tsx
   git checkout HEAD~1 -- app/layout.tsx
   ```

2. **Remove BetterAuth dependencies**:

   ```bash
   pnpm remove better-auth @better-auth/supabase-adapter
   ```

3. **Restore Supabase Auth** (if needed):
   - Uncomment Supabase Auth code in `components/auth/auth-form.tsx`
   - Restore `SupabaseAuthProvider` in `app/layout.tsx`
   - Recreate `hooks/use-supabase-auth.ts` (or accept broken state until proper fix)

### Data Integrity

- **User data is safe**: All data in Supabase Postgres remains untouched
- **Sessions will be lost**: Users will need to sign in again after rollback
- **No data migration needed**: Schema is compatible with both systems

### Reversion Testing

After rollback:

- [ ] App builds successfully: `pnpm build`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Main playground works (auth-agnostic)
- [ ] Previous auth system works (if fully restored)

---

## Post-Migration Tasks

After successful migration:

### Immediate

- [ ] Delete old Supabase Auth references (if any remain)
- [ ] Remove commented-out code
- [ ] Update `.gitignore` to include `.env.local` (should already be there)
- [ ] Commit changes with clear message

### Within 1 Week

- [ ] Monitor error logs for auth issues
- [ ] Track auth analytics events (signup rate, signin rate)
- [ ] Gather user feedback on auth experience
- [ ] Test on staging environment (if applicable)

### Future Enhancements

- [ ] Add email verification flow
- [ ] Add password reset flow
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Implement anonymous sessions ("Sign up to save")
- [ ] Add profile editing UI
- [ ] Connect brand profiles to playground (load user's brand as default)

---

## Summary

This migration moves dopeshot from broken Supabase Auth references to a working BetterAuth implementation with a clean abstraction layer. The key benefits:

1. **Identity is a product primitive** - Auth is owned by dopeshot, not Supabase
2. **Future-proof architecture** - Ready for teams, SSO, advanced features
3. **No data migration** - Uses existing Supabase schema
4. **Clean API** - Product code never imports auth libraries directly
5. **Full analytics** - All auth events tracked for product insights

**Total Effort**: ~6-8 hours for experienced developer
**Risk Level**: Low (pre-users, no existing sessions to migrate)
**Impact**: High (enables all future identity-driven features)
