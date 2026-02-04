import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { getUserTier } from "@/lib/tier";
import { isBrandPersonality } from "@/lib/types/brand";

const BRAND_ONBOARDING_STEP = "brand_profile";
const BRAND_ONBOARDING_DISMISSED_STEP = "brand_profile_dismissed";

function looksCompleteFromProfile(profile: {
  logoPath: string | null;
  personality: string | null;
  colorPalette: unknown;
} | null) {
  if (!profile?.logoPath) return false;
  if (!isBrandPersonality(profile.personality)) return false;

  const palette = profile.colorPalette as { accent?: unknown; mode?: unknown } | null | undefined;
  if (typeof palette?.accent !== "string") return false;
  if (!/^#[0-9a-fA-F]{6}$/.test(palette.accent)) return false;
  if (palette.mode !== "light" && palette.mode !== "dark") return false;
  return true;
}

export default async function Page() {
  const session = await verifySession();

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
        completedSteps.includes(BRAND_ONBOARDING_DISMISSED_STEP) ||
        looksCompleteFromProfile(profile);
    }

    const initialOnboardingOpen = tier === "brand" && !onboardingComplete;

    return (
      <PlaygroundPage
        initialIsAuthenticated={session.isAuth}
        initialOnboardingOpen={initialOnboardingOpen}
      />
    );
  }

  return (
    <PlaygroundPage
      initialIsAuthenticated={false}
      initialOnboardingOpen={false}
    />
  );
}
