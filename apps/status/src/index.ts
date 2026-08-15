import "dotenv/config";

import { Resend } from "resend";
import {
  createTimeWindow,
  formatNumber,
  formatRelativeTime,
  summarizeFeedback,
} from "./lib/status-dashboard";
import { buildUmamiEventValuesRequest, buildUmamiStatsRequest } from "./lib/umami-client";
import { ICONS, formatHeader } from "./lib/display";
import { 
  getEnhancedUmamiData, 
  getEnhancedFeedbackData, 
  EnhancedUmamiData,
  EnhancedFeedbackData,
} from "./lib/enhanced-data";

type UmamiStatsResponse = {
  pageviews?: number | { value?: number };
  visitors?: number | { value?: number };
};

type UmamiEventValue = {
  value?: string | null;
  total?: number;
};

type ExportData = {
  total: number;
  testimonial: number;
  screenshot: number;
};

type ResendEmail = {
  id: string;
  subject: string | null;
  created_at: string;
  to: string[];
};


const DEFAULT_SINCE_HOURS = 168;
const FEEDBACK_SUBJECT_PREFIX = "New Feedback:";

const args = process.argv.slice(2);
const sinceHours = parseSinceHours(args) ?? DEFAULT_SINCE_HOURS;
const debugEnabled = isDebugEnabled(args);
const timeWindow = createTimeWindow(sinceHours);

// Create previous period window for growth comparison
const previousWindow = createTimeWindow(sinceHours * 2, new Date(timeWindow.start.getTime() - 1));

const lastWeekWindow = createTimeWindow(168);

const [umamiData, feedbackData, exportData] = await Promise.all([
  getEnhancedUmamiData(timeWindow, previousWindow, fetchUmamiStats),
  getEnhancedFeedbackDataWithGrowth(timeWindow),
  getExportData(lastWeekWindow),
]);

// Format the new delightful output
const output = formatEnhancedOutput({
  duration: `${sinceHours}h`,
  umamiData,
  feedbackData,
  exportData,
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

async function getExportData(window: { start: Date; end: Date }): Promise<ExportData> {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    return {
      total: 0,
      testimonial: 0,
      screenshot: 0,
    };
  }

  try {
    const countsFromExportType = await getExportCountsByProperty({
      apiKey,
      websiteId,
      window,
      propertyName: "export_type",
    });

    if (countsFromExportType.total > 0) {
      return countsFromExportType;
    }

    // Backfill from older events that only used the "format" property.
    return await getExportCountsByProperty({
      apiKey,
      websiteId,
      window,
      propertyName: "format",
    });
  } catch {
    return {
      total: 0,
      testimonial: 0,
      screenshot: 0,
    };
  }
}

async function getExportCountsByProperty(options: {
  apiKey: string;
  websiteId: string;
  window: { start: Date; end: Date };
  propertyName: "export_type" | "format";
}): Promise<ExportData> {
  const values = await fetchUmamiEventValuesWithFallback(options);
  return values.reduce<ExportData>(
    (acc, item) => {
      const value = (item.value ?? "").toLowerCase();
      const total = item.total ?? 0;
      acc.total += total;

      if (value === "testimonial") {
        acc.testimonial += total;
      } else if (value === "screenshot") {
        acc.screenshot += total;
      }

      return acc;
    },
    { total: 0, testimonial: 0, screenshot: 0 },
  );
}

async function fetchUmamiEventValuesWithFallback(options: {
  apiKey: string;
  websiteId: string;
  window: { start: Date; end: Date };
  propertyName: string;
}): Promise<UmamiEventValue[]> {
  try {
    return await fetchUmamiEventValues({ ...options, eventParamName: "eventName" });
  } catch {
    return fetchUmamiEventValues({ ...options, eventParamName: "event" });
  }
}

async function fetchUmamiEventValues(options: {
  apiKey: string;
  websiteId: string;
  window: { start: Date; end: Date };
  propertyName: string;
  eventParamName: "eventName" | "event";
}): Promise<UmamiEventValue[]> {
  const { apiKey, websiteId, window, propertyName, eventParamName } = options;

  const request = buildUmamiEventValuesRequest({
    apiKey,
    websiteId,
    startAt: window.start.getTime(),
    endAt: window.end.getTime(),
    eventName: "export_completed",
    propertyName,
  });

  const url = new URL(request.url);
  if (eventParamName === "event") {
    const eventName = url.searchParams.get("eventName");
    if (eventName) {
      url.searchParams.delete("eventName");
      url.searchParams.set("event", eventName);
    }
  }

  const response = await fetch(url.toString(), {
    headers: request.headers,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }

  return (await response.json()) as UmamiEventValue[];
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

function formatEnhancedOutput(data: {
  duration: string;
  umamiData: EnhancedUmamiData;
  feedbackData: EnhancedFeedbackData;
  exportData: ExportData;
}): string {
  const { duration, umamiData, feedbackData, exportData } = data;
  
  const lines: string[] = [];
  
  // Header
  lines.push(formatHeader("dopeshot analytics", duration));
  lines.push("");
  
  // Traffic section
  lines.push(`${ICONS.traffic} Traffic`);
  lines.push(`   Pageviews: ${umamiData.pageviewsGrowth || umamiData.pageviews}`);
  lines.push(
    `   Exports (7d): ${formatNumber(exportData.total)} total (testimonial: ${formatNumber(exportData.testimonial)}, screenshot: ${formatNumber(exportData.screenshot)})`,
  );
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
  return lines.join("\n");
}
