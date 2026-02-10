import "dotenv/config";

import {
  buildUpdateStatusRequest,
  buildCreateItemRequest,
  buildAppendDescriptionRequest,
  type NotionRequestConfig,
  type RoadmapStatus,
} from "./lib/notion-client";
import { execSync } from "node:child_process";
import pc from "picocolors";

const VALID_STATUSES: RoadmapStatus[] = [
  "To Refine",
  "Ready",
  "In Progress",
  "Done",
];

const apiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_ROADMAP_DB_ID;

if (!apiKey) {
  console.error("Missing NOTION_API_KEY");
  process.exit(1);
}

const [subcommand, ...args] = process.argv.slice(2);

switch (subcommand) {
  case "move":
    await handleMove(args);
    break;
  case "create":
    await handleCreate(args);
    break;
  case "describe":
    await handleDescribe(args);
    break;
  default:
    console.error(
      `Usage:\n  roadmap-write move <page_id> "<status>"\n  roadmap-write create "<title>" "<status>"\n  roadmap-write describe <page_id> "<text>"`
    );
    process.exit(1);
}

async function handleMove(args: string[]) {
  const [pageId, status] = args;
  if (!pageId || !status) {
    console.error('Usage: roadmap-write move <page_id> "<status>"');
    process.exit(1);
  }
  if (!VALID_STATUSES.includes(status as RoadmapStatus)) {
    console.error(
      `Invalid status "${status}". Valid: ${VALID_STATUSES.join(", ")}`
    );
    process.exit(1);
  }
  const request = buildUpdateStatusRequest(
    apiKey!,
    pageId,
    status as RoadmapStatus
  );
  await executeRequest(request);
  console.log(pc.green(`Moved ${pageId} → ${status}`));
  showRoadmap();
}

async function handleCreate(args: string[]) {
  const [title, status = "To Refine"] = args;
  if (!title) {
    console.error('Usage: roadmap-write create "<title>" ["<status>"]');
    process.exit(1);
  }
  if (!databaseId) {
    console.error("Missing NOTION_ROADMAP_DB_ID");
    process.exit(1);
  }
  if (!VALID_STATUSES.includes(status as RoadmapStatus)) {
    console.error(
      `Invalid status "${status}". Valid: ${VALID_STATUSES.join(", ")}`
    );
    process.exit(1);
  }
  const request = buildCreateItemRequest(
    apiKey!,
    databaseId,
    title,
    status as RoadmapStatus
  );
  await executeRequest(request);
  console.log(pc.green(`Created "${title}" in ${status}`));
  showRoadmap();
}

async function handleDescribe(args: string[]) {
  const [pageId, ...textParts] = args;
  const text = textParts.join(" ");
  if (!pageId || !text) {
    console.error('Usage: roadmap-write describe <page_id> "<text>"');
    process.exit(1);
  }
  const request = buildAppendDescriptionRequest(apiKey!, pageId, text);
  await executeRequest(request);
  console.log(pc.green(`Appended description to ${pageId}`));
}

async function executeRequest(request: NotionRequestConfig) {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Notion API error: ${response.status} ${body}`);
    process.exit(1);
  }

  return response.json();
}

function showRoadmap() {
  try {
    execSync("npx tsx src/roadmap.ts", {
      stdio: "inherit",
      cwd: new URL("..", import.meta.url).pathname,
    });
  } catch {
    // roadmap display is best-effort
  }
}
