import "server-only";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type AdminCheckResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string };

export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (process.env.NODE_ENV !== "production") {
    const email = session.session?.user?.email ?? null;
    return { ok: true, userId: session.userId, email };
  }

  const metadata = await prisma.userMetadata.findUnique({
    where: { userId: session.userId },
    select: { isAdmin: true },
  });

  if (!metadata?.isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const email = session.session?.user?.email ?? null;
  return { ok: true, userId: session.userId, email };
}
