import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import {
  type SubscriptionStatus,
  type SubscriptionTier,
} from "@/lib/tier";

type SetTierBody = {
  userId?: string;
  email?: string;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
};

const isTier = (value: unknown): value is SubscriptionTier =>
  value === "free" || value === "brand";

const isStatus = (value: unknown): value is SubscriptionStatus =>
  value === "active" || value === "inactive";

const isAuthorized = (request: Request) => {
  const expected = process.env.ADMIN_TIER_SECRET;
  if (!expected) {
    return process.env.NODE_ENV === "development";
  }

  const headerSecret = request.headers.get("x-admin-tier-secret");
  if (headerSecret && headerSecret === expected) return true;

  const auth = request.headers.get("authorization");
  if (!auth) return false;

  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer") return false;
  return token === expected;
};

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SetTierBody = await request.json().catch(() => ({}));

    const tier = body.tier;
    invariant(isTier(tier), "tier must be 'free' or 'brand'");

    const status = body.status;
    invariant(
      typeof status === "undefined" || isStatus(status),
      "status must be 'active' or 'inactive'",
    );

    let userId = body.userId;

    if (!userId && body.email) {
      const email = body.email.toLowerCase();
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      invariant(user?.id, "No user found for that email");
      userId = user.id;
    }

    invariant(userId, "userId or email is required");

    const { setUserTier } = await import("@/lib/tier");
    const updated = await setUserTier({ userId, tier, status });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set user tier";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
