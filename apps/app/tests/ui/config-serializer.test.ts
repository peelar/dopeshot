import { describe, it, expect } from "vitest";
import { serializeEditorState } from "@/domain/memory/config-serializer";
import type { LayoutConfig, BackgroundConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import type { Orientation } from "@/hooks/atoms";

describe("serializeEditorState", () => {
  const mockConfig: LayoutConfig = {
    layoutId: "classic",
    variant: "default",
    background: {
      type: "solid",
      value: "#ffffff",
    },
    fontStyle: "founder",
    text: {
      title: "Test Title",
      subtitle: "Test Subtitle",
    },
    colors: {
      background: "slate-50",
      text: "slate-900",
      accent: "indigo-400",
    },
    assets: {
      screenshot: "screenshot-1",
    },
    screenshotFrame: {
      canvasMode: "adaptive",
      preset: "soft-glass",
    },
  };

  const mockAssets: Asset[] = [
    {
      id: "screenshot-1",
      projectId: "project-1",
      userId: "user-1",
      name: "screenshot.png",
      kind: "screenshot",
      url: "https://example.com/screenshot.png",
      createdAt: new Date().toISOString(),
      metadata: {
        width: 1920,
        height: 1080,
        aspectRatio: 1920 / 1080,
      },
    },
  ];

  const mockScreenshotGradient: BackgroundConfig = {
    type: "gradient",
    value: "custom",
    customGradient: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#ff6b6b", position: 0 },
        { color: "#4ecdc4", position: 100 },
      ],
    },
  };

  it("should serialize all required fields correctly", () => {
    const result = serializeEditorState({
      config: mockConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "user-123/item-456.png",
    });

    expect(result.version).toBe(1);
    expect(result.layoutId).toBe("classic");
    expect(result.variant).toBe("default");
    expect(result.orientation).toBe("desktop");
    expect(result.screenshotPath).toBe("user-123/item-456.png");
    expect(result.renderingFlags.screenshotZoom).toBe(1);
  });

  it("should capture the original background when no screenshot gradient", () => {
    const result = serializeEditorState({
      config: mockConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    expect(result.config.background).toEqual({
      type: "solid",
      value: "#ffffff",
    });
  });

  it("should override background with screenshot gradient when present", () => {
    const result = serializeEditorState({
      config: mockConfig,
      assets: mockAssets,
      screenshotGradient: mockScreenshotGradient,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    expect(result.config.background).toEqual(mockScreenshotGradient);
    expect(result.config.background?.type).toBe("gradient");
  });

  it("should serialize mobile orientation correctly", () => {
    const result = serializeEditorState({
      config: mockConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "mobile",
      screenshotZoom: 1.2,
      screenshotPath: "test.png",
    });

    expect(result.orientation).toBe("mobile");
    expect(result.renderingFlags.screenshotZoom).toBe(1.2);
  });

  it("should capture aspectLocked=true when canvas mode is locked", () => {
    const lockedConfig: LayoutConfig = {
      ...mockConfig,
      screenshotFrame: {
        canvasMode: "locked",
        preset: "soft-glass",
        lockedAspectRatio: 16 / 9,
      },
    };

    const result = serializeEditorState({
      config: lockedConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    expect(result.renderingFlags.aspectLocked).toBe(true);
  });

  it("should capture aspectLocked=false when canvas mode is adaptive", () => {
    const adaptiveConfig: LayoutConfig = {
      ...mockConfig,
      screenshotFrame: {
        canvasMode: "adaptive",
        preset: "soft-glass",
      },
    };

    const result = serializeEditorState({
      config: adaptiveConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    expect(result.renderingFlags.aspectLocked).toBe(false);
  });

  it("should not mutate the original config object", () => {
    const originalBackground = { ...mockConfig.background };

    serializeEditorState({
      config: mockConfig,
      assets: mockAssets,
      screenshotGradient: mockScreenshotGradient,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    // Original config should remain unchanged
    expect(mockConfig.background).toEqual(originalBackground);
  });

  it("should handle different variants correctly", () => {
    const variantConfig: LayoutConfig = {
      ...mockConfig,
      variant: "minimal",
    };

    const result = serializeEditorState({
      config: variantConfig,
      assets: mockAssets,
      screenshotGradient: null,
      orientation: "desktop",
      screenshotZoom: 1,
      screenshotPath: "test.png",
    });

    expect(result.variant).toBe("minimal");
    expect(result.layoutId).toBe("classic");
  });
});
