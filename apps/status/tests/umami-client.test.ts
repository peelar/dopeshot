import { buildUmamiStatsRequest } from "../src/lib/umami-client";

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
});
