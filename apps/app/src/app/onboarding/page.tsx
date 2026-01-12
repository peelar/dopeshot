import { notFound, redirect } from "next/navigation";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isBrandUser } from "@/lib/tier";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import type { BrandMode, BrandPersonality } from "@/lib/types/brand";

const BRAND_ONBOARDING_STEP = "brand_profile";

function isMode(value: unknown): value is BrandMode {
  return value === "light" || value === "dark";
}

function isPersonality(value: unknown): value is BrandPersonality {
  return (
    value === "technical" ||
    value === "business" ||
    value === "creative" ||
    value === "friendly" ||
    value === "premium"
  );
}

export default async function OnboardingPage() {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    redirect("/auth");
  }

  const userId = session.userId;
  if (!(await isBrandUser(userId))) {
    notFound();
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
    isPersonality(profile?.personality) &&
    typeof palette?.accent === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(palette.accent) &&
    isMode(palette?.mode);

  const isOnboardingComplete =
    completedSteps.includes(BRAND_ONBOARDING_STEP) || looksCompleteFromProfile;

  if (isOnboardingComplete) {
    redirect("/");
  }

  let logoUrl: string | null = null;
  if (profile?.logoPath) {
    const { data } = await supabaseAdmin.storage
      .from("brand-logos")
      .createSignedUrl(profile.logoPath, 3600);
    logoUrl = data?.signedUrl ?? null;
  }

  const initialAccent =
    typeof palette?.accent === "string" ? (palette.accent as string) : null;
  const initialMode = isMode(palette?.mode) ? palette.mode : null;
  const initialPersonality = isPersonality(profile?.personality)
    ? profile.personality
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070a] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 20%, rgba(99,102,241,0.35), transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(236,72,153,0.22), transparent 50%),
              radial-gradient(circle at 40% 85%, rgba(34,211,238,0.14), transparent 45%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/65" />
      </div>

      <OnboardingForm
        initialLogoUrl={logoUrl}
        initialLogoPath={profile?.logoPath ?? null}
        initialAccent={initialAccent}
        initialMode={initialMode}
        initialPersonality={initialPersonality}
      />
    </main>
  );
}

