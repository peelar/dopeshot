import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { updateUserMetadata } from "@/app/api/brand/utils";

export async function POST() {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateUserMetadata({
      onboardingSteps: ["logo_onboarding_skipped"],
      session,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
