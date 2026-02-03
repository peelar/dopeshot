export type HueBucket =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"
  | "neutral";

export type Brightness = "dark" | "medium" | "light";
export type AccentStrength = "vibrant" | "muted" | "grayscale";

export type ColorSignature = {
  dominantHue: HueBucket;
  dominantHueAngle: number;
  accentHue?: HueBucket;
  accentHueAngle?: number;
  brightness: Brightness;
  accentStrength: AccentStrength;
  dominantColor: string;
  accentColor?: string;
};

type ScaleKey = "soft" | "base" | "rich" | "deep";
type ColorScale = Record<ScaleKey, string>;
type ScaleName = keyof typeof COLOR_SCALES;

const COLOR_SCALES = {
  slate: { soft: "#e2e8f0", base: "#64748b", rich: "#475569", deep: "#1e293b" },
  zinc: { soft: "#e4e4e7", base: "#71717a", rich: "#52525b", deep: "#27272a" },
  stone: { soft: "#e7e5e4", base: "#78716c", rich: "#57534e", deep: "#292524" },
  red: { soft: "#fecaca", base: "#ef4444", rich: "#dc2626", deep: "#991b1b" },
  rose: { soft: "#fecdd3", base: "#f43f5e", rich: "#e11d48", deep: "#9f1239" },
  orange: { soft: "#fed7aa", base: "#f97316", rich: "#ea580c", deep: "#9a3412" },
  amber: { soft: "#fde68a", base: "#f59e0b", rich: "#d97706", deep: "#92400e" },
  yellow: { soft: "#fef08a", base: "#eab308", rich: "#ca8a04", deep: "#854d0e" },
  lime: { soft: "#d9f99d", base: "#84cc16", rich: "#65a30d", deep: "#3f6212" },
  green: { soft: "#bbf7d0", base: "#22c55e", rich: "#16a34a", deep: "#166534" },
  emerald: { soft: "#a7f3d0", base: "#10b981", rich: "#059669", deep: "#065f46" },
  teal: { soft: "#99f6e4", base: "#14b8a6", rich: "#0d9488", deep: "#115e59" },
  cyan: { soft: "#a5f3fc", base: "#06b6d4", rich: "#0891b2", deep: "#155e75" },
  sky: { soft: "#bae6fd", base: "#0ea5e9", rich: "#0284c7", deep: "#075985" },
  blue: { soft: "#bfdbfe", base: "#3b82f6", rich: "#2563eb", deep: "#1e40af" },
  indigo: { soft: "#c7d2fe", base: "#6366f1", rich: "#4f46e5", deep: "#3730a3" },
  violet: { soft: "#ddd6fe", base: "#8b5cf6", rich: "#7c3aed", deep: "#5b21b6" },
  purple: { soft: "#e9d5ff", base: "#a855f7", rich: "#9333ea", deep: "#6b21a8" },
  fuchsia: { soft: "#f5d0fe", base: "#d946ef", rich: "#c026d3", deep: "#86198f" },
  pink: { soft: "#fbcfe8", base: "#ec4899", rich: "#db2777", deep: "#9d174d" },
} satisfies Record<string, ColorScale>;

type HueVariant = {
  anchor: number;
  primary: ScaleName;
  secondary: ScaleName;
  accent: ScaleName;
};

const HUE_VARIANTS: Record<HueBucket, HueVariant[]> = {
  red: [
    { anchor: 350, primary: "red", secondary: "rose", accent: "amber" },
    { anchor: 330, primary: "rose", secondary: "pink", accent: "orange" },
  ],
  orange: [
    { anchor: 28, primary: "orange", secondary: "amber", accent: "rose" },
    { anchor: 42, primary: "amber", secondary: "yellow", accent: "orange" },
  ],
  yellow: [
    { anchor: 55, primary: "yellow", secondary: "amber", accent: "lime" },
    { anchor: 70, primary: "amber", secondary: "lime", accent: "yellow" },
  ],
  green: [
    { anchor: 125, primary: "green", secondary: "emerald", accent: "lime" },
    { anchor: 150, primary: "emerald", secondary: "teal", accent: "green" },
  ],
  teal: [
    { anchor: 175, primary: "teal", secondary: "cyan", accent: "emerald" },
    { anchor: 195, primary: "cyan", secondary: "sky", accent: "teal" },
  ],
  blue: [
    { anchor: 210, primary: "sky", secondary: "blue", accent: "indigo" },
    { anchor: 235, primary: "blue", secondary: "indigo", accent: "sky" },
  ],
  purple: [
    { anchor: 270, primary: "violet", secondary: "purple", accent: "fuchsia" },
    { anchor: 290, primary: "purple", secondary: "fuchsia", accent: "violet" },
  ],
  pink: [
    { anchor: 310, primary: "fuchsia", secondary: "pink", accent: "rose" },
    { anchor: 330, primary: "pink", secondary: "rose", accent: "fuchsia" },
  ],
  neutral: [{ anchor: 0, primary: "slate", secondary: "zinc", accent: "stone" }],
};

