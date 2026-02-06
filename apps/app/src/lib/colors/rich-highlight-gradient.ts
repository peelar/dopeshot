const DEFAULT_ACCENT = "#6366F1";

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

function hexToRgb(hex?: string | null): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  const match = /^#([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(normalized);
  if (!match) {
    return { r: 99, g: 102, b: 241 };
  }
  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

function mixWithWhite(channel: number, ratio: number): number {
  return Math.round(channel * (1 - ratio) + 255 * ratio);
}

export function buildRichHighlightGradient(accent?: string | null): string {
  const { r, g, b } = hexToRgb(accent);
  const lightR = mixWithWhite(r, 0.22);
  const lightG = mixWithWhite(g, 0.22);
  const lightB = mixWithWhite(b, 0.22);

  return `linear-gradient(110deg, rgba(${r}, ${g}, ${b}, 0.34), rgba(${lightR}, ${lightG}, ${lightB}, 0.5))`;
}
