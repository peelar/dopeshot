import type { BrandPersonality } from "@/lib/types/brand";
import type { FontStyle } from "@/domain/layout/types";

const personalityToFontStyle: Record<BrandPersonality, FontStyle> = {
  technical: "terminal",
  business: "founder",
  creative: "billboard",
  friendly: "founder",
  premium: "billboard",
};

export function getFontForPersonality(
  personality: BrandPersonality | null | undefined,
): FontStyle {
  if (!personality) return "founder";
  return personalityToFontStyle[personality] ?? "founder";
}

