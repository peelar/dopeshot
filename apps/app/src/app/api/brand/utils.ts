import { getUserDb } from "@/lib/data/dal";

type SessionInfo = {
  isAuth: boolean;
  userId: string | null;
};

export async function updateUserMetadata(options: {
  onboardingSteps?: string[];
  subscriptionTier?: string;
  subscriptionStatus?: string;
  session?: SessionInfo;
}) {
  const session =
    options.session ??
    (await (async () => {
      const { verifySession: getSession } = await import("@/lib/auth/session");
      return getSession();
    })());

  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized");
  }

  const db = await getUserDb(session.userId);

  // Fetch current metadata
  const current = await db.userMetadata.findUnique({
    where: { userId: session.userId },
    select: { onboardingProgress: true },
  });

  // Build cumulative onboarding progress
  const currentProgress =
    current?.onboardingProgress &&
    typeof current.onboardingProgress === "object" &&
    "completedSteps" in current.onboardingProgress &&
    Array.isArray((current.onboardingProgress as { completedSteps: unknown })
      .completedSteps) &&
    ((current.onboardingProgress as { completedSteps: unknown[] })
      .completedSteps as unknown[]).every(
      (step): step is string => typeof step === "string"
    )
      ? ((current.onboardingProgress as { completedSteps: string[] })
          .completedSteps as string[])
      : [];

  const progressSet = new Set(currentProgress);
  (options.onboardingSteps ?? []).forEach((step) => progressSet.add(step));

  // Build update data
  const updateData: {
    onboardingProgress?: { completedSteps: string[] };
    subscriptionTier?: string;
    subscriptionStatus?: string;
  } = {};

  if (options.onboardingSteps?.length) {
    updateData.onboardingProgress = {
      completedSteps: Array.from(progressSet),
    };
  }
  if (typeof options.subscriptionTier !== "undefined") {
    updateData.subscriptionTier = options.subscriptionTier;
  }
  if (typeof options.subscriptionStatus !== "undefined") {
    updateData.subscriptionStatus = options.subscriptionStatus;
  }

  if (Object.keys(updateData).length) {
    await db.userMetadata.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        subscriptionTier: "free",
        subscriptionStatus: "active",
        exportsThisMonth: 0,
        ...updateData,
      },
      update: updateData,
    });
  }

  return {
    onboarding_progress: updateData.onboardingProgress ?? {
      completedSteps: currentProgress,
    },
  };
}

export function sanitizeFileExtension(filename: string | null | undefined) {
  if (!filename) return "png";
  const parts = filename.split(".").filter(Boolean);
  const extension = parts.length ? parts.at(-1) : null;
  if (!extension) return "png";
  return extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
}
