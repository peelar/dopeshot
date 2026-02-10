import { describe, it, expect } from "vitest";
import {
  buildUpdateStatusRequest,
  buildCreateItemRequest,
  buildAppendDescriptionRequest,
} from "../src/lib/notion-client";

const API_KEY = "test-api-key";
const PAGE_ID = "abc12345-6789-0def-ghij-klmnopqrstuv";
const DATABASE_ID = "db-id-1234";

describe("buildUpdateStatusRequest", () => {
  it("returns a PATCH request to the pages endpoint", () => {
    const req = buildUpdateStatusRequest(API_KEY, PAGE_ID, "Ready");

    expect(req.method).toBe("PATCH");
    expect(req.url).toBe(`https://api.notion.com/v1/pages/${PAGE_ID}`);
  });

  it("includes auth and Notion version headers", () => {
    const req = buildUpdateStatusRequest(API_KEY, PAGE_ID, "Ready");

    expect(req.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(req.headers["Notion-Version"]).toBe("2022-06-28");
    expect(req.headers["Content-Type"]).toBe("application/json");
  });

  it("sets the Status property in the body", () => {
    const req = buildUpdateStatusRequest(API_KEY, PAGE_ID, "In Progress");
    const body = JSON.parse(req.body);

    expect(body).toEqual({
      properties: {
        Status: { status: { name: "In Progress" } },
      },
    });
  });
});

describe("buildCreateItemRequest", () => {
  it("returns a POST request to the pages endpoint", () => {
    const req = buildCreateItemRequest(
      API_KEY,
      DATABASE_ID,
      "New feature",
      "To Refine"
    );

    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://api.notion.com/v1/pages");
  });

  it("includes auth and Notion version headers", () => {
    const req = buildCreateItemRequest(
      API_KEY,
      DATABASE_ID,
      "New feature",
      "To Refine"
    );

    expect(req.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(req.headers["Notion-Version"]).toBe("2022-06-28");
  });

  it("sets parent database, title, and status in the body", () => {
    const req = buildCreateItemRequest(
      API_KEY,
      DATABASE_ID,
      "New feature",
      "Ready"
    );
    const body = JSON.parse(req.body);

    expect(body).toEqual({
      parent: { database_id: DATABASE_ID },
      properties: {
        Name: {
          title: [{ text: { content: "New feature" } }],
        },
        Status: { status: { name: "Ready" } },
      },
    });
  });
});

describe("buildAppendDescriptionRequest", () => {
  it("returns a PATCH request to the blocks children endpoint", () => {
    const req = buildAppendDescriptionRequest(API_KEY, PAGE_ID, "Some text");

    expect(req.method).toBe("PATCH");
    expect(req.url).toBe(
      `https://api.notion.com/v1/blocks/${PAGE_ID}/children`
    );
  });

  it("includes auth and Notion version headers", () => {
    const req = buildAppendDescriptionRequest(API_KEY, PAGE_ID, "Some text");

    expect(req.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(req.headers["Notion-Version"]).toBe("2022-06-28");
  });

  it("wraps text in a paragraph block", () => {
    const req = buildAppendDescriptionRequest(
      API_KEY,
      PAGE_ID,
      "Spec summary here"
    );
    const body = JSON.parse(req.body);

    expect(body).toEqual({
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: "Spec summary here" } },
            ],
          },
        },
      ],
    });
  });
});
