export type NotionRequestConfig = {
  url: string;
  headers: Record<string, string>;
  method: "POST" | "PATCH";
  body: string;
};

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export type RoadmapStatus =
  | "To Refine"
  | "Ready"
  | "In Progress"
  | "Done";

export type RoadmapItem = {
  id: string;
  title: string;
  status: RoadmapStatus | string;
  lastEdited: string;
};

export function buildRoadmapQueryRequest(options: {
  apiKey: string;
  databaseId: string;
  statuses: string[];
  doneSince?: Date;
}): NotionRequestConfig {
  const { apiKey, databaseId, statuses, doneSince } = options;

  const statusFilters = statuses
    .filter((s) => s !== "Done")
    .map((status) => ({
      property: "Status",
      status: { equals: status },
    }));

  if (statuses.includes("Done") && doneSince) {
    statusFilters.push({
      property: "Status",
      status: { equals: "Done" },
    } as any);
  }

  const filter =
    statusFilters.length === 1
      ? statusFilters[0]
      : { or: statusFilters };

  return {
    url: `${NOTION_API_BASE}/databases/${databaseId}/query`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      filter,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      page_size: 100,
    }),
  };
}

export function parseRoadmapResults(results: any[]): RoadmapItem[] {
  return results.map((page) => {
    const titleProp = Object.values(page.properties).find(
      (p: any) => p.type === "title"
    ) as any;

    const title =
      titleProp?.title?.map((t: any) => t.plain_text).join("") ||
      "(untitled)";

    const statusProp = page.properties?.Status;
    const status = statusProp?.status?.name || "Unknown";

    return {
      id: page.id,
      title,
      status,
      lastEdited: page.last_edited_time,
    };
  });
}

function notionHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export function buildUpdateStatusRequest(
  apiKey: string,
  pageId: string,
  newStatus: RoadmapStatus
): NotionRequestConfig {
  return {
    url: `${NOTION_API_BASE}/pages/${pageId}`,
    headers: notionHeaders(apiKey),
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        Status: { status: { name: newStatus } },
      },
    }),
  };
}

export function buildCreateItemRequest(
  apiKey: string,
  databaseId: string,
  title: string,
  status: RoadmapStatus
): NotionRequestConfig {
  return {
    url: `${NOTION_API_BASE}/pages`,
    headers: notionHeaders(apiKey),
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: title } }],
        },
        Status: { status: { name: status } },
      },
    }),
  };
}

export function buildAppendDescriptionRequest(
  apiKey: string,
  pageId: string,
  text: string
): NotionRequestConfig {
  return {
    url: `${NOTION_API_BASE}/blocks/${pageId}/children`,
    headers: notionHeaders(apiKey),
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: text } }],
          },
        },
      ],
    }),
  };
}
