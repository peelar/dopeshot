# Research: Supabase Auth → BetterAuth Migration Analysis

**Date:** 2025-12-16
**Status:** Foundation research for migration
**Context:** dopeshot is pre-users; choosing auth architecture for product evolution

---

## Executive Summary

dopeshot currently has **partial Supabase Auth implementation** - the infrastructure is configured but the integration layer (`use-supabase-auth` hook) is missing. This analysis maps the current state to inform a migration to BetterAuth that treats identity as a product primitive rather than an external service.

### Key Findings

1. **Auth infrastructure is ready** (Supabase project, schema, RLS) but not connected to the app
2. **Critical missing component:** `hooks/use-supabase-auth.ts` hook/provider
3. **Main app is auth-agnostic** - playground works without any user context
4. **Tight coupling exists** at the layout level (provider wraps entire app)
5. **Database schema supports identity-driven defaults** (brand profiles, asset history)

---

## Current Architecture Overview

### 1. Supabase Infrastructure (Configured ✓)

**Project:** `xgvseaushfumwnvkhdyx` (us-east-1)
**Environment:** `.env.local` with anon key configured

**Database Schema:**

- `brand_profiles` - User brand identity (colors, fonts, logo)
- `generated_assets` - Screenshot history with settings snapshots
- `user_metadata` - Subscription tier, onboarding, feature flags

**Storage Buckets:**

- `brand-logos` (private) - User logos with owner-only access
- `generated-assets` (public) - Exported screenshots with public read

**Security:**

- RLS policies on all tables (user can only access their own data)
- Automatic user bootstrapping via triggers on signup
- UUID-based primary keys throughout

### 2. Client-Side Auth (Partially Implemented ⚠️)

**Supabase Client** (`lib/supabase-client.ts:1-17`)

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
  },
});
```

- Singleton client instance
- Session persistence via localStorage
- OAuth redirect handling enabled

**Auth Provider** (MISSING ✗)

```typescript
// Referenced but doesn't exist:
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
```

- Imported in `app/layout.tsx:16`
- Wraps entire app at root level (`app/layout.tsx:141-147`)
- No implementation found

**Auth Hook** (MISSING ✗)

```typescript
// Expected interface (inferred from usage):
function useSupabaseAuth() {
  return {
    user: User | null,
    signInWithEmail: (email, password) => Promise<{ error? }>,
    signUpWithEmail: (email, password) => Promise<{ error? }>,
    signOut: () => Promise<{ error? }>,
    isAuthenticating: boolean,
  };
}
```

- Used in `components/auth/auth-form.tsx:14-17`
- Hook implementation doesn't exist

### 3. UI Components (Implemented ✓)

**Auth Form** (`components/auth/auth-form.tsx`)

- Sign-in / sign-up modes with email/password
- Shows user profile when authenticated (email, member date)
- Sign-out functionality
- Form validation and error handling

**Auth Page** (`app/auth/page.tsx`)

- Dedicated route at `/auth`
- Renders `AuthForm` component
- Not integrated with main app flow

### 4. Application State (Auth-Agnostic ✓)

**Main Playground** (`app/page.tsx`)

- Works completely without auth
- Uses Jotai atoms for state (not auth-aware)
- Export downloads locally (no database persistence)

**Current Data Flow:**

```
User → Playground → Jotai Atoms → Export PNG → Download
(No auth, no persistence, no user context)
```

---

## Identity Coupling Analysis

### Current Coupling to Supabase

| Component             | Coupling Type | Location                        | Impact                                           |
| --------------------- | ------------- | ------------------------------- | ------------------------------------------------ |
| Client initialization | **Tight**     | `lib/supabase-client.ts`        | Direct import of `@supabase/supabase-js`         |
| Auth provider wrapper | **Tight**     | `app/layout.tsx:141-147`        | Wraps entire app, forces initialization          |
| Auth form             | **Medium**    | `components/auth/auth-form.tsx` | Depends on hook interface, not Supabase directly |
| Database schema       | **Tight**     | `supabase/migrations/`          | Supabase-specific SQL (RLS, triggers)            |
| Storage paths         | **Medium**    | Schema defines paths            | Bucket structure is Supabase-specific            |

### Where Identity Shapes Product Behavior

**Currently:** Identity has **zero influence** on product behavior

- Playground works the same for everyone
- No brand defaults applied
- No asset history shown
- No subscription tier differences

**After Migration:** Identity should drive:

1. **Brand defaults** - "Your brand is the default" (logged-in users see their colors/fonts)
2. **Asset persistence** - History is automatic for authenticated users
3. **Progressive commitment** - Start anonymous, attach identity later
4. **Subscription behavior** - Paid features implicit, not gated

---

## Migration Requirements for BetterAuth

### 1. Make Identity a Product Primitive

**Problem:** Auth is currently an external service (Supabase) that the product imports directly

**Solution:** Create an identity abstraction layer

```typescript
// Future structure:
/lib/identity/
  ├─ types.ts           - Product identity types (not auth types)
  ├─ client.ts          - Identity client (BetterAuth-backed)
  ├─ hooks.ts           - useIdentity() hook (product-facing)
  └─ provider.tsx       - Identity provider (replaces Supabase provider)
