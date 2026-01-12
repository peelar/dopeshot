import "server-only";

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";

export const dynamic = "force-dynamic";

function isTruthyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveIsBrandUser(featureFlags: unknown): boolean {
  if (!isTruthyObject(featureFlags)) return false;

  const flagValue = (key: string) => featureFlags[key];

  return (
    flagValue("tier.brand") === true ||
    flagValue("tier.brand_user") === true ||
    flagValue("brand") === true ||
    flagValue("isBrandUser") === true
  );
}

export async function GET() {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ tier: "free" }, { status: 200 });
  }

  const db = await getUserDb(session.userId);
  const metadata = await db.userMetadata.findUnique({
    where: { userId: session.userId },
    select: { featureFlags: true },
  });

  const isBrandUser = resolveIsBrandUser(metadata?.featureFlags);
  return NextResponse.json({ tier: isBrandUser ? "brand" : "free" }, { status: 200 });
}
