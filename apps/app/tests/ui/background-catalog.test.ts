import { describe, expect, it } from "vitest";
import { getCatalogBackgrounds } from "@/domain/backgrounds/catalog";

describe("static background catalog", () => {
  it("returns an empty published catalog until assets are snapshotted", () => {
    expect(getCatalogBackgrounds()).toEqual([]);
    expect(getCatalogBackgrounds("founder")).toEqual([]);
  });
});
