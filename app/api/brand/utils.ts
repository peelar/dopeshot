import { supabaseAdmin } from "@/lib/supabase-admin";

export async function updateUserMetadata(
  userId: string,
  options: {
    onboardingSteps?: string[];
    subscriptionTier?: string;
    subscriptionStatus?: string;
  },
) {
  const { data } = await supabaseAdmin
    .from("user_metadata")
    .select("onboarding_progress")
    .eq("user_id", userId)
    .maybeSingle();

  const currentProgress = Array.isArray(data?.onboarding_progress)
    ? data!.onboarding_progress
    : [];
  const progressSet = new Set(currentProgress);
  (options.onboardingSteps ?? []).forEach((step) => progressSet.add(step));

  const updates: {
    user_id: string;
    onboarding_progress?: string[];
    subscription_tier?: string;
    subscription_status?: string;
  } = {
    user_id: userId,
  };

  if (options.onboardingSteps?.length) {
    updates.onboarding_progress = Array.from(progressSet);
  }
  if (typeof options.subscriptionTier !== "undefined") {
    updates.subscription_tier = options.subscriptionTier;
  }
  if (typeof options.subscriptionStatus !== "undefined") {
    updates.subscription_status = options.subscriptionStatus;
  }

  if (Object.keys(updates).length > 1) {
    await supabaseAdmin.from("user_metadata").upsert(updates, {
      onConflict: "user_id",
    });
  }

  return {
    onboarding_progress: updates.onboarding_progress ?? currentProgress,
  };
}

export function sanitizeFileExtension(filename: string | null | undefined) {
  if (!filename) return "png";
  const parts = filename.split(".").filter(Boolean);
  const extension = parts.length ? parts.at(-1) : null;
  if (!extension) return "png";
  return extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
}
