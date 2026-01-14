import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { enablePolarBillingFlag } from "@/lib/feature-flags";

export type BillingMeResponse = {
  tier: "free" | "brand";
  status: string | null;
  cancelAtPeriodEnd: boolean | null;
  currentPeriodEnd: string | null;
  endsAt: string | null;
};

export async function GET() {
  const enabled = await enablePolarBillingFlag();
  if (!enabled) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const session = await verifySession();
  if (!session.isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  invariant(session.userId, "userId must be defined when isAuth is true");
  const db = await getUserDb(session.userId);

  const metadata = await db.userMetadata.findUnique({
    where: { userId: session.userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionEndsAt: true,
    },
  });

  const tier = metadata?.subscriptionTier === "brand" ? "brand" : "free";

  const response: BillingMeResponse = {
    tier,
    status: metadata?.subscriptionStatus ?? null,
    cancelAtPeriodEnd: metadata?.subscriptionCancelAtPeriodEnd ?? null,
    currentPeriodEnd: metadata?.subscriptionCurrentPeriodEnd
      ? metadata.subscriptionCurrentPeriodEnd.toISOString()
      : null,
    endsAt: metadata?.subscriptionEndsAt ? metadata.subscriptionEndsAt.toISOString() : null,
  };

  return NextResponse.json(response);
}

