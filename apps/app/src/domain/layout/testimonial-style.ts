import { getStyleForPersonality, type PersonalityShadow } from "@/domain/brand/personality-mapping";
import { hexToRgba } from "@/domain/layout/gradients/utils";
import type { BrandMode, BrandPersonality } from "@/lib/types/brand";

export type TestimonialTexture = "none" | "grain" | "scanlines";
export type TestimonialTier = "anonymous" | "default" | "brand";

export interface ResolveTestimonialStyleInput {
  isLoggedIn: boolean;
  isBrandUser: boolean;
  personality?: BrandPersonality | null;
  mode?: BrandMode | null;
  accent?: string | null;
  fallbackMode: BrandMode;
  fallbackBackground: string;
}

export interface TestimonialVisualStyle {
  tier: TestimonialTier;
  mode: BrandMode;
  personality: BrandPersonality;
  accent: string;
  canvasBackground: string;
  textColor: string;
  mutedTextColor: string;
  starColor: string;
  quoteMarkColor: string;
  avatarRingColor: string;
  authorPlateBackground: string;
  authorPlateBorder: string;
  authorPlateShadow: string;
  cardBackground: string;
  cardBorder: string;
  cardRadius: number;
  cardShadow: string;
  texture: TestimonialTexture;
  textureIntensity: number;
  showDecorativeBlobs: boolean;
  blobPrimary: string;
  blobSecondary: string;
}

const DEFAULT_ACCENT = "#6366F1";
const DEFAULT_PERSONALITY: BrandPersonality = "founder";

const LIGHT_TEXT = "#0F172A";
const DARK_TEXT = "#F8FAFC";

const NEUTRAL_SOLID_BY_MODE: Record<BrandMode, string> = {
  light: "#E2E8F0",
  dark: "#0F172A",
};

const DEFAULT_STYLE: TestimonialVisualStyle = {
  tier: "anonymous",
  mode: "light",
  personality: DEFAULT_PERSONALITY,
  accent: DEFAULT_ACCENT,
  canvasBackground: "",
  textColor: LIGHT_TEXT,
  mutedTextColor: "rgba(15, 23, 42, 0.72)",
  starColor: DEFAULT_ACCENT,
  quoteMarkColor: "rgba(99, 102, 241, 0.22)",
  avatarRingColor: hexToRgba(DEFAULT_ACCENT, 0.45),
  authorPlateBackground: "linear-gradient(135deg, rgba(241, 245, 249, 0.86) 0%, rgba(255, 255, 255, 0.68) 100%)",
  authorPlateBorder: "rgba(148, 163, 184, 0.34)",
  authorPlateShadow: "0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)",
  cardBackground: "rgba(255, 255, 255, 0.68)",
  cardBorder: "rgba(148, 163, 184, 0.26)",
  cardRadius: 14,
  cardShadow: "0 6px 20px rgba(15, 23, 42, 0.10)",
  texture: "none",
  textureIntensity: 0,
  showDecorativeBlobs: false,
  blobPrimary: hexToRgba(DEFAULT_ACCENT, 0.22),
  blobSecondary: "rgba(148, 163, 184, 0.18)",
};

