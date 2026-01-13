import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { showBrandExperienceFlag } from "@/lib/feature-flags";
import { getUserTier } from "@/lib/tier";

const BRAND_ONBOARDING_STEP = "brand_profile";

function looksCompleteFromProfile(profile: {
  logoPath: string | null;
  personality: string | null;
  colorPalette: unknown;
} | null) {
  if (!profile?.logoPath) return false;
  if (
    profile.personality !== "technical" &&
    profile.personality !== "business" &&
    profile.personality !== "creative" &&
    profile.personality !== "friendly" &&
    profile.personality !== "premium"
  ) {
    return false;
  }

  const palette = profile.colorPalette as { accent?: unknown; mode?: unknown } | null | undefined;
  if (typeof palette?.accent !== "string") return false;
  if (!/^#[0-9a-fA-F]{6}$/.test(palette.accent)) return false;
  if (palette.mode !== "light" && palette.mode !== "dark") return false;
  return true;
}

export default async function Page() {
  const [showBrandFlag, session] = await Promise.all([
    showBrandExperienceFlag(),
    verifySession(),
  ]);

  if (session.isAuth && session.userId) {
    const tier = await getUserTier(session.userId);
    let onboardingComplete = true;

    if (tier === "brand") {
      const db = await getUserDb(session.userId);
      const [metadata, profile] = await Promise.all([
        db.userMetadata.findUnique({
          where: { userId: session.userId },
          select: { onboardingProgress: true },
        }),
        db.brandProfile.findUnique({
          where: { userId: session.userId },
          select: { logoPath: true, personality: true, colorPalette: true },
        }),
      ]);

      const progress = metadata?.onboardingProgress as
        | { completedSteps?: unknown }
        | null
        | undefined;

      const completedSteps = Array.isArray(progress?.completedSteps)
        ? (progress.completedSteps as unknown[])
        : [];

      onboardingComplete =
        completedSteps.includes(BRAND_ONBOARDING_STEP) ||
        looksCompleteFromProfile(profile);
    }

    const showBrandExperience = showBrandFlag && tier === "brand";
    const initialOnboardingOpen = tier === "brand" && !onboardingComplete;

    return (
      <PlaygroundPage
        showBrandExperience={showBrandExperience}
        initialIsAuthenticated={session.isAuth}
        initialOnboardingOpen={initialOnboardingOpen}
      />
    );
  }

  return (
    <PlaygroundPage
      showBrandExperience={false}
      initialIsAuthenticated={false}
      initialOnboardingOpen={false}
    />
  );
}
