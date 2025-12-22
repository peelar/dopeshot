import "server-only";

import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in the environment.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type BackgroundAuthContext = {
  isAuth: boolean;
  userId: string | null;
  isBranded: boolean;
  userTier: string | null;
  error?: string;
};

export async function getBackgroundAuthContext(options?: {
  requireBranded?: boolean;
}): Promise<BackgroundAuthContext> {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    return {
      isAuth: false,
      userId: null,
      isBranded: false,
      userTier: null,
      error: "Unauthorized",
    };
  }

  const db = await getUserDb(session.userId);
  const [brandProfile, metadata] = await Promise.all([
    db.brandProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    }),
    db.userMetadata.findUnique({
      where: { userId: session.userId },
      select: { subscriptionTier: true },
    }),
  ]);

  const isBranded = Boolean(brandProfile);
  if (options?.requireBranded && !isBranded) {
    return {
      isAuth: true,
      userId: session.userId,
      isBranded,
      userTier: metadata?.subscriptionTier ?? "free",
      error: "Branded account required",
    };
  }

  return {
    isAuth: true,
    userId: session.userId,
    isBranded,
    userTier: metadata?.subscriptionTier ?? "free",
  };
}
