import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in the environment.",
  );
}

// Client for direct database queries (not auth)
// Auth is now handled by BetterAuth
export const supabaseDb = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Auth handled by BetterAuth
    autoRefreshToken: false,
  },
});
