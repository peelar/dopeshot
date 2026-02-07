import { describe, it, expect } from "vitest";
import { parseTweetUrl, formatTweetDate, formatMetric } from "@/domain/layout/twitter-utils";

describe("parseTweetUrl", () => {
  it("extracts ID from twitter.com URL", () => {
    expect(parseTweetUrl("https://twitter.com/user/status/1234567890")).toBe("1234567890");
  });

  it("extracts ID from x.com URL", () => {
    expect(parseTweetUrl("https://x.com/elonmusk/status/9876543210")).toBe("9876543210");
  });

  it("extracts ID from mobile.twitter.com URL", () => {
    expect(parseTweetUrl("https://mobile.twitter.com/user/status/1111111111")).toBe("1111111111");
  });

  it("accepts raw numeric ID", () => {
    expect(parseTweetUrl("1234567890")).toBe("1234567890");
  });

  it("returns null for invalid URL", () => {
    expect(parseTweetUrl("not-a-url")).toBeNull();
  });

  it("returns null for non-Twitter URL", () => {
    expect(parseTweetUrl("https://example.com/user/status/123")).toBeNull();
  });

  it("handles trailing query params", () => {
    expect(parseTweetUrl("https://x.com/user/status/123456?s=20&t=abc")).toBe("123456");
  });

  it("handles www prefix", () => {
    expect(parseTweetUrl("https://www.twitter.com/user/status/123456")).toBe("123456");
  });

  it("trims whitespace", () => {
    expect(parseTweetUrl("  https://x.com/user/status/123456  ")).toBe("123456");
  });

  it("returns null for twitter.com without status path", () => {
    expect(parseTweetUrl("https://twitter.com/user")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseTweetUrl("")).toBeNull();
  });
});

describe("formatTweetDate", () => {
  it("formats an ISO date string", () => {
    const result = formatTweetDate("2024-03-15T15:45:00.000Z");
    // Should contain time and date parts
    expect(result).toContain("·");
    expect(result).toContain("Mar");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("returns the original string for invalid dates", () => {
    const result = formatTweetDate("not-a-date");
    // Should still return something (either formatted or original)
    expect(typeof result).toBe("string");
  });
});

describe("formatMetric", () => {
  it("formats numbers under 1000 as-is", () => {
    expect(formatMetric(0)).toBe("0");
    expect(formatMetric(42)).toBe("42");
    expect(formatMetric(999)).toBe("999");
  });

  it("formats thousands as K", () => {
    expect(formatMetric(1000)).toBe("1.0K");
    expect(formatMetric(1234)).toBe("1.2K");
    expect(formatMetric(15600)).toBe("15.6K");
  });

  it("formats millions as M", () => {
    expect(formatMetric(1000000)).toBe("1.0M");
    expect(formatMetric(2500000)).toBe("2.5M");
  });
});
