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
