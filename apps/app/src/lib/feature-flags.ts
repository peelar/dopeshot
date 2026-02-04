import { flag } from "flags/next";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Feature flag that gates onboarding helper UI and the brand panel.
 * Defaults to true in development builds and off in production.
 */
export const showBrandExperienceFlag = flag({
  key: "features.show-brand-experience",
  description: "Enable onboarding/brand UI that is still under active development.",
  defaultValue: isDevelopment,
  options: [
    { value: true, label: "Enabled (development default)" },
    { value: false, label: "Disabled (production default)" },
  ],
  decide: () => isDevelopment,
});

/**
 * Static client-side feature flag for showing the Brand tab in the sidebar.
 * Set to true to show the Brand tab (with tier-based enable/disable).
 * Set to false to completely hide the Brand tab from the UI.
 */
export const SHOW_BRAND_TAB = isDevelopment;

/**
 * Feature flag that gates all Polar billing codepaths.
 *
 * Enabled in development by default, or when POLAR_ENABLED=true is set.
 */
const polarEnabledEnv = process.env.POLAR_ENABLED === "true";
export const enablePolarBillingFlag = flag({
  key: "billing.enable-polar",
  description: "Enable Polar checkout + webhooks.",
  defaultValue: isDevelopment || polarEnabledEnv,
  options: [
    { value: true, label: "Enabled" },
    { value: false, label: "Disabled" },
  ],
  decide: () => isDevelopment || polarEnabledEnv,
});

/**
 * Feature flag that gates AI background tooling.
 * Defaults to true in local development and off elsewhere.
 */
export const showAiBackgroundsFlag = flag({
  key: "features.show-ai-backgrounds",
  description: "Enable AI backgrounds tooling (local development only).",
  defaultValue: isDevelopment,
  options: [
    { value: true, label: "Enabled (development default)" },
    { value: false, label: "Disabled (production default)" },
  ],
  decide: () => isDevelopment,
});
