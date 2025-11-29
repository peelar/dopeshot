import { ShadowIntensity } from "@/domain/layout/types";

export const SHADOW_PRESETS: Record<ShadowIntensity, string> = {
  low: "0 2px 8px rgba(0, 0, 0, 0.08)",
  medium: "0 4px 16px rgba(0, 0, 0, 0.15)",
  high: "0 12px 40px rgba(0, 0, 0, 0.3)",
};

export function getShadowValue(intensity?: ShadowIntensity) {
  return SHADOW_PRESETS[intensity || "medium"];
}