type StepMap = {
  primary: ScaleKey;
  secondary: ScaleKey;
  tertiary: ScaleKey;
  glow: ScaleKey;
  neutral: ScaleKey;
};

const STEP_BY_BRIGHTNESS: Record<Brightness, StepMap> = {
  light: {
    primary: "soft",
    secondary: "base",
    tertiary: "rich",
    glow: "soft",
    neutral: "soft",
  },
  medium: {
    primary: "base",
    secondary: "rich",
    tertiary: "soft",
    glow: "base",
    neutral: "base",
  },
  dark: {
    primary: "rich",
    secondary: "deep",
    tertiary: "base",
    glow: "base",
    neutral: "rich",
  },
};

const WARM_BUCKETS = new Set<HueBucket>(["red", "orange", "yellow", "pink"]);
const HUE_BUCKETS: HueBucket[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
];

export type GradientPalette = {
  id: string;
  hue: HueBucket;
  brightness: Brightness;
  strength: AccentStrength;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    glow: string;
    neutral: string;
  };
};

export type SecondaryHue = {
  hue: HueBucket;
  angle: number;
};

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function normalizeHue(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function hueToBucket(angle: number): HueBucket {
  const hue = normalizeHue(angle);
  if (hue >= 345 || hue < 15) return "red";
  if (hue < 45) return "orange";
  if (hue < 75) return "yellow";
  if (hue < 165) return "green";
  if (hue < 195) return "teal";
  if (hue < 255) return "blue";
  if (hue < 285) return "purple";
  if (hue < 345) return "pink";
  return "neutral";
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1_000_000;
  }
  return hash;
}

function fallbackAccentBucket(signature: ColorSignature): HueBucket {
  const seed = `${signature.dominantColor}:${signature.brightness}:${signature.accentStrength}`;
  const hash = hashString(seed);
  const index = hash % HUE_BUCKETS.length;
  return HUE_BUCKETS[index] ?? "blue";
}

function resolveVariant(signature: ColorSignature): HueVariant {
  const variants = HUE_VARIANTS[signature.dominantHue] ?? HUE_VARIANTS.neutral;
  if (!Number.isFinite(signature.dominantHueAngle)) {
    return variants[0] ?? HUE_VARIANTS.neutral[0];
  }

  let best = variants[0] ?? HUE_VARIANTS.neutral[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const variant of variants) {
    const distance = hueDistance(signature.dominantHueAngle, variant.anchor);
    if (distance < bestDistance) {
      best = variant;
      bestDistance = distance;
    }
  }
  return best;
}

function pickScale(scale: ScaleName, step: ScaleKey): string {
  return COLOR_SCALES[scale][step];
}

function resolveSecondaryHue(signature: ColorSignature): { hue: HueBucket; angle: number } {
  const baseAngle = normalizeHue(signature.dominantHueAngle);
  const accentAngle = signature.accentHueAngle;
  if (
    signature.accentHue &&
    typeof accentAngle === "number" &&
    (signature.dominantHue === "neutral" || hueDistance(baseAngle, accentAngle) >= 35)
  ) {
    return { hue: signature.accentHue, angle: accentAngle };
  }

  if (signature.dominantHue === "neutral") {
    const fallbackHue = fallbackAccentBucket(signature);
    const anchor = HUE_VARIANTS[fallbackHue]?.[0]?.anchor ?? 0;
    return { hue: fallbackHue, angle: anchor };
  }

  const complementAngle = normalizeHue(baseAngle + 180);
  return { hue: hueToBucket(complementAngle), angle: complementAngle };
}

function uniqueByHueDistance(candidates: SecondaryHue[], threshold: number): SecondaryHue[] {
  const results: SecondaryHue[] = [];
  for (const candidate of candidates) {
    if (
      results.some((existing) => hueDistance(existing.angle, candidate.angle) < threshold)
    ) {
      continue;
    }
    results.push(candidate);
  }
  return results;
}

