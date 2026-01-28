/**
 * Client-side feature flags for use in client components.
 * These are static values that get bundled at build time.
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Feature flag to show locked Brand tab UI for non-brand users.
 * When true: non-brand users see a disabled Brand tab with upgrade tooltip.
 * When false: non-brand users don't see the Brand tab at all.
 * Brand users always see the Brand tab regardless of this flag.
 */
export const SHOW_LOCKED_BRAND_TAB = isDevelopment;
