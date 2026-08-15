import { describe, expect, it } from "vitest";
import { getCatalogBackgrounds } from "@/domain/backgrounds/catalog";

describe("static background catalog", () => {
  it("serves curated backgrounds for each personality", () => {
    const all = getCatalogBackgrounds();
    expect(all).toHaveLength(16);
    expect(all.every((item) => item.status === "published")).toBe(true);
    expect(all.every((item) => item.previewUrl?.startsWith("/backgrounds/catalog/curated-"))).toBe(
      true,
    );

    for (const personality of ["hipster", "founder", "hacker", "kawaii"]) {
      const items = getCatalogBackgrounds(personality);
      expect(items).toHaveLength(4);
      expect(items.every((item) => item.personality === personality)).toBe(true);
    }
  });
});
