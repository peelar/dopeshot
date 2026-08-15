import { z } from "zod";

export const brandPersonalityValues = [
  "hipster",
  "founder",
  "hacker",
  "kawaii",
] as const;

export type BrandPersonality = (typeof brandPersonalityValues)[number];

export const brandPersonalitySchema = z.enum(brandPersonalityValues);

export const brandPersonalityLabels: Record<BrandPersonality, string> = {
  hipster: "Hipster",
  founder: "Founder",
  hacker: "Hacker",
  kawaii: "Kawaii",
};

// Type guard to check if a value is a valid BrandPersonality
export function isBrandPersonality(value: unknown): value is BrandPersonality {
  return (
    typeof value === "string" &&
    brandPersonalityValues.includes(value as BrandPersonality)
  );
}

export const brandModeValues = ["light", "dark"] as const;

export type BrandMode = (typeof brandModeValues)[number];

export const brandModeSchema = z.enum(brandModeValues);
