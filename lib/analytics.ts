/**
 * PostHog Analytics tracking utility
 * Privacy-first event tracking with no persistent identifiers
 *
 * Features:
 * - No cookies or localStorage (memory-only)
 * - No user profiling or identification
 * - Only tracks explicit product interactions
 * - EU-compliant, no consent required
 */

import posthog from "posthog-js";

/**
 * Track a custom event with PostHog
 * @param eventName - The name of the event to track
 * @param props - Optional event properties
 */
export function track(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Only track if PostHog is initialized
    if (posthog.__loaded) {
      posthog.capture(eventName, props);
    }
  } catch (error) {
    // Silently fail in development/testing
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to track event "${eventName}":`, error);
    }
  }
}
