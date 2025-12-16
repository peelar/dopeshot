/**
 * Umami Analytics tracking utility
 * Privacy-first event tracking with no persistent identifiers
 *
 * Features:
 * - No cookies or localStorage (Umami default)
 * - No user profiling or identification
 * - Only tracks explicit product interactions
 * - EU-compliant, no consent required
 */

// Extend the Window interface to include umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Track a custom event with Umami
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
    // Only track if Umami is loaded
    if (window.umami) {
      window.umami.track(eventName, props);
    }
  } catch (error) {
    // Silently fail in development/testing
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to track event "${eventName}":`, error);
    }
  }
}
