import type { BrandPersonality } from "@/lib/types/brand";
import type { FontStyle, PersonalityTexture } from "@/domain/layout/types";

/**
 * Shadow configuration for a personality style.
 * Used to generate CSS box-shadow values.
 */
export interface PersonalityShadow {
  blur: number;
  spread: number;
  offsetY: number;
  opacity: number;
  /** Optional tint color for warm/colored shadows (e.g., "rgba(139, 90, 43, 0.1)") */
  tint?: string;
}

/**
 * Complete style token set for a brand personality.
 * Each personality maps to concrete visual tokens that control
 * corner radius, shadow, texture, and typography.
 */
export interface PersonalityStyle {
  cornerRadius: number;
  shadow: PersonalityShadow;
  texture: PersonalityTexture;
  textureIntensity?: number;
  fontStyle: FontStyle;
}

/**
 * Personality to visual style mapping.
 *
 * Each personality defines a cohesive visual system:
 * - Hipster: Warm, grainy, handcrafted (Bricolage Grotesque)
 * - Founder: Sharp, clean, precise (Geist Sans)
 * - Hacker: Terminal vibes, functional, no fluff (IBM Plex Mono)
 * - Kawaii: Soft, rounded, Studio Ghibli warmth (Kiwi Maru)
 * - Retro: 8-bit pixel art, bright primaries, game-inspired (Geist Pixel Square)
 */
export const personalityStyles: Record<BrandPersonality, PersonalityStyle> = {
  hipster: {
    cornerRadius: 14,
    shadow: {
      blur: 24,
      spread: -4,
      offsetY: 12,
      opacity: 0.18,
      tint: "rgba(139, 90, 43, 0.1)", // warm brown tint
    },
    texture: "grain",
    textureIntensity: 0.6,
    fontStyle: "billboard", // Bricolage Grotesque - bold, expressive
  },
  founder: {
    cornerRadius: 8,
    shadow: {
      blur: 4,
      spread: 0,
      offsetY: 4,
      opacity: 0.12,
    },
    texture: "none",
    fontStyle: "founder", // Geist Sans - clean, modern
  },
  hacker: {
    cornerRadius: 2,
    shadow: {
      blur: 0,
      spread: 0,
      offsetY: 0,
      opacity: 0,
    },
    texture: "scanlines", // stubbed - falls back to grain
    textureIntensity: 0.3,
    fontStyle: "terminal", // IBM Plex Mono
  },
  kawaii: {
    cornerRadius: 24,
    shadow: {
      blur: 40,
      spread: 0,
      offsetY: 16,
      opacity: 0.15,
    },
    texture: "none",
    fontStyle: "ghibli", // Kiwi Maru - warm, rounded, Studio Ghibli feel
  },
  retro: {
    cornerRadius: 0,
    shadow: {
      blur: 0,
      spread: 0,
      offsetY: 4,
      opacity: 0.6,
    },
    texture: "dots",
    textureIntensity: 0.4,
    fontStyle: "pixel", // Geist Pixel Square - 8-bit, game-inspired
  },
};

/**
 * Get the complete style configuration for a personality.
 * Returns null if no personality is set.
 */
export function getStyleForPersonality(
  personality: BrandPersonality | null | undefined,
): PersonalityStyle | null {
  if (!personality) return null;
  return personalityStyles[personality] ?? null;
}

/**
 * Get just the font style for a personality.
 * Returns "founder" as default if no personality is set.
 */
export function getFontForPersonality(
  personality: BrandPersonality | null | undefined,
): FontStyle {
  if (!personality) return "founder";
  return personalityStyles[personality]?.fontStyle ?? "founder";
}
