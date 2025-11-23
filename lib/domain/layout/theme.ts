/**
 * Maps fontSizeToken to Tailwind text-size classes.
 */
export function resolveFontSize(token: string): string {
  const map: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
  };
  return map[token] || "text-base";
}

/**
 * Maps fontWeightToken to Tailwind font-weight classes.
 */
export function resolveFontWeight(token: string): string {
  const map: Record<string, string> = {
    regular: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  return map[token] || "font-normal";
}

/**
 * Maps color tokens to Tailwind bg color classes (for backgrounds).
 * Note: This assumes standard Tailwind slate/zinc/etc. colors.
 * Complex mapping might be needed if we support arbitrary colors,
 * but for now we stick to Tailwind tokens.
 */
export function resolveBackgroundColor(token: string): string {
  // If it starts with a known prefix, assume it's a tailwind class suffix
  // e.g. "slate-900" -> "bg-slate-900"
  if (token.match(/^[a-z]+-\d+$/)) {
    return `bg-${token}`;
  }
  return "bg-slate-50"; // Default
}

/**
 * Maps color tokens to Tailwind text color classes.
 */
export function resolveTextColor(token: string): string {
  if (token.match(/^[a-z]+-\d+$/)) {
    return `text-${token}`;
  }
  return "text-slate-900"; // Default
}

/**
 * Maps shadowStyle enum to Tailwind shadow classes.
 */
export function resolveShadow(style: "soft" | "hard" | "none"): string {
  switch (style) {
    case "soft":
      return "shadow-lg shadow-black/10";
    case "hard":
      return "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]";
    case "none":
    default:
      return "shadow-none";
  }
}

/**
 * Maps borderRadiusPx to Tailwind rounded classes (approximate).
 */
export function resolveBorderRadius(px: number): string {
  if (px === 0) return "rounded-none";
  if (px <= 4) return "rounded-sm";
  if (px <= 8) return "rounded-md";
  if (px <= 12) return "rounded-lg";
  if (px <= 16) return "rounded-xl";
  if (px <= 24) return "rounded-2xl";
  return "rounded-3xl";
}

/**
 * Resolves horizontal alignment to flex/text classes.
 */
export function resolveHorizontalAlign(align: "left" | "center" | "right"): string {
  switch (align) {
    case "center":
      return "text-center items-center justify-center";
    case "right":
      return "text-right items-end justify-end";
    case "left":
    default:
      return "text-left items-start justify-start";
  }
}

/**
 * Resolves vertical alignment to flex classes.
 */
export function resolveVerticalAlign(align: "top" | "middle" | "bottom"): string {
  switch (align) {
    case "middle":
      return "justify-center";
    case "bottom":
      return "justify-end";
    case "top":
    default:
      return "justify-start";
  }
}
