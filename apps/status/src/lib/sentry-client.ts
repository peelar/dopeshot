import { TimeWindow } from "./status-dashboard";

export interface SentryIssue {
  id: string;
  title: string;
  count: number;
  level: "error" | "warning" | "info" | "debug";
  firstSeen: string;
  lastSeen: string;
}

export interface SentryStats {
  errorCount: number;
  transactionCount: number;
  uniqueIssues: number;
  errorRate: number;
  topIssues: SentryIssue[];
}

export interface SentryProjectStats {
  stats: {
    "24h": Array<[timestamp: number, count: number]>;
  };
}

export interface SentryOrganizationStats {
  received: number;
  rejected: number;
  blacklisted: number;
}

/**
 * Fetches error statistics from Sentry API for the given time window
 */
export async function getSentryStats(
  timeWindow: TimeWindow,
  options: {
    apiKey: string;
    organization: string;
    project: string;
  }
): Promise<SentryStats> {
  const { apiKey, organization, project } = options;
  const start = Math.floor(timeWindow.start.getTime() / 1000);
  const end = Math.floor(timeWindow.end.getTime() / 1000);

  try {
    // Fetch issues from Sentry
    const issuesUrl = `https://sentry.io/api/0/projects/${organization}/${project}/issues/?statsPeriod=24h`;
    const issuesResponse = await fetch(issuesUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!issuesResponse.ok) {
      throw new Error(`Sentry API error: ${issuesResponse.status} ${issuesResponse.statusText}`);
    }

    const issues = await issuesResponse.json() as Array<{
      id: string;
      title: string;
      count: string;
      level: string;
      firstSeen: string;
      lastSeen: string;
    }>;

    // Calculate total error count and get top issues
    const errorCount = issues.reduce((sum, issue) => sum + parseInt(issue.count || "0", 10), 0);
    const uniqueIssues = issues.length;
    
    const topIssues = issues
      .sort((a, b) => parseInt(b.count || "0", 10) - parseInt(a.count || "0", 10))
      .slice(0, 3)
      .map(issue => ({
        id: issue.id,
        title: issue.title,
        count: parseInt(issue.count || "0", 10),
        level: (issue.level || "error") as "error" | "warning" | "info" | "debug",
        firstSeen: issue.firstSeen,
        lastSeen: issue.lastSeen,
      }));

    // Fetch transaction stats (if available)
    let transactionCount = 0;
    try {
      const statsUrl = `https://sentry.io/api/0/projects/${organization}/${project}/stats/?stat=generated&since=${start}&until=${end}&resolution=1h`;
      const statsResponse = await fetch(statsUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json() as SentryProjectStats;
        transactionCount = stats.stats["24h"].reduce((sum, [, count]) => sum + count, 0);
      }
    } catch (statsError) {
      // Silently fail for transaction stats as they might not be available
      console.debug("Failed to fetch transaction stats:", statsError);
    }

    // Calculate error rate (errors per transaction)
    const errorRate = transactionCount > 0 ? (errorCount / transactionCount) * 100 : 0;

    return {
      errorCount,
      transactionCount,
      uniqueIssues,
      errorRate,
      topIssues,
    };
  } catch (error) {
    console.error("Failed to fetch Sentry stats:", error);
    return {
      errorCount: 0,
      transactionCount: 0,
      uniqueIssues: 0,
      errorRate: 0,
      topIssues: [],
    };
  }
}

/**
 * Fetches Sentry stats for growth comparison between two time windows
 */
export async function getSentryStatsForGrowth(
  currentWindow: TimeWindow,
  previousWindow: TimeWindow,
  options: {
    apiKey: string;
    organization: string;
    project: string;
  }
): Promise<{
  current: SentryStats;
  previous: SentryStats;
}> {
  const [current, previous] = await Promise.all([
    getSentryStats(currentWindow, options),
    getSentryStats(previousWindow, options),
  ]);

  return { current, previous };
}