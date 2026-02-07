/**
 * Parse a tweet URL and extract the tweet ID.
 * Supports:
 * - https://twitter.com/user/status/1234567890
 * - https://x.com/user/status/1234567890
 * - https://mobile.twitter.com/user/status/1234567890
 * - Just the numeric ID itself
 */
export function parseTweetUrl(input: string): string | null {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace("www.", "");

    if (
      hostname !== "twitter.com" &&
      hostname !== "x.com" &&
      hostname !== "mobile.twitter.com"
    ) {
      return null;
    }

    const match = url.pathname.match(/\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Format a date string for display in the tweet card.
 * Example: "3:45 PM · Mar 15, 2024"
 */
export function formatTweetDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${time} · ${dateStr}`;
  } catch {
    return dateString;
  }
}

/**
 * Format a number for display (e.g., 1234 -> "1.2K")
 */
export function formatMetric(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}
