import { describe, it, expect } from "vitest";
import { deserializeEditorState } from "@/domain/memory/config-loader";
import type { MemoryConfiguration } from "@/domain/memory/types";

describe("deserializeEditorState", () => {
  const mockMemoryConfig: MemoryConfiguration = {
    version: 1,
    layoutId: "classic",
    variant: "default",
    orientation: "desktop",
    screenshotPath: "user-123/item-456.png",
    config: {
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
    },
    renderingFlags: {
      aspectLocked: false,
      screenshotZoom: 1,
    },
  };

  it("should deserialize all required fields correctly", () => {
    const result = deserializeEditorState(mockMemoryConfig);

    expect(result.config).toEqual(mockMemoryConfig.config);
    expect(result.orientation).toBe("desktop");
    expect(result.screenshotZoom).toBe(1);
  });

  it("should extract gradient as screenshotGradient when background is gradient", () => {
    const gradientConfig: MemoryConfiguration = {
      ...mockMemoryConfig,
      config: {
        ...mockMemoryConfig.config,
        background: {
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
        },
      },
    };

    const result = deserializeEditorState(gradientConfig);

    expect(result.screenshotGradient).not.toBeNull();
    expect(result.screenshotGradient?.type).toBe("gradient");
    expect(result.screenshotGradient?.value).toBe("custom");
  });

  it("should set screenshotGradient to null when background is not gradient", () => {
    const result = deserializeEditorState(mockMemoryConfig);

    expect(result.screenshotGradient).toBeNull();
  });

  it("should restore mobile orientation correctly", () => {
    const mobileConfig: MemoryConfiguration = {
      ...mockMemoryConfig,
      orientation: "mobile",
      renderingFlags: {
        aspectLocked: true,
        screenshotZoom: 1.5,
      },
    };

    const result = deserializeEditorState(mobileConfig);

    expect(result.orientation).toBe("mobile");
    expect(result.screenshotZoom).toBe(1.5);
  });

  it("should preserve the complete config object", () => {
    const complexConfig: MemoryConfiguration = {
      ...mockMemoryConfig,
      config: {
        ...mockMemoryConfig.config,
        fontStyle: "terminal",
        background: {
          type: "gradient",
          value: "custom",
          customGradient: {
            type: "radial",
            stops: [
              { color: "#000000", position: 0 },
              { color: "#ffffff", position: 100 },
            ],
          },
        },
      },
    };

    const result = deserializeEditorState(complexConfig);

    expect(result.config.fontStyle).toBe("terminal");
    expect(result.config.background.type).toBe("gradient");
    expect(result.config.background.value).toBe("custom");
  });

  it("should handle different zoom levels correctly", () => {
    const zoomConfig: MemoryConfiguration = {
      ...mockMemoryConfig,
      renderingFlags: {
        aspectLocked: false,
        screenshotZoom: 0.5,
      },
    };

    const result = deserializeEditorState(zoomConfig);

    expect(result.screenshotZoom).toBe(0.5);
  });

  it("should work with minimal gradient configuration", () => {
    const minimalGradient: MemoryConfiguration = {
      ...mockMemoryConfig,
      config: {
        ...mockMemoryConfig.config,
        background: {
          type: "gradient",
          value: "preset-1",
        },
      },
    };

    const result = deserializeEditorState(minimalGradient);

    expect(result.screenshotGradient).not.toBeNull();
    expect(result.screenshotGradient?.type).toBe("gradient");
    expect(result.screenshotGradient?.value).toBe("preset-1");
  });

  it("should handle roundtrip serialization-deserialization", () => {
    // Simulate serializing and then deserializing
    const originalState = {
      config: mockMemoryConfig.config,
      orientation: mockMemoryConfig.orientation,
      screenshotZoom: mockMemoryConfig.renderingFlags.screenshotZoom,
    };

    const deserialized = deserializeEditorState(mockMemoryConfig);

    expect(deserialized.config).toEqual(originalState.config);
    expect(deserialized.orientation).toEqual(originalState.orientation);
    expect(deserialized.screenshotZoom).toEqual(originalState.screenshotZoom);
  });
});
