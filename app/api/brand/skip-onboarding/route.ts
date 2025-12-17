import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/server-session";
import { updateUserMetadata } from "@/app/api/brand/utils";

export async function POST(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await updateUserMetadata(userId, {
      onboardingSteps: ["logo_onboarding_skipped"],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
