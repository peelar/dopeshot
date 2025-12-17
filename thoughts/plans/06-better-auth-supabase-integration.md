# Better Auth + Supabase Security Integration

## Current Problem

We've temporarily disabled Row Level Security (RLS) to allow the onboarding flow to work. This is **insecure** because:

1. **Database tables** (`brand_profiles`, `user_metadata`) have RLS disabled
   - Any client can read/write anyone's data
   - No user isolation or access control

2. **Storage bucket** (`brand-logos`) has permissive policy
   - Anyone can upload files anywhere in the bucket
   - No user folder isolation

3. **Root cause**: Supabase client uses anon key without user context
   - Better Auth manages sessions separately
   - Supabase RLS policies check `auth.uid()` which is always null
   - No bridge between Better Auth sessions and Supabase security

## Goal

Make Supabase aware of Better Auth sessions so RLS policies can properly validate:
- Users can only access their own data
- Users can only upload to their own folders
- Maintain security without sacrificing user experience

## Current State

- `components/onboarding/onboarding-modal.tsx` and `components/brand/brand-panel.tsx` still call `supabaseDb` directly for storage uploads, logo metadata, and onboarding progress. They rely on the anonymous key, so Supabase only sees `auth.uid()` as `null`.
- `BrandPanel` also reads `brand_profiles` at mount to show the current logo, and it uses `supabaseDb.storage.createSignedUrl()` in the client.
- The client-only `lib/supabase-db.ts` exports the anon key client; the service-role key is only available server-side, so the easiest way to respect RLS is to move writes behind authenticated API routes.
- Storage uploads to `brand-logos` are unguarded from the client, so any signed-in user can write to any path. We need server-side validation to keep the bucket scoped to the requester.

## Solution Options

### Option 1: Server-Side API Routes (Recommended)

**How it works:**
1. Create Next.js API routes for sensitive operations (upload logo, update profile)
2. API routes validate Better Auth session server-side
3. Use Supabase **service role key** on server (bypasses RLS)
4. Manually enforce user ownership in code

**Pros:**
- Full control over authorization logic
- Service role key bypasses RLS entirely
- Can add custom validation, rate limiting, etc.
- Better Auth session validation is straightforward server-side

**Cons:**
- More API routes to maintain
- Can't use Supabase client directly from components
- More boilerplate code

**Implementation:**
```typescript
// app/api/brand/upload-logo/route.ts
export async function POST(req: Request) {
  // 1. Validate Better Auth session
  const session = await getSession();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Use Supabase service role client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Secret, never exposed to client
  );

  // 3. Upload to storage with user's ID
  const path = `${session.user.id}/logo-${Date.now()}.png`;
  const { error } = await supabaseAdmin.storage
    .from("brand-logos")
    .upload(path, file);

  // 4. Update database with user's ID
  await supabaseAdmin
    .from("brand_profiles")
    .upsert({ user_id: session.user.id, logo_path: path });

  return Response.json({ success: true });
}
```

**RLS policies:**
```sql
-- Can re-enable RLS since server handles auth
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Service role bypasses these, but good for audit
CREATE POLICY "Service role can manage profiles"
ON brand_profiles FOR ALL
TO service_role
USING (true);
```

---

### Option 2: Custom Supabase Auth Provider

**How it works:**
1. Create a custom Supabase auth provider that uses Better Auth tokens
2. Set Better Auth JWT on Supabase client after login
3. Configure Supabase to validate Better Auth JWTs
4. RLS policies work with `auth.uid()` from Better Auth token

**Pros:**
- Can use Supabase client directly from components
- RLS policies work as designed
- Clean separation of concerns

**Cons:**
- Complex JWT configuration
- Need to sync token refresh between Better Auth and Supabase
- Requires Supabase JWT secret configuration
- More fragile (token format changes break everything)

**Implementation:**
```typescript
// lib/supabase-db.ts
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth/auth-client";

export async function getAuthenticatedSupabaseClient() {
  const session = await getSession();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Set Better Auth token on Supabase client
  if (session?.user?.token) {
    await supabase.auth.setSession({
      access_token: session.user.token,
      refresh_token: session.user.refreshToken,
    });
  }

  return supabase;
}
```

**Supabase configuration:**
- Configure JWT secret to match Better Auth
- Set JWT audience/issuer claims
- Enable custom JWT validation

---

### Option 3: Hybrid - Server Actions with Better Auth

**How it works:**
1. Use Next.js Server Actions for mutations (upload, update)
2. Keep read operations client-side with relaxed RLS
3. Server Actions validate Better Auth session
4. Use service role for writes only

**Pros:**
- Simpler than full API routes
- Can still read data client-side
- Server Actions colocated with components
- Gradual migration path

**Cons:**
- Mixed security model (some RLS, some server-side)
- Read operations still need RLS policies
- Can be confusing to maintain

**Implementation:**
```typescript
// app/actions/brand.ts
"use server";

import { getSession } from "@/lib/auth/auth-server";
import { createClient } from "@supabase/supabase-js";

export async function uploadLogo(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle upload with user's ID...
}
```

---

## Recommended Approach

**Use Option 1: Server-Side API Routes**

### Why:
1. **Security first**: Complete control over who can do what
2. **Simplicity**: No complex JWT configuration
3. **Flexibility**: Easy to add rate limiting, validation, logging
4. **Maintainability**: Clear separation between client and server
5. **Better Auth native**: Works naturally with Better Auth's session model

