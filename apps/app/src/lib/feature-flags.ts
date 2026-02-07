import { flag } from "flags/next";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Feature flag that gates all Polar billing codepaths.
 * Defaults to true in local development and off elsewhere.
 */
export const enablePolarBillingFlag = flag({
  key: "billing.enable-polar",
  description: "Enable Polar checkout + webhooks.",
  defaultValue: isDevelopment,
  options: [
    { value: true, label: "Enabled" },
    { value: false, label: "Disabled" },
  ],
  decide: () => isDevelopment,
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

/**
 * Feature flag that gates the personality playground.
 * Defaults to true in local development and off elsewhere.
 */
export const showPersonalityPlaygroundFlag = flag({
  key: "features.show-personality-playground",
  description: "Enable personality preview playground (local development only).",
  defaultValue: isDevelopment,
  options: [
    { value: true, label: "Enabled (development default)" },
    { value: false, label: "Disabled (production default)" },
  ],
  decide: () => isDevelopment,
});
