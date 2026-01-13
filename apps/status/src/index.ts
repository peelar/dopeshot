import "dotenv/config";

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import { Resend } from "resend";
import {
  createTimeWindow,
  formatNumber,
  formatRelativeTime,
  summarizeFeedback,
} from "./lib/status-dashboard";
import { buildUmamiStatsRequest } from "./lib/umami-client";
import { ICONS, formatHeader } from "./lib/display";
import { 
  getEnhancedUmamiData, 
  getEnhancedFeedbackData, 
  getEnhancedUserData,
  EnhancedUmamiData,
  EnhancedFeedbackData,
  EnhancedUserData
} from "./lib/enhanced-data";

const STATS_FILE = resolve(process.cwd(), "stats.json");

type StatsData = {
  users: Array<{ id: string; createdAt: string }>;
};

function loadStats(): StatsData {
  if (!existsSync(STATS_FILE)) {
    return { users: [] };
  }
  const content = readFileSync(STATS_FILE, "utf-8");
  return JSON.parse(content) as StatsData;
}

function saveStats(data: StatsData): void {
  writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

type UmamiStatsResponse = {
  pageviews?: number | { value?: number };
  visitors?: number | { value?: number };
};

type ResendEmail = {
  id: string;
  subject: string | null;
  created_at: string;
  to: string[];
};


const DEFAULT_SINCE_HOURS = 24;
const FEEDBACK_SUBJECT_PREFIX = "New Feedback:";

const args = process.argv.slice(2);
const sinceHours = parseSinceHours(args) ?? DEFAULT_SINCE_HOURS;
const debugEnabled = isDebugEnabled(args);
const timeWindow = createTimeWindow(sinceHours);

// Create previous period window for growth comparison
const previousWindow = createTimeWindow(sinceHours * 2, new Date(timeWindow.start.getTime() - 1));

// Get enhanced data with growth metrics
const [umamiData, feedbackData, userData] = await Promise.all([
  getEnhancedUmamiData(timeWindow, previousWindow, fetchUmamiStats),
  getEnhancedFeedbackDataWithGrowth(timeWindow),
  getEnhancedUserDataWithGrowth(timeWindow)
]);

// Format the new delightful output
const output = formatEnhancedOutput({
  duration: `${sinceHours}h`,
  umamiData,
  feedbackData,
  userData
});

console.log(output);

function parseSinceHours(args: string[]): number | null {
  const optionIndex = args.findIndex((arg) => arg.startsWith("--since-hours"));
  if (optionIndex === -1) {
    return null;
  }

  const option = args[optionIndex];
  const inlineValue = option.includes("=") ? option.split("=")[1] : null;
  const value = inlineValue ?? args[optionIndex + 1];
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isDebugEnabled(args: string[]): boolean {
  return args.includes("--debug") || process.env.STATUS_DEBUG === "1";
}

function logDebug(message: string, payload?: Record<string, unknown>): void {
  if (!debugEnabled) {
    return;
  }

  if (payload) {
    console.info(`[status:debug] ${message}`, payload);
  } else {
    console.info(`[status:debug] ${message}`);
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


async function getUmamiLine(window: { start: Date; end: Date }): Promise<string> {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    return "Umami: missing UMAMI_API_KEY or UMAMI_WEBSITE_ID";
  }

  try {
    const stats = await fetchUmamiStats({ apiKey, websiteId, window });
    const pageviews = normalizeUmamiValue(stats.pageviews);
    const visitors = normalizeUmamiValue(stats.visitors);

    return `Umami: ${formatNumber(pageviews)} views • ${formatNumber(visitors)} visitors`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return `Umami: error (${message})`;
  }
}

async function fetchUmamiStats(options: {
  apiKey: string;
  websiteId: string;
  window: { start: Date; end: Date };
}): Promise<UmamiStatsResponse> {
  const { apiKey, websiteId, window } = options;
  const startAt = window.start.getTime();
  const endAt = window.end.getTime();
  const request = buildUmamiStatsRequest({
    apiKey,
    websiteId,
    startAt,
    endAt,
  });

  logDebug("Umami request", {
    baseUrl: "https://api.umami.is/v1",
    websiteId,
    startAt,
    endAt,
  });

  const response = await fetch(request.url, {
    headers: request.headers,
  });

  if (!response.ok) {
    const body = await response.text();
    logDebug("Umami response", {
      status: response.status,
      statusText: response.statusText,
      body,
    });
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }

  const data = (await response.json()) as UmamiStatsResponse;
  logDebug("Umami response", { status: response.status, statusText: response.statusText });
  return data;
}

async function getFeedbackLine(window: { start: Date }): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return "Feedback: missing RESEND_API_KEY";
  }

  try {
    const resend = new Resend(apiKey);
    const feedbackEmail = process.env.FEEDBACK_EMAIL || "feedback@dopeshot.io";
    const emails = await listFeedbackEmails(resend);

    const summary = summarizeFeedback(emails, {
      since: window.start,
      recipient: feedbackEmail,
      subjectPrefix: FEEDBACK_SUBJECT_PREFIX,
    });

    if (summary.count === 0) {
      return "Feedback: no new messages";
    }

    const latestTimestamp = summary.latest
      ? formatRelativeTime(new Date(summary.latest.created_at))
      : "unknown";

    const latestSubject = summary.latest?.subject ?? "(no subject)";

    return `Feedback: ${summary.count} new • latest ${latestTimestamp} (${latestSubject})`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return `Feedback: error (${message})`;
  }
}

async function listFeedbackEmails(resend: Resend): Promise<ResendEmail[]> {
  const emails: ResendEmail[] = [];
  let after: string | undefined;
  let pages = 0;

  while (pages < 5) {
    const response = await resend.emails.list({
      limit: 100,
      ...(after ? { after } : {}),
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const payload = response.data;
    emails.push(...payload.data);

    if (!payload.has_more) {
      break;
    }

    after = payload.data[payload.data.length - 1]?.id;
    if (!after) {
      break;
    }

    pages += 1;
  }

  return emails;
}

async function getEnhancedFeedbackDataWithGrowth(window: { start: Date }): Promise<EnhancedFeedbackData> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      count: 0,
      latestDisplay: "   Feedback: missing RESEND_API_KEY"
    };
  }

  try {
    const resend = new Resend(apiKey);
    const feedbackEmail = process.env.FEEDBACK_EMAIL || "feedback@dopeshot.io";
    const emails = await listFeedbackEmails(resend);

    const summary = summarizeFeedback(emails, {
      since: window.start,
      recipient: feedbackEmail,
      subjectPrefix: FEEDBACK_SUBJECT_PREFIX,
    });

    return getEnhancedFeedbackData(summary, window);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      count: 0,
      latestDisplay: `   Feedback: error (${message})`
    };
  }
}

