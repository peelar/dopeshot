// Type definitions for Prisma JSON fields
// These types are used by prisma-json-types-generator to provide compile-time type safety

declare global {
  namespace PrismaJson {
    type BrandColorPalette = import("./brand").BrandColorPalette;
    type BrandTypography = import("./brand").BrandTypography;
    type AssetSettings = import("./brand").AssetSettings;
    type AssetMetadata = import("./brand").AssetMetadata;
    type OnboardingProgress = import("./brand").OnboardingProgress;
    type FeatureFlags = import("./brand").FeatureFlags;
    type TextOverlays = import("./brand").TextOverlays;
  }
}

export {};
