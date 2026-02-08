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

