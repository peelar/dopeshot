import "server-only";

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserTier } from "@/lib/tier";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ tier: "free" }, { status: 200 });
  }

  const tier = await getUserTier(session.userId);
  return NextResponse.json({ tier }, { status: 200 });
}
