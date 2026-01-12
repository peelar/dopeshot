import { z } from "zod";

export const brandPersonalityValues = [
  "technical",
  "business",
  "creative",
  "friendly",
  "premium",
] as const;

export type BrandPersonality = (typeof brandPersonalityValues)[number];

export const brandPersonalitySchema = z.enum(brandPersonalityValues);

export const brandPersonalityLabels: Record<BrandPersonality, string> = {
  technical: "Technical",
  business: "Business",
  creative: "Creative",
  friendly: "Friendly",
  premium: "Premium",
};

export const brandModeValues = ["light", "dark"] as const;

export type BrandMode = (typeof brandModeValues)[number];

export const brandModeSchema = z.enum(brandModeValues);

// Brand Color Palette Schema
export const brandColorPaletteSchema = z.object({
  mode: brandModeSchema.optional(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});

// Brand Typography Schema
export const brandTypographySchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  fontWeights: z
    .object({
      heading: z.number().optional(),
      body: z.number().optional(),
    })
    .optional(),
});

// Asset Settings Schema
export const assetSettingsSchema = z.object({
  layout: z.string(),
  orientation: z.enum(["landscape", "portrait", "square"]),
  styleToggles: z.record(z.string(), z.boolean()),
  textOverlay: z.string().optional(),
});

// Asset Metadata Schema
export const assetMetadataSchema = z.object({
  fileSize: z.number(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  format: z.string(),
});

// Onboarding Progress Schema
export const onboardingProgressSchema = z.object({
  completedSteps: z.array(z.string()),
  currentStep: z.string().optional(),
});

// Feature Flags Schema
export const featureFlagsSchema = z.record(z.string(), z.boolean());

// Text Overlays Schema
export const textOverlaysSchema = z.array(
  z.object({
    text: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    style: z
      .object({
        fontSize: z.number().optional(),
        fontWeight: z.number().optional(),
        color: z.string().optional(),
      })
      .optional(),
  }),
);

// TypeScript types exported from Zod schemas
export type BrandColorPalette = z.infer<typeof brandColorPaletteSchema>;
export type BrandTypography = z.infer<typeof brandTypographySchema>;
export type AssetSettings = z.infer<typeof assetSettingsSchema>;
export type AssetMetadata = z.infer<typeof assetMetadataSchema>;
export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type TextOverlays = z.infer<typeof textOverlaysSchema>;
