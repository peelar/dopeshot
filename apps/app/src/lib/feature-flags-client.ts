/**
 * Client-side feature flags for use in client components.
 * These are static values that get bundled at build time.
 */

import { SHOW_AI_BACKGROUNDS_DEV } from "./dev-flags";

/**
 * Client-side feature flag for AI background UI.
 * ALWAYS OFF in production.
 * In local development, controlled via NEXT_PUBLIC_SHOW_AI_BACKGROUNDS env var.
 */
export const SHOW_AI_BACKGROUNDS = SHOW_AI_BACKGROUNDS_DEV;