async function getEnhancedUserDataWithGrowth(window: { start: Date }): Promise<EnhancedUserData> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      newCount: 0,
      totalCount: 0,
      growth: ""
    };
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Count total users
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM "user"'
    );
    const totalCount = parseInt(totalResult.rows[0]?.count ?? "0", 10);

    // Count new users in current period
    const newResult = await pool.query(
      'SELECT COUNT(*) as count FROM "user" WHERE created_at >= $1',
      [window.start.toISOString()]
    );
    const newCount = parseInt(newResult.rows[0]?.count ?? "0", 10);

    // Count new users in previous period for growth comparison
    const previousStart = new Date(window.start.getTime() - (timeWindow.end.getTime() - timeWindow.start.getTime()));
    const previousNewResult = await pool.query(
      'SELECT COUNT(*) as count FROM "user" WHERE created_at >= $1 AND created_at < $2',
      [previousStart.toISOString(), window.start.toISOString()]
    );
    const previousNewCount = parseInt(previousNewResult.rows[0]?.count ?? "0", 10);

    return getEnhancedUserData(newCount, totalCount, previousNewCount);
  } catch (error) {
    const newCount = 0;
    const totalCount = 0;
    return getEnhancedUserData(newCount, totalCount, 0);
  } finally {
    await pool.end();
  }
}

function formatEnhancedOutput(data: {
  duration: string;
  umamiData: EnhancedUmamiData;
  feedbackData: EnhancedFeedbackData;
  userData: EnhancedUserData;
}): string {
  const { duration, umamiData, feedbackData, userData } = data;
  
  const lines: string[] = [];
  
  // Header
  lines.push(formatHeader("dopeshot analytics", duration));
  lines.push("");
  
  // Traffic section
  lines.push(`${ICONS.traffic} Traffic`);
  lines.push(`   Pageviews: ${umamiData.pageviewsGrowth || umamiData.pageviews}`);
  lines.push(`   Visitors: ${umamiData.visitorsGrowth || umamiData.visitors}`);
  lines.push("");
  
  // Feedback section
  lines.push(`${ICONS.feedback} Feedback`);
  if (feedbackData.count === 0) {
    lines.push("   No new messages");
  } else {
    lines.push(`   ${feedbackData.count} new messages`);
    lines.push(feedbackData.latestDisplay);
  }
  lines.push("");
  
  // Users section
  lines.push(`${ICONS.users} Users`);
  lines.push(`   New signups: ${userData.growth || userData.newCount}`);
  lines.push(`   Total users: ${userData.totalCount}`);
  
  return lines.join("\n");
}
