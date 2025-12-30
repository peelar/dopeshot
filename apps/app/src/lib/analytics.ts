/**
 * Analytics tracking utility (Umami)
 * Privacy-first event tracking
 *
 * Features:
 * - No cookies or personal data collection
 * - No user profiling or identification
 * - Only tracks explicit product interactions
 * - Provider-agnostic API for easy swaps
 */

// Extend the Window interface to include Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Track a custom event through the configured analytics provider
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
