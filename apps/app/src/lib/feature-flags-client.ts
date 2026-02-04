/**
 * Client-side feature flags for use in client components.
 * These are static values that get bundled at build time.
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Client-side feature flag for AI background UI.
 * Enabled only in local development builds.
 */
export const SHOW_AI_BACKGROUNDS = isDevelopment;
