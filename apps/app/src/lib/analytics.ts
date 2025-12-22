/**
 * Analytics tracking utility (Simple Analytics)
 * Privacy-first event tracking with no persistent identifiers
 *
 * Features:
 * - No cookies or personal data collection
 * - No user profiling or identification
 * - Only tracks explicit product interactions
 * - Provider-agnostic API for easy swaps
 */

// Extend the Window interface to include Simple Analytics
declare global {
  interface Window {
    sa_event?: (eventName: string, eventData?: Record<string, unknown>) => void;
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
    if (window.sa_event) {
      window.sa_event(eventName, props);
    }
  } catch (error) {
    // Silently fail in development/testing
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to track event "${eventName}":`, error);
    }
  }
}