## Proposed API Contracts

- `POST /api/brand/upload-logo` handles a multipart upload from onboarding or the brand panel, stores the file under `{userId}/logo-<timestamp>`, updates `brand_profiles`, and returns a signed URL for the new logo.
- `PATCH /api/brand/update-profile` accepts metadata updates (colors, typography, onboarding progress flags) and writes them using the Supabase service role while validating the Better Auth session.
- `POST /api/brand/skip-onboarding` records the skipped onboarding step in `user_metadata` (mirroring the current supabase upsert in `components/onboarding/onboarding-modal.tsx`).
- `GET /api/brand/profile` reads `brand_profiles` and `user_metadata` for the current user, constructs signed URLs for logos, and returns the data to hydrate `components/brand/brand-panel.tsx`.

Each route validates the Better Auth session server-side, extracts `session.user.id`, and uses a service-role Supabase client so we can safely re-enable RLS and tighten storage policies.

### Phase 1: Secure Write Operations
- Create API routes for:
  - `POST /api/brand/upload-logo` - Upload logo to storage
  - `PATCH /api/brand/update-profile` - Update brand profile
  - `POST /api/brand/skip-onboarding` - Mark onboarding complete
- All routes validate Better Auth session server-side
- Use Supabase service role key on server
- Re-enable RLS on tables (server bypasses it)

### Phase 2: Secure Read Operations
- Create API route for:
  - `GET /api/brand/profile` - Get user's brand profile
- Or use read-only RLS policy:
  ```sql
  CREATE POLICY "Users can read their own profile"
  ON brand_profiles FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
  ```
- Pass Better Auth user ID in custom header

### Phase 3: Storage Security
- Re-enable strict storage policies:
  ```sql
  CREATE POLICY "Users can manage their logos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'brand-logos'
    AND split_part(name, '/', 1) = current_setting('request.jwt.claims', true)::json->>'sub'
  );
  ```
- Or handle all storage operations server-side

---

## Implementation Checklist

### Phase 1: Write Operations (Priority)
- [ ] Create `app/api/brand/upload-logo/route.ts`
- [ ] Create `app/api/brand/update-profile/route.ts`
- [ ] Create `app/api/brand/skip-onboarding/route.ts`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Create `lib/supabase-admin.ts` for service role client
- [ ] Update `components/onboarding/onboarding-modal.tsx` to POST to `/api/brand/upload-logo` for file uploads and to `/api/brand/skip-onboarding` for the skip path instead of calling `supabaseDb` directly.
- [ ] Update `components/brand/brand-panel.tsx` to load the profile via `GET /api/brand/profile` and to upload/remove logos through the new API routes so write operations use the service role client.
- [ ] Re-enable RLS on `brand_profiles` and `user_metadata`
- [ ] Test all write operations work with real sessions

### Phase 2: Storage Security
- [ ] Move storage uploads to server-side API routes
- [ ] Ensure `POST /api/brand/upload-logo` writes logos under `{userId}/` and returns signed URLs so the UI can continue displaying them without direct bucket writes.
- [ ] Re-enable strict storage policies
- [ ] Test file uploads work correctly
- [ ] Add file size/type validation server-side

### Phase 3: Read Operations (Optional)
- [ ] Implement `GET /api/brand/profile` so `BrandPanel` can fetch brand metadata without elevating client permissions.
- [ ] If any client reads remain, add fine-grained RLS policies that use `auth.uid()` (or custom JWT claims) so only the owner can select their rows.
- [ ] Consider service-role-backed read routes when signed URLs or cross-table joins are too complex for RLS alone.

### Phase 4: Cleanup
- [ ] Remove permissive test policies
- [ ] Audit all database queries
- [ ] Add rate limiting to API routes
- [ ] Add error logging and monitoring

---

## Security Considerations

### Current Risks (With RLS Disabled):
1. **Data exposure**: Any user can read all profiles
2. **Data manipulation**: Any user can modify any profile
3. **Storage pollution**: Users can upload to wrong folders
4. **No audit trail**: Can't track who did what

### After Implementation:
1. **User isolation**: Users can only access their own data
2. **Audit trail**: Server logs all operations with user IDs
3. **Validation**: File types, sizes, quotas enforced server-side
4. **Rate limiting**: Prevent abuse of upload endpoints

---

## Migration Plan

### Step 1: Create API Routes (Non-breaking)
- Add new API routes alongside existing client code
- Don't change components yet
- Test API routes work correctly

### Step 2: Update Components (Breaking)
- Switch components to call API routes instead of direct Supabase
- Deploy and test in staging

### Step 3: Enable Security (Breaking)
- Re-enable RLS policies
- Remove permissive test policies
- Monitor for errors

### Step 4: Cleanup
- Remove unused direct Supabase calls
- Add comprehensive tests
- Document security architecture

---

## Estimated Effort

- **Phase 1**: 2-3 hours (API routes + testing)
- **Phase 2**: 1 hour (Storage policies)
- **Phase 3**: 1 hour (Read operations)
- **Phase 4**: 1 hour (Cleanup + docs)

**Total**: ~5-6 hours for complete security implementation

---

## Future Enhancements

1. **Rate limiting**: Prevent abuse (e.g., max 10 uploads/hour)
2. **File scanning**: Virus/malware detection on uploads
3. **CDN integration**: Serve logos from CDN with signed URLs
4. **Audit logging**: Track all sensitive operations
5. **Admin panel**: View/manage user data securely
