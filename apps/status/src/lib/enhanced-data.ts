import { TimeWindow, formatRelativeTime } from "./status-dashboard";
import { formatCountWithGrowth, formatLatestFeedback } from "./display";
import { SentryStats, getSentryStatsForGrowth } from "./sentry-client";

export type UmamiStatsResponse = {
  pageviews?: number | { value?: number };
  visitors?: number | { value?: number };
};

export interface EnhancedUmamiData {
  pageviews: number;
  visitors: number;
  pageviewsGrowth: string;
  visitorsGrowth: string;
}

export interface EnhancedFeedbackData {
  count: number;
  latestDisplay: string;
}

export interface EnhancedUserData {
  newCount: number;
  totalCount: number;
  growth: string;
  activeCount: number;
  activeGrowth: string;
  activeRate: string;
}

export interface EnhancedSentryData {
  errorCount: number;
  errorCountGrowth: string;
  uniqueIssues: number;
  errorRate: number;
  topIssues: Array<{
    title: string;
    count: number;
    level: string;
  }>;
  hasData: boolean;
}

export async function getEnhancedUmamiData(
  currentWindow: TimeWindow, 
  previousWindow: TimeWindow,
  fetchUmamiStats: (options: any) => Promise<UmamiStatsResponse>
): Promise<EnhancedUmamiData> {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    return {
      pageviews: 0,
      visitors: 0,
      pageviewsGrowth: "",
      visitorsGrowth: ""
    };
  }

  try {
    // Fetch current period data
    const currentStats = await fetchUmamiStats({ 
      apiKey, 
      websiteId, 
      window: currentWindow 
    });
    
    // Fetch previous period data for comparison
    const previousStats = await fetchUmamiStats({ 
      apiKey, 
      websiteId, 
      window: previousWindow 
    });

    const currentPageviews = normalizeUmamiValue(currentStats.pageviews);
    const currentVisitors = normalizeUmamiValue(currentStats.visitors);
    const previousPageviews = normalizeUmamiValue(previousStats.pageviews);
    const previousVisitors = normalizeUmamiValue(previousStats.visitors);

    return {
      pageviews: currentPageviews,
      visitors: currentVisitors,
      pageviewsGrowth: formatCountWithGrowth(currentPageviews, previousPageviews),
      visitorsGrowth: formatCountWithGrowth(currentVisitors, previousVisitors)
    };
  } catch (error) {
    return {
      pageviews: 0,
      visitors: 0,
      pageviewsGrowth: "",
      visitorsGrowth: ""
    };
  }
}

export function getEnhancedFeedbackData(
  summary: { count: number; latest: any },
  window: { start: Date }
): EnhancedFeedbackData {
  if (summary.count === 0) {
    return {
      count: 0,
      latestDisplay: "   No new messages"
    };
  }

  const latestTimestamp = summary.latest
    ? formatRelativeTime(new Date(summary.latest.created_at))
    : "unknown";

  const latestSubject = summary.latest?.subject ?? null;

  return {
    count: summary.count,
    latestDisplay: formatLatestFeedback(latestSubject, latestTimestamp)
  };
}

export function getEnhancedUserData(
  currentNewCount: number,
  totalCount: number,
  previousNewCount: number,
  currentActiveCount: number,
  previousActiveCount: number
): EnhancedUserData {
  return {
    newCount: currentNewCount,
    totalCount,
    growth: formatCountWithGrowth(currentNewCount, previousNewCount),
    activeCount: currentActiveCount,
    activeGrowth: formatCountWithGrowth(currentActiveCount, previousActiveCount),
    activeRate: formatPercent(totalCount === 0 ? 0 : currentActiveCount / totalCount),
  };
}

export async function getEnhancedSentryData(
  currentWindow: TimeWindow,
  previousWindow: TimeWindow
): Promise<EnhancedSentryData> {
  const apiKey = process.env.SENTRY_API_KEY;
  const organization = process.env.SENTRY_ORGANIZATION;
  const project = process.env.SENTRY_PROJECT;

  if (!apiKey || !organization || !project) {
    return {
      errorCount: 0,
      errorCountGrowth: "",
      uniqueIssues: 0,
      errorRate: 0,
      topIssues: [],
      hasData: false,
    };
  }

  try {
    const { current, previous } = await getSentryStatsForGrowth(
      currentWindow,
      previousWindow,
      { apiKey, organization, project }
    );

    return {
      errorCount: current.errorCount,
      errorCountGrowth: formatCountWithGrowth(current.errorCount, previous.errorCount),
      uniqueIssues: current.uniqueIssues,
      errorRate: current.errorRate,
      topIssues: current.topIssues.map(issue => ({
        title: issue.title,
        count: issue.count,
        level: issue.level,
      })),
      hasData: true,
    };
  } catch (error) {
    return {
      errorCount: 0,
      errorCountGrowth: "",
      uniqueIssues: 0,
      errorRate: 0,
      topIssues: [],
      hasData: false,
    };
  }
}

function normalizeUmamiValue(value: UmamiStatsResponse[keyof UmamiStatsResponse]): number {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "value" in value) {
    return value.value ?? 0;
  }

  return 0;
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
