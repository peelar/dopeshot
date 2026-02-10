import "dotenv/config";

import {
  buildRoadmapQueryRequest,
  parseRoadmapResults,
  type RoadmapItem,
} from "./lib/notion-client";
import { COLORS } from "./lib/display";
import pc from "picocolors";

const DONE_LOOKBACK_DAYS = 14;

const apiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_ROADMAP_DB_ID;

if (!apiKey || !databaseId) {
  console.log("Roadmap: missing NOTION_API_KEY or NOTION_ROADMAP_DB_ID");
  process.exit(0);
}

const doneSince = new Date();
doneSince.setDate(doneSince.getDate() - DONE_LOOKBACK_DAYS);

const items = await fetchRoadmap({ apiKey, databaseId, doneSince });

// Filter done items to only those completed in the last 2 weeks
const doneItems = items.filter(
  (i) => i.status === "Done" && new Date(i.lastEdited) >= doneSince
);
const activeItems = items.filter((i) => i.status !== "Done");

console.log(formatRoadmap(activeItems, doneItems));

async function fetchRoadmap(options: {
  apiKey: string;
  databaseId: string;
  doneSince: Date;
}): Promise<RoadmapItem[]> {
  const request = buildRoadmapQueryRequest({
    apiKey: options.apiKey,
    databaseId: options.databaseId,
    statuses: ["To Refine", "Ready", "In Progress", "Done"],
    doneSince: options.doneSince,
  });

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API error: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { results: any[] };
  return parseRoadmapResults(data.results);
}

function formatRoadmap(
  active: RoadmapItem[],
  done: RoadmapItem[]
): string {
  const columns = [
    { key: "In Progress", items: active.filter((i) => i.status === "In Progress") },
    { key: "Ready", items: active.filter((i) => i.status === "Ready") },
    { key: "To Refine", items: active.filter((i) => i.status === "To Refine") },
    { key: "Done (2w)", items: done },
  ];

  const allEmpty = columns.every((c) => c.items.length === 0);
  if (allEmpty) {
    return `📋 ${COLORS.primary("Roadmap")}\n   (empty)`;
  }

  // Only show columns that have items
  const visibleColumns = columns.filter((c) => c.items.length > 0);

  // ID prefix: 8-char truncated page ID + space
  const ID_PREFIX_LEN = 9; // "abcdef12 "

  // Calculate column widths: at least as wide as header, fit ID prefix + longest title
  const COL_PAD = 2;
  const colWidths = visibleColumns.map((col) => {
    const longest = col.items.reduce(
      (max, item) => Math.max(max, ID_PREFIX_LEN + item.title.length),
      0
    );
    return Math.max(col.key.length, longest) + COL_PAD;
  });

  const maxRows = Math.max(...visibleColumns.map((c) => c.items.length));

  const pad = (text: string, width: number) =>
    text + " ".repeat(Math.max(0, width - text.length));

  // Build header row
  const headerRow = visibleColumns
    .map((col, i) => pc.bold(pad(col.key, colWidths[i])))
    .join("│ ");

  // Separator
  const separator = colWidths.map((w) => "─".repeat(w)).join("┼─");

  // Data rows — each cell shows "abcdef12 Title" with the ID dimmed
  const dataRows: string[] = [];
  for (let r = 0; r < maxRows; r++) {
    const cells = visibleColumns.map((col, i) => {
      const item = col.items[r];
      if (!item) return pad("", colWidths[i]);
      const shortId = item.id.replace(/-/g, "").slice(0, 8);
      const text = `${shortId} ${item.title}`;
      const padded = pad(text, colWidths[i]);
      if (col.key === "Done (2w)") return COLORS.muted(padded);
      // Dim the ID portion, keep title normal
      return COLORS.muted(shortId) + " " + pad(item.title, colWidths[i] - ID_PREFIX_LEN);
    });
    dataRows.push(cells.join("│ "));
  }

  const lines = [
    `📋 ${COLORS.primary("Roadmap")}`,
    "",
    `   ${headerRow}`,
    `   ${separator}`,
    ...dataRows.map((row) => `   ${row}`),
  ];

  return lines.join("\n");
}