```

**Key Changes:**

- Replace `useSupabaseAuth()` with `useIdentity()`
- Auth becomes implementation detail, not API surface
- Product code never imports BetterAuth directly

### 2. Separate Identity From Infrastructure

**Current:** Supabase Auth = Identity + Persistence + Session Management (bundled)

**Target:**

- **Identity logic** → BetterAuth (owns concept of user, session, auth flow)
- **Persistence** → Supabase Postgres (just data storage, no auth logic)
- **Product state** → Jotai atoms + identity context (drives defaults)

**Migration Path:**

1. BetterAuth uses Supabase as database adapter (not auth provider)
2. Identity tables live in Supabase but BetterAuth manages them
3. Product queries identity via BetterAuth, not Supabase client

### 3. Enable Identity-Driven Defaults

**Database Schema Ready:**

- `brand_profiles` table exists (colors, fonts, logo)
- `generated_assets` table exists (history)
- Triggers auto-create profile on signup

**What Needs to Change:**

- Playground should query brand profile when user is authenticated
- Config atoms should initialize from brand profile (not hardcoded defaults)
- Export should auto-save to `generated_assets` when authenticated

**Example Flow:**

```typescript
// Current (auth-agnostic):
const [config] = useAtom(configAtom); // Hardcoded defaults

// Target (identity-driven):
const { user, brandProfile } = useIdentity();
const [config] = useAtom(configAtom); // Initializes from brandProfile if user exists
```

### 4. Support Progressive Commitment

**Requirement:** User should be able to:

1. Start using playground immediately (anonymous)
2. Build something they like
3. Sign up to save it (attach identity)
4. Continue from where they left off

**Current Gap:**

- Auth page is isolated (`/auth`)
- No "save your work" prompt
- No session migration (anonymous → authenticated)

**Migration Need:**

- BetterAuth must support anonymous sessions
- State migration when upgrading from anon → authenticated
- "Sign up to save" CTA in playground

### 5. Avoid Future Rewrites

**What Must Work Without Breaking:**

- Adding payment subscriptions (Stripe webhooks → `user_metadata.tier`)
- Brand onboarding flow (wizard → `brand_profiles`)
- Asset history view (query `generated_assets`)
- Sharing/teams (extend identity model)

**Key Decision:** Choose BetterAuth because:

- Supports Supabase as persistence layer (no data migration needed)
- Identity logic is product-owned (not vendor-locked)
- Extensible for teams, SSO, multi-tenancy
- No rewrite needed when adding payments/features

---

## File-by-File Migration Map

### Files to Replace

| File                            | Current State                     | Migration Action                 | New Location         |
| ------------------------------- | --------------------------------- | -------------------------------- | -------------------- |
| `lib/supabase-client.ts`        | Supabase client singleton         | Replace with BetterAuth client   | `lib/auth/client.ts` |
| `hooks/use-supabase-auth.ts`    | Missing (should exist)            | Create with BetterAuth           | `lib/auth/hooks.ts`  |
| `app/layout.tsx`                | Wraps with `SupabaseAuthProvider` | Replace with BetterAuth provider | Update import        |
| `components/auth/auth-form.tsx` | Uses `useSupabaseAuth()`          | Update to `useAuth()`            | Update import        |

### Files to Keep (Data Layer)

| File                                           | Reason                      | Notes                            |
| ---------------------------------------------- | --------------------------- | -------------------------------- |
| `supabase/migrations/20240401T000000_init.sql` | Schema is Supabase-agnostic | BetterAuth will use these tables |
| `supabase/seed/phase1_seed.sql`                | Test data                   | Update user references if needed |
| Database tables (`brand_profiles`, etc.)       | Data stays in Supabase      | BetterAuth queries them          |

### Files to Create

| File                    | Purpose                 | Example Content                   |
| ----------------------- | ----------------------- | --------------------------------- |
| `lib/auth/client.ts`    | BetterAuth client setup | Initialize with Supabase adapter  |
| `lib/auth/provider.tsx` | Auth context provider   | Wraps app, exposes identity       |
| `lib/auth/hooks.ts`     | `useAuth()` hook        | Product-facing auth API           |
| `lib/auth/types.ts`     | Identity types          | `User`, `Session`, `BrandProfile` |
| `middleware.ts` (root)  | Session validation      | Protect routes if needed          |

---

## Code Examples for Migration

### Current: Supabase Client

```typescript
// lib/supabase-client.ts (CURRENT)
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
  },
});
```

### Target: BetterAuth Client

```typescript
// lib/auth/client.ts (TARGET)
import { createAuthClient } from "better-auth/react";
import { supabaseAdapter } from "better-auth/adapters/supabase";

