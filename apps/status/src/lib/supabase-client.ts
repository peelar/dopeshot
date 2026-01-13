import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createSupabaseClient(options: {
  supabaseUrl: string;
  serviceRoleKey: string;
}) {
  const { supabaseUrl, serviceRoleKey } = options;

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
