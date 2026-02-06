import { buildUmamiEventValuesRequest, buildUmamiStatsRequest } from "../src/lib/umami-client";

describe("umami client helpers", () => {
  it("builds cloud stats request with api key header", () => {
    const request = buildUmamiStatsRequest({
      apiKey: "cloud-key",
      websiteId: "site-123",
      startAt: 1000,
      endAt: 2000,
    });

    expect(request.url).toContain("https://api.umami.is/v1/websites/site-123/stats");
    expect(request.url).toContain("startAt=1000");
    expect(request.headers["x-umami-api-key"]).toBe("cloud-key");
  });

  it("builds event values request with event and property filters", () => {
    const request = buildUmamiEventValuesRequest({
      apiKey: "cloud-key",
      websiteId: "site-123",
      startAt: 1000,
      endAt: 2000,
      eventName: "export_completed",
      propertyName: "export_type",
    });

    expect(request.url).toContain("https://api.umami.is/v1/websites/site-123/event-data/values");
    expect(request.url).toContain("startAt=1000");
    expect(request.url).toContain("endAt=2000");
    expect(request.url).toContain("eventName=export_completed");
    expect(request.url).toContain("propertyName=export_type");
    expect(request.headers["x-umami-api-key"]).toBe("cloud-key");
  });
});
