import "server-only";

import { verifySession } from "@/lib/auth/session";

export type AdminCheckResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string };

export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const email = session.session?.user?.email ?? null;
  const allowed = (process.env.DOPESHOT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return { ok: false, status: 403, error: "Admin access not configured" };
  }

  if (!email || !allowed.includes(email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: session.userId, email };
}
