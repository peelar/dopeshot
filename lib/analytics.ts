/**
 * Plausible Analytics tracking utility
 * Provides type-safe event tracking with custom properties
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

/**
 * Track a custom event with Plausible Analytics
 * @param eventName - The name of the event to track
 * @param props - Optional event properties (all values will be converted to strings)
 */
export function track(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Plausible is loaded via script tag in layout
    if (window.plausible) {
      // Convert all prop values to strings as Plausible expects
      const normalizedProps = props
        ? Object.fromEntries(
            Object.entries(props).map(([key, value]) => [key, String(value)])
          )
        : undefined;

      window.plausible(eventName, normalizedProps ? { props: normalizedProps } : undefined);
    }
  } catch (error) {
    // Silently fail in development/testing
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to track event "${eventName}":`, error);
    }
  }
}
