import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { getUserTier, type SubscriptionTier } from "@/lib/tier";
import { isBrandPersonality } from "@/lib/types/brand";

const BRAND_ONBOARDING_STEP = "brand_profile";
const BRAND_ONBOARDING_DISMISSED_STEP = "brand_profile_dismissed";

function isMode(value: unknown): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

export async function GET() {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    invariant(session.userId, "userId must be defined when isAuth is true");
    const userId = session.userId;

    const tier: SubscriptionTier = await getUserTier(userId);
    if (tier !== "brand") {
      return NextResponse.json({ tier, onboardingComplete: true });
    }

    const db = await getUserDb(userId);

    const [metadata, profile] = await Promise.all([
      db.userMetadata.findUnique({
        where: { userId },
        select: { onboardingProgress: true },
      }),
      db.brandProfile.findUnique({
        where: { userId },
        select: { logoPath: true, personality: true, colorPalette: true },
      }),
    ]);

    const progress = metadata?.onboardingProgress as
      | { completedSteps?: unknown }
      | null
      | undefined;

    const completedSteps = Array.isArray(progress?.completedSteps)
      ? (progress?.completedSteps as unknown[])
      : [];

    const palette = profile?.colorPalette as
      | { accent?: unknown; mode?: unknown }
      | null
      | undefined;

    const looksCompleteFromProfile =
      Boolean(profile?.logoPath) &&
      isBrandPersonality(profile?.personality) &&
      typeof palette?.accent === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(palette.accent) &&
      isMode(palette?.mode);

    const onboardingComplete =
      completedSteps.includes(BRAND_ONBOARDING_STEP) ||
      completedSteps.includes(BRAND_ONBOARDING_DISMISSED_STEP) ||
      looksCompleteFromProfile;

    return NextResponse.json({ tier, onboardingComplete });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load onboarding status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
