import pc from "picocolors";

// Icons for different metrics
export const ICONS = {
  analytics: "📈",
  traffic: "🌐", 
  feedback: "💬",
  users: "👥",
  growthUp: "↑",
  growthDown: "↓",
  growthFlat: "→",
  latest: "🕐",
} as const;

// Simple color scheme - minimal and clean
export const COLORS = {
  primary: pc.cyan,
  secondary: pc.gray,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  muted: pc.dim,
} as const;

export function formatHeader(title: string, duration: string): string {
  return `${ICONS.analytics} ${COLORS.primary(title)} (${duration})`;
}

export function formatMetric(label: string, value: string): string {
  return `   ${COLORS.secondary(label)}: ${value}`;
}

export function formatGrowthIndicator(current: number, previous: number): string {
  if (previous === 0) return "";
  
  const percentage = Math.round(((current - previous) / previous) * 100);
  
  if (percentage > 0) {
    return `${COLORS.success(ICONS.growthUp)} ${COLORS.success(`+${percentage}%`)}`;
  } else if (percentage < 0) {
    return `${COLORS.error(ICONS.growthDown)} ${COLORS.error(`${percentage}%`)}`;
  } else {
    return `${COLORS.muted(ICONS.growthFlat)} ${COLORS.muted("0%")}`;
  }
}

export function formatCountWithGrowth(current: number, previous: number): string {
  const growth = formatGrowthIndicator(current, previous);
  const formattedCount = new Intl.NumberFormat("en-US").format(current);
  return `${formattedCount} ${growth}`.trim();
}

export function formatSection(title: string, lines: string[]): string {
  return `${title}\n${lines.join("\n")}`;
}

export function formatLatestFeedback(subject: string | null, timeAgo: string): string {
  const displaySubject = subject || "(no subject)";
  return `   ${ICONS.latest} Latest: "${COLORS.muted(displaySubject)}" (${timeAgo})`;
}