export function getSecondaryHueCandidates(signature: ColorSignature): SecondaryHue[] {
  const base = resolveSecondaryHue(signature);
  const baseAngle = (() => {
    if (signature.dominantHue !== "neutral" && Number.isFinite(signature.dominantHueAngle)) {
      return signature.dominantHueAngle;
    }
    if (typeof signature.accentHueAngle === "number") {
      return signature.accentHueAngle;
    }
    return base.angle;
  })();

  const altAngles = [
    normalizeHue(baseAngle + 140),
    normalizeHue(baseAngle + 220),
  ];

  const altCandidates: SecondaryHue[] = altAngles.map((angle) => ({
    hue: hueToBucket(angle),
    angle,
  }));

  let candidates = uniqueByHueDistance([base, ...altCandidates], 24);

  if (candidates.length < 3) {
    const fallbackAngles = [
      normalizeHue(baseAngle + 90),
      normalizeHue(baseAngle + 270),
    ].map((angle) => ({ hue: hueToBucket(angle), angle }));
    candidates = uniqueByHueDistance([...candidates, ...fallbackAngles], 24);
  }

  return candidates.slice(0, 3);
}

function resolveAccentVariant(signature: ColorSignature): HueVariant | null {
  if (signature.accentHue) {
    return resolveVariant({
      ...signature,
      dominantHue: signature.accentHue,
      dominantHueAngle:
        signature.accentHueAngle ??
        HUE_VARIANTS[signature.accentHue]?.[0]?.anchor ??
        0,
    });
  }

  const fallback = fallbackAccentBucket(signature);
  return resolveVariant({
    ...signature,
    dominantHue: fallback,
    dominantHueAngle: HUE_VARIANTS[fallback]?.[0]?.anchor ?? 0,
  });
}

export function createComplementSignature(signature: ColorSignature): ColorSignature {
  const baseAngle = signature.dominantHue !== "neutral" || !signature.accentHueAngle
    ? signature.dominantHueAngle
    : signature.accentHueAngle;
  const complementAngle = normalizeHue(baseAngle + 180);
  const complementHue = hueToBucket(complementAngle);

  return {
    ...signature,
    dominantHue: complementHue,
    dominantHueAngle: complementAngle,
    accentHue: signature.dominantHue,
    accentHueAngle: signature.dominantHueAngle,
    accentStrength: signature.accentStrength === "vibrant" ? "muted" : signature.accentStrength,
  };
}

export function buildGradientPalette(
  signature: ColorSignature,
  secondaryOverride?: SecondaryHue,
): GradientPalette {
  const steps = STEP_BY_BRIGHTNESS[signature.brightness];
  const variant = resolveVariant(signature);
  const secondaryHue = secondaryOverride ?? resolveSecondaryHue(signature);
  const secondaryVariant = resolveVariant({
    ...signature,
    dominantHue: secondaryHue.hue,
    dominantHueAngle: secondaryHue.angle,
  });
  const neutralScale: ScaleName = WARM_BUCKETS.has(signature.dominantHue) ? "stone" : "slate";

  if (signature.accentStrength === "grayscale") {
    const accentVariant = resolveAccentVariant(signature) ?? secondaryVariant;
    return {
      id: `neutral-${signature.brightness}`,
      hue: "neutral",
      brightness: signature.brightness,
      strength: signature.accentStrength,
      colors: {
        primary: pickScale("slate", steps.primary),
        secondary: pickScale(accentVariant.primary, "base"),
        tertiary: pickScale(accentVariant.secondary, "soft"),
        glow: pickScale(accentVariant.accent, "base"),
        neutral: pickScale("slate", steps.neutral),
      },
    };
  }

  const accentIsMuted = signature.accentStrength !== "vibrant";
  const accentSecondaryStep = accentIsMuted ? "soft" : (signature.brightness === "dark" ? "rich" : steps.secondary);
  const accentTertiaryStep = accentIsMuted ? "soft" : (signature.brightness === "dark" ? "base" : steps.tertiary);
  const accentGlowStep = accentIsMuted ? "base" : (signature.brightness === "dark" ? "base" : steps.glow);

  return {
    id: `${variant.primary}-${secondaryVariant.primary}-${signature.brightness}-${signature.accentStrength}`,
    hue: signature.dominantHue,
    brightness: signature.brightness,
    strength: signature.accentStrength,
    colors: {
      primary: pickScale(variant.primary, steps.primary),
      secondary: pickScale(secondaryVariant.primary, accentSecondaryStep),
      tertiary: pickScale(secondaryVariant.secondary, accentTertiaryStep),
      glow: pickScale(secondaryVariant.accent, accentGlowStep),
      neutral: pickScale(neutralScale, steps.neutral),
    },
  };
}