export const auth = createAuthClient({
  adapter: supabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY, // Server-side only
  }),
  session: {
    strategy: "jwt", // Or "database" if prefer Supabase session storage
  },
});
```

### Current: Missing Hook

```typescript
// hooks/use-supabase-auth.ts (MISSING - SHOULD EXIST)
// This is what the app expects but doesn't have
export function useSupabaseAuth() {
  // Would manage Supabase auth state
}
```

### Target: Identity Hook

```typescript
// lib/auth/hooks.ts (TARGET)
import { useSession } from "better-auth/react";
import { useBrandProfile } from "./queries"; // Fetch from Supabase

export function useIdentity() {
  const { data: session, status } = useSession();
  const { data: brandProfile } = useBrandProfile(session?.user?.id);

  return {
    user: session?.user ?? null,
    brandProfile,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
```

---

## Architectural Decisions

### Decision 1: Where Does BetterAuth Live?

**Option A:** `/lib/auth/` (Recommended)

- Clear separation from product code
- All identity logic in one place
- Easy to replace if needed

**Option B:** `/lib/identity/`

- More product-centric naming
- Emphasizes identity as product primitive

**Recommendation:** Use `/lib/auth/` for clarity, but expose via `useIdentity()` hook to emphasize product ownership

### Decision 2: BetterAuth Session Strategy

**Option A:** JWT sessions (BetterAuth default)

- Fast, stateless, no DB queries per request
- Works well with Next.js middleware
- Can store limited data in token

**Option B:** Database sessions (Supabase as storage)

- More secure (can revoke instantly)
- Can store more session data
- Requires DB query per request

**Recommendation:** Start with JWT, add database storage if need instant revocation

### Decision 3: Anonymous User Support

**Option A:** Full anonymous sessions (BetterAuth guest mode)

- Users start with temporary identity
- Upgrade to permanent identity on signup
- Requires session migration logic

**Option B:** No anonymous sessions (auth-required for persistence)

- Simpler implementation
- Users must sign up to save anything

**Recommendation:** Option A (anonymous sessions) to support "progressive commitment" goal

### Decision 4: Migration Path

**Option A:** Big bang (replace Supabase Auth entirely)

- Remove all Supabase Auth code at once
- Implement BetterAuth completely
- Test everything before deploy

**Option B:** Gradual (run both temporarily)

- Keep Supabase Auth for existing users
- Add BetterAuth for new users
- Migrate users over time

**Recommendation:** Option A (big bang) because dopeshot is pre-users - no existing users to migrate

---

## Migration Risks

### Technical Risks

1. **Database schema incompatibility**
   - Risk: BetterAuth expects different table structure
   - Mitigation: Use custom adapter to map to existing `brand_profiles`, `user_metadata`

2. **Session storage differences**
   - Risk: Users logged in with Supabase won't be recognized by BetterAuth
   - Mitigation: Not a problem (pre-users, no existing sessions)

3. **RLS policy conflicts**
   - Risk: BetterAuth queries might not respect Supabase RLS
   - Mitigation: Use service role key for BetterAuth, keep RLS for direct queries

4. **OAuth provider differences**
   - Risk: Supabase OAuth vs BetterAuth OAuth (different callback URLs)
   - Mitigation: Not implementing OAuth in Phase 1

### Product Risks

1. **Identity becomes too abstract**
   - Risk: Over-engineering the abstraction layer
   - Mitigation: Keep it simple - just wrap BetterAuth, don't create new concepts

2. **Anonymous → authenticated transition**
   - Risk: Users lose work when signing up
   - Mitigation: Carefully design state migration (Jotai atoms → database)

3. **Performance impact**
   - Risk: Extra DB queries for brand profile on every load
   - Mitigation: Cache brand profile in auth context, only refetch on mutation

---

## Success Criteria

After migration to BetterAuth, the system should:

✓ **Auth no longer dictates product shape**

- Components import from `/lib/auth/`, not `@supabase/supabase-js`
- Auth logic is replaceable without product changes

✓ **Identity is modeled in product terms**

- `useIdentity()` hook exposes user + brand profile
- Product code talks about "identity", not "auth"

✓ **Future features fit naturally**

- Adding payments updates `user_metadata.tier` (no auth changes)
- Adding brand onboarding updates `brand_profiles` (no auth changes)
- Adding asset history queries `generated_assets` (no auth changes)

✓ **No migration needed when dopeshot becomes "real"**

- BetterAuth supports teams, SSO, multi-tenancy (future-proof)
- Database schema is already prepared (no rewrites)

---

## Next Steps

### Phase 1: Remove Supabase Auth Dependency

1. Delete references to missing `use-supabase-auth` hook
2. Remove `SupabaseAuthProvider` from layout
3. Keep Supabase client for direct DB queries (not auth)

### Phase 2: Implement BetterAuth

1. Install `better-auth` and Supabase adapter
2. Create `/lib/auth/` directory with client, provider, hooks
3. Configure BetterAuth to use existing database schema
4. Test auth flow (signup, login, logout)

### Phase 3: Connect Identity to Product

1. Update playground to query brand profile when authenticated
2. Initialize config atoms from brand profile
3. Auto-save exports to `generated_assets` table
4. Add "Sign up to save" CTA in playground

### Phase 4: Support Progressive Commitment

1. Enable anonymous sessions in BetterAuth
2. Implement state migration (local → database)
3. Add "upgrade to save" flow

---

## Appendix: File Locations

### Critical Files

| File                                           | Status    | Line References                      |
| ---------------------------------------------- | --------- | ------------------------------------ |
| `lib/supabase-client.ts`                       | ✓ Exists  | 1-17 (client init)                   |
| `app/layout.tsx`                               | ✓ Exists  | 16 (import), 141-147 (provider wrap) |
| `components/auth/auth-form.tsx`                | ✓ Exists  | 9 (import hook), 14-17 (hook usage)  |
| `app/auth/page.tsx`                            | ✓ Exists  | Full file (auth route)               |
| `hooks/use-supabase-auth.ts`                   | ✗ Missing | Referenced but not implemented       |
| `supabase/migrations/20240401T000000_init.sql` | ✓ Exists  | Full schema                          |
| `docs/SUPABASE_SETUP_COMPLETE.md`              | ✓ Exists  | Project credentials                  |

### Key Atoms (State Management)

| Atom              | File             | Purpose              | Auth-Aware? |
| ----------------- | ---------------- | -------------------- | ----------- |
| `configAtom`      | `hooks/atoms.ts` | Layout config        | No          |
| `assetsAtom`      | `hooks/atoms.ts` | Uploaded screenshots | No          |
| `orientationAtom` | `hooks/atoms.ts` | Portrait/landscape   | No          |
| `assetTypeAtom`   | `hooks/atoms.ts` | Asset type selection | No          |

### Database Tables

| Table              | Purpose                         | RLS Policy                              |
| ------------------ | ------------------------------- | --------------------------------------- |
| `brand_profiles`   | User brand identity             | Owner-only access                       |
| `generated_assets` | Screenshot history              | Owner-only write, public read if shared |
| `user_metadata`    | Subscription, onboarding, flags | Owner-only access                       |

---

**End of Research Document**
