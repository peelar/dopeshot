export const brandPersonalityValues = [
  "hipster",
  "founder",
  "hacker",
  "kawaii",
] as const;

export type BrandPersonality = (typeof brandPersonalityValues)[number];

export const brandPersonalityLabels: Record<BrandPersonality, string> = {
  hipster: "Hipster",
  founder: "Founder",
  hacker: "Hacker",
  kawaii: "Kawaii",
};

export const brandModeValues = ["light", "dark"] as const;

export type BrandMode = (typeof brandModeValues)[number];