function normalizeHex(input?: string | null): string {
  if (!input) return DEFAULT_ACCENT;
  const trimmed = input.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return DEFAULT_ACCENT;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  const matched = /^#([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(normalized);
  if (!matched) return null;
  return {
    r: Number.parseInt(matched[1], 16),
    g: Number.parseInt(matched[2], 16),
    b: Number.parseInt(matched[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function mixHex(primary: string, secondary: string, ratio: number): string {
  const a = hexToRgb(primary);
  const b = hexToRgb(secondary);
  if (!a || !b) return normalizeHex(primary);
  const t = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    a.r * (1 - t) + b.r * t,
    a.g * (1 - t) + b.g * t,
    a.b * (1 - t) + b.b * t,
  );
}

function shadowToCss(shadow: PersonalityShadow): string {
  const { blur, spread, offsetY, opacity, tint } = shadow;
  if (blur === 0 && spread === 0 && offsetY === 0 && opacity === 0) {
    return "none";
  }

  const base = `rgba(0, 0, 0, ${opacity})`;
  if (tint) {
    return `0 ${offsetY}px ${blur}px ${spread}px ${tint}, 0 ${offsetY}px ${Math.round(blur * 0.5)}px ${spread}px ${base}`;
  }
  return `0 ${offsetY}px ${blur}px ${spread}px ${base}`;
}

export function resolveTestimonialStyle(input: ResolveTestimonialStyleInput): TestimonialVisualStyle {
  const mode = input.mode ?? input.fallbackMode;
  const accent = normalizeHex(input.accent);
  const personality = input.personality ?? DEFAULT_PERSONALITY;
  const personalityStyle = getStyleForPersonality(personality) ?? getStyleForPersonality(DEFAULT_PERSONALITY);
  const dark = mode === "dark";

  if (!input.isLoggedIn) {
    return {
      ...DEFAULT_STYLE,
      tier: "anonymous",
      mode,
      personality,
      accent,
      canvasBackground: input.fallbackBackground,
      textColor: dark ? DARK_TEXT : LIGHT_TEXT,
      mutedTextColor: dark ? "rgba(248, 250, 252, 0.74)" : "rgba(15, 23, 42, 0.72)",
      avatarRingColor: dark ? "rgba(248, 250, 252, 0.26)" : "rgba(148, 163, 184, 0.34)",
    };
  }

  if (!input.isBrandUser) {
    return {
      ...DEFAULT_STYLE,
      tier: "default",
      mode,
      personality: DEFAULT_PERSONALITY,
      accent,
      canvasBackground: NEUTRAL_SOLID_BY_MODE[mode],
      textColor: dark ? DARK_TEXT : LIGHT_TEXT,
      mutedTextColor: dark ? "rgba(248, 250, 252, 0.72)" : "rgba(15, 23, 42, 0.70)",
      starColor: dark ? "#FBBF24" : "#D97706",
      quoteMarkColor: dark ? "rgba(248, 250, 252, 0.18)" : "rgba(15, 23, 42, 0.15)",
      avatarRingColor: dark ? "rgba(248, 250, 252, 0.26)" : "rgba(15, 23, 42, 0.20)",
      authorPlateBackground: dark
        ? "linear-gradient(135deg, rgba(30, 41, 59, 0.72) 0%, rgba(15, 23, 42, 0.62) 100%)"
        : "linear-gradient(135deg, rgba(241, 245, 249, 0.88) 0%, rgba(255, 255, 255, 0.72) 100%)",
      authorPlateBorder: dark ? "rgba(248, 250, 252, 0.26)" : "rgba(15, 23, 42, 0.20)",
      authorPlateShadow: dark
        ? "0 3px 10px rgba(2, 6, 23, 0.28), 0 1px 4px rgba(2, 6, 23, 0.20)"
        : "0 2px 8px rgba(15, 23, 42, 0.10), 0 1px 3px rgba(15, 23, 42, 0.06)",
      cardBackground: dark ? "rgba(15, 23, 42, 0.34)" : "rgba(255, 255, 255, 0.50)",
      cardBorder: dark ? "rgba(248, 250, 252, 0.16)" : "rgba(15, 23, 42, 0.14)",
      cardRadius: 14,
      cardShadow: dark ? "0 10px 30px rgba(2, 6, 23, 0.35)" : "0 8px 24px rgba(15, 23, 42, 0.12)",
      texture: "none",
      textureIntensity: 0,
      showDecorativeBlobs: false,
    };
  }

  const style = {
    ...DEFAULT_STYLE,
    tier: "brand" as const,
    mode,
    personality,
    accent,
    textColor: dark ? DARK_TEXT : LIGHT_TEXT,
    mutedTextColor: dark ? "rgba(248, 250, 252, 0.78)" : "rgba(15, 23, 42, 0.76)",
    starColor: dark ? mixHex(accent, "#FCD34D", 0.45) : mixHex(accent, "#B45309", 0.20),
    quoteMarkColor: dark ? hexToRgba(accent, 0.30) : hexToRgba(accent, 0.24),
    avatarRingColor: dark ? hexToRgba(accent, 0.42) : hexToRgba(accent, 0.28),
    authorPlateBackground: dark
      ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)} 0%, rgba(2, 6, 23, 0.68) 100%)`
      : `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, rgba(248, 250, 252, 0.92) 100%)`,
    authorPlateBorder: dark ? hexToRgba(accent, 0.42) : hexToRgba(accent, 0.28),
    authorPlateShadow: dark
      ? `0 3px 10px ${hexToRgba(accent, 0.18)}, 0 1px 4px rgba(2, 6, 23, 0.24)`
      : `0 2px 8px ${hexToRgba(accent, 0.12)}, 0 1px 3px rgba(15, 23, 42, 0.06)`,
    cardBackground: dark ? "rgba(2, 6, 23, 0.48)" : "rgba(255, 255, 255, 0.76)",
    cardBorder: dark ? hexToRgba(accent, 0.34) : hexToRgba(accent, 0.24),
    cardRadius: personalityStyle?.cornerRadius ?? 12,
    cardShadow: personalityStyle ? shadowToCss(personalityStyle.shadow) : DEFAULT_STYLE.cardShadow,
    texture:
      personalityStyle?.texture === "grain"
        ? "grain"
        : personalityStyle?.texture === "scanlines"
          ? "scanlines"
          : "none",
    textureIntensity: personalityStyle?.textureIntensity ?? 0.4,
    showDecorativeBlobs: false,
    blobPrimary: dark ? hexToRgba(accent, 0.28) : hexToRgba(accent, 0.24),
    blobSecondary: dark ? "rgba(148, 163, 184, 0.20)" : "rgba(148, 163, 184, 0.22)",
    canvasBackground: dark
      ? `linear-gradient(150deg, ${mixHex(accent, "#020617", 0.86)} 0%, #050816 46%, ${mixHex(accent, "#0B1120", 0.72)} 100%)`
      : `linear-gradient(150deg, ${mixHex(accent, "#FFFFFF", 0.86)} 0%, #F8FAFC 52%, ${mixHex(accent, "#E2E8F0", 0.68)} 100%)`,
  };

  switch (personality) {
    case "hipster":
      return {
        ...style,
        canvasBackground: dark
          ? `linear-gradient(140deg, ${mixHex(accent, "#24180B", 0.74)} 0%, #1B120B 48%, ${mixHex(accent, "#2A1A0E", 0.66)} 100%)`
          : `linear-gradient(140deg, ${mixHex(accent, "#FFF7ED", 0.64)} 0%, #FEF3E2 50%, ${mixHex(accent, "#FED7AA", 0.60)} 100%)`,
        cardBackground: dark ? "rgba(28, 19, 12, 0.62)" : "rgba(255, 250, 240, 0.84)",
        cardBorder: dark ? "rgba(245, 158, 11, 0.32)" : "rgba(180, 83, 9, 0.24)",
        avatarRingColor: dark ? "rgba(245, 158, 11, 0.42)" : "rgba(180, 83, 9, 0.32)",
        authorPlateBackground: dark
          ? "linear-gradient(135deg, rgba(54, 34, 18, 0.76) 0%, rgba(28, 19, 12, 0.86) 100%)"
          : "linear-gradient(135deg, rgba(254, 243, 226, 0.92) 0%, rgba(255, 250, 240, 0.96) 100%)",
        authorPlateBorder: dark ? "rgba(245, 158, 11, 0.42)" : "rgba(180, 83, 9, 0.32)",
        authorPlateShadow: dark
          ? "0 3px 10px rgba(120, 53, 15, 0.32), 0 1px 4px rgba(28, 19, 12, 0.40)"
          : "0 2px 8px rgba(180, 83, 9, 0.14), 0 1px 3px rgba(120, 53, 15, 0.10)",
        quoteMarkColor: dark ? "rgba(251, 191, 36, 0.30)" : "rgba(180, 83, 9, 0.22)",
        starColor: dark ? "#FCD34D" : "#B45309",
        texture: "grain",
        textureIntensity: 0.62,
        showDecorativeBlobs: true,
        blobPrimary: dark ? "rgba(245, 158, 11, 0.20)" : "rgba(245, 158, 11, 0.18)",
        blobSecondary: dark ? "rgba(180, 83, 9, 0.16)" : "rgba(120, 53, 15, 0.14)",
      };
    case "kawaii":
      return {
        ...style,
        cardRadius: Math.max(style.cardRadius, 26),
        canvasBackground: dark
          ? `radial-gradient(circle at 20% 22%, ${hexToRgba(mixHex(accent, "#FDBAFA", 0.44), 0.38)}, transparent 55%), radial-gradient(circle at 82% 78%, ${hexToRgba(mixHex(accent, "#FDE68A", 0.56), 0.28)}, transparent 52%), linear-gradient(150deg, #141028 0%, #1A1435 55%, #23194A 100%)`
          : `radial-gradient(circle at 18% 22%, ${hexToRgba(mixHex(accent, "#FDF2F8", 0.72), 0.85)}, transparent 56%), radial-gradient(circle at 82% 76%, ${hexToRgba(mixHex(accent, "#FEF9C3", 0.74), 0.74)}, transparent 54%), linear-gradient(150deg, #FFF7FB 0%, #FFF1F8 54%, #FDF4FF 100%)`,
        cardBackground: dark ? "rgba(32, 24, 58, 0.66)" : "rgba(255, 255, 255, 0.82)",
        cardBorder: dark ? "rgba(249, 168, 212, 0.42)" : "rgba(244, 114, 182, 0.28)",
        avatarRingColor: dark ? "rgba(249, 168, 212, 0.48)" : "rgba(244, 114, 182, 0.32)",
        quoteMarkColor: dark ? "rgba(249, 168, 212, 0.32)" : "rgba(236, 72, 153, 0.24)",
        starColor: dark ? "#FDE68A" : "#EC4899",
        authorPlateBackground: dark
          ? "linear-gradient(135deg, rgba(62, 48, 94, 0.82) 0%, rgba(42, 31, 74, 0.88) 100%)"
          : "linear-gradient(135deg, rgba(253, 242, 248, 0.96) 0%, rgba(255, 247, 252, 0.94) 100%)",
        authorPlateBorder: dark ? "rgba(249, 168, 212, 0.48)" : "rgba(244, 114, 182, 0.32)",
        authorPlateShadow: dark
          ? "0 4px 12px rgba(167, 139, 250, 0.22), 0 1px 4px rgba(42, 31, 74, 0.36)"
          : "0 2px 10px rgba(244, 114, 182, 0.16), 0 1px 4px rgba(236, 72, 153, 0.10)",
        texture: "none",
        showDecorativeBlobs: true,
        blobPrimary: dark ? "rgba(244, 114, 182, 0.20)" : "rgba(244, 114, 182, 0.18)",
        blobSecondary: dark ? "rgba(167, 139, 250, 0.18)" : "rgba(250, 204, 21, 0.16)",
      };
    case "hacker":
      return {
        ...style,
        cardRadius: Math.min(style.cardRadius, 6),
        canvasBackground:
          dark
            ? `linear-gradient(165deg, #020B09 0%, #03110E 48%, ${mixHex(accent, "#022C22", 0.74)} 100%)`
            : `linear-gradient(165deg, #EAFBF5 0%, #E2F7EF 50%, ${mixHex(accent, "#BBF7D0", 0.66)} 100%)`,
        cardBackground: dark ? "rgba(2, 13, 10, 0.82)" : "rgba(237, 255, 247, 0.82)",
        cardBorder: dark ? "rgba(74, 222, 128, 0.36)" : "rgba(22, 101, 52, 0.24)",
        textColor: dark ? "#DCFCE7" : "#052E16",
        mutedTextColor: dark ? "rgba(220, 252, 231, 0.76)" : "rgba(5, 46, 22, 0.70)",
        quoteMarkColor: dark ? "rgba(74, 222, 128, 0.26)" : "rgba(22, 163, 74, 0.24)",
        starColor: dark ? "#4ADE80" : "#15803D",
        avatarRingColor: dark ? "rgba(74, 222, 128, 0.38)" : "rgba(22, 101, 52, 0.28)",
        authorPlateBackground: dark
          ? "linear-gradient(135deg, rgba(6, 44, 32, 0.78) 0%, rgba(3, 26, 20, 0.84) 100%)"
          : "linear-gradient(135deg, rgba(220, 252, 231, 0.94) 0%, rgba(240, 253, 244, 0.92) 100%)",
        authorPlateBorder: dark ? "rgba(74, 222, 128, 0.38)" : "rgba(22, 101, 52, 0.28)",
        authorPlateShadow: dark
          ? "0 2px 8px rgba(74, 222, 128, 0.20), 0 1px 3px rgba(3, 26, 20, 0.48)"
          : "0 2px 8px rgba(22, 163, 74, 0.14), 0 1px 3px rgba(22, 101, 52, 0.12)",
        texture: "scanlines",
        textureIntensity: 0.45,
        showDecorativeBlobs: false,
      };
    case "founder":
    default:
      return {
        ...style,
        cardRadius: Math.max(style.cardRadius, 10),
        cardBorder: dark ? hexToRgba(accent, 0.28) : "rgba(15, 23, 42, 0.10)",
        texture: "none",
        textureIntensity: 0,
        showDecorativeBlobs: false,
      };
  }
}
