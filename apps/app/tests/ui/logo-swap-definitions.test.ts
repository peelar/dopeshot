import { describe, it, expect } from "vitest";
import {
  getLayoutDefinition,
  getLayoutFormat,
  getLayoutsForFormat,
} from "@/domain/layout-def/definitions";

describe("Logo Swap layout definitions", () => {
  describe("getLayoutFormat", () => {
    it("returns 'logo-swap' for logo-swap layout", () => {
      expect(getLayoutFormat("logo-swap")).toBe("logo-swap");
    });
  });

  describe("getLayoutsForFormat", () => {
    it("returns only logo-swap layouts for 'logo-swap' format", () => {
      const layouts = getLayoutsForFormat("logo-swap");
      expect(layouts.length).toBe(1);
      expect(layouts.every((l) => l.format === "logo-swap")).toBe(true);
    });

    it("logo-swap layout ID is 'logo-swap'", () => {
      const layouts = getLayoutsForFormat("logo-swap");
      const ids = layouts.map((l) => l.id);
      expect(ids).toContain("logo-swap");
    });
  });

  describe("logo-swap createConfig", () => {
    it("produces a valid LayoutConfig", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def).toBeDefined();

      const config = def!.createConfig();
      expect(config.layoutId).toBe("logo-swap");
      expect(config.variant).toBe("default");
      expect(config.text).toBeDefined();
      expect(config.colors).toBeDefined();
      expect(config.background).toBeDefined();
      expect(config.assets).toBeDefined();
    });

    it("includes default logo swap settings", () => {
      const def = getLayoutDefinition("logo-swap");
      const config = def!.createConfig();

      expect(config.layoutSpecificSettings?.logoSwap).toBeDefined();
      expect(config.layoutSpecificSettings?.logoSwap?.separatorStyle).toBe(
        "dash",
      );
      expect(
        config.layoutSpecificSettings?.logoSwap?.leftLogoAssetId,
      ).toBeUndefined();
      expect(
        config.layoutSpecificSettings?.logoSwap?.rightLogoAssetId,
      ).toBeUndefined();
    });
  });

  describe("logo-swap capabilities", () => {
    it("has screenshot hidden", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.screenshot).toBe("hidden");
    });

    it("has logo hidden (uses own dual-logo UI)", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.logo).toBe("hidden");
    });

    it("has headline hidden", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.text.headline).toBe("hidden");
    });

    it("has subtitle hidden", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.text.subtitle).toBe("hidden");
    });

    it("does not support typography", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.typography).toBe(false);
    });

    it("supports only desktop orientation", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.supportedOrientations).toEqual(["desktop"]);
    });

    it("has locked canvas behavior", () => {
      const def = getLayoutDefinition("logo-swap");
      expect(def?.capabilities.canvasBehavior).toBe("locked");
    });
  });
});
