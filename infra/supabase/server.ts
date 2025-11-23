import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
};

/**
 * Creates a Supabase client for Server Components (read-only cookies).
 * Use this in page components and other Server Components.
 * Note: Token refresh won't work in Server Components - use Server Actions for operations that need refresh.
 */
export const createServerSupabaseClient = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        // In Server Components, we can't modify cookies
        // Wrap in try-catch to prevent errors when Supabase tries to refresh tokens
        set: () => {
          // Silently ignore - cookies can't be modified in Server Components
          // Token refresh will need to happen in Server Actions or Route Handlers
        },
        remove: () => {
          // Silently ignore - cookies can't be modified in Server Components
        },
      },
    },
  );
};

/**
 * Creates a Supabase client for Server Actions and Route Handlers (full cookie access).
 * Use this in Server Actions and Route Handlers where cookies can be modified.
 */
export const createServerSupabaseClientForActions = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
};
