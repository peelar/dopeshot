const isDevelopment = process.env.NODE_ENV === "development";

export const FORCE_ONBOARDING_DEV =
  isDevelopment && process.env.NEXT_PUBLIC_FORCE_ONBOARDING === "true";
