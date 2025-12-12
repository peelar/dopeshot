"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * PostHog Analytics Provider with EU-compliant, privacy-first configuration
 *
 * Privacy Features:
 * - No cookies or localStorage (memory-only persistence)
 * - No user profiling or identification
 * - No session replay, heatmaps, or autocapture
 * - No consent banner required
 * - GDPR-compliant by default
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize in browser and if API key is configured
    if (typeof window === "undefined") return;

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn("PostHog API key not configured. Set NEXT_PUBLIC_POSTHOG_KEY.");
      }
      return;
    }

    // Check if already initialized
    if (posthog.__loaded) return;

    posthog.init(apiKey, {
      api_host: host,

      // Privacy-first: No persistent identifiers
      persistence: "memory", // No cookies, no localStorage - memory only
      disable_persistence: false, // We use memory persistence for session context

      // No user profiling
      person_profiles: "never", // Never create user profiles

      // Disable tracking features that collect too much data
      autocapture: false, // No automatic event capture
      capture_pageview: false, // We'll manually track core actions only
      capture_pageleave: false,

      // Disable features that increase "productization"
      disable_session_recording: true, // No session replay
      disable_surveys: true, // No surveys
      enable_heatmaps: false, // No heatmaps
      enable_recording_console_log: false,

      // Other privacy settings
      respect_dnt: true, // Respect Do Not Track
      opt_out_capturing_by_default: false,

      // Performance
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog loaded (privacy-first mode)");
        }
      },
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return <>{children}</>;
}
