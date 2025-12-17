"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { supabaseDb } from "@/lib/supabase-db";
import { track } from "@/lib/analytics";

export function useOnboardingFlow() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const MAX_RETRIES = 3;
    let retries = 0;

    async function checkOnboardingStatus() {
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      try {
        // Query user_metadata to check onboarding progress
        const { data, error } = await supabaseDb
          .from("user_metadata")
          .select("onboarding_progress")
          .eq("user_id", session.user.id)
          .single();

        // Handle different error scenarios
        if (error) {
          // PGRST116 = No rows found - this is a NEW user, show onboarding!
          if (error.code === "PGRST116") {
            setShowModal(true);
            track("onboarding_modal_shown");
            setIsChecking(false);
            return;
          }

          // Other errors (table doesn't exist, etc.) - skip onboarding gracefully
          if (process.env.NODE_ENV === "development") {
            console.warn("Onboarding check skipped - user_metadata not available:", error.code);
          }
          setIsChecking(false);
          return;
        }

        const progress = data?.onboarding_progress || [];
        const hasCompleted =
          progress.includes("logo_onboarding_completed") ||
          progress.includes("logo_onboarding_skipped");

        if (!hasCompleted) {
          setShowModal(true);
          track("onboarding_modal_shown");
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // Retry with exponential backoff
        if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(checkOnboardingStatus, 2000 * retries);
        } else {
          setIsChecking(false);
        }
      } finally {
        if (retries === 0) {
          setIsChecking(false);
        }
      }
    }

    checkOnboardingStatus();
  }, [session]);

  return {
    showOnboardingModal: showModal,
    setShowOnboardingModal: setShowModal,
    isCheckingOnboarding: isChecking,
  };
}
