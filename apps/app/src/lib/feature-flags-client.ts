/**
 * Client-side feature flags for use in client components.
 * These are static values that get bundled at build time.
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Static client-side feature flag for showing the Brand tab in the sidebar.
 * Set to true to show the Brand tab (with tier-based enable/disable).
 * Set to false to completely hide the Brand tab from the UI.
 */
export const SHOW_BRAND_TAB = isDevelopment;
