import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throw in non-test environments
const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === '1';

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isTest) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in the environment.",
    );
  }
  // In test environment, use dummy values to prevent crashes
  // The actual client won't work, but the module won't crash
}

// Client for direct database queries (not auth)
// Auth is now handled by BetterAuth
export const supabaseDb = createClient(
  supabaseUrl || 'https://test.supabase.co',
  supabaseAnonKey || 'test-anon-key',
  {
    auth: {
      persistSession: false, // Auth handled by BetterAuth
      autoRefreshToken: false,
    },
  },
);
