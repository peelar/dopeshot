import { describe, it, expect } from "vitest";
import { computeConfigHash } from "@/domain/memory/config-hash";
import type { MemoryConfiguration } from "@/domain/memory/types";

describe("computeConfigHash", () => {
  const baseConfig: MemoryConfiguration = {
    version: 1,
    layoutId: "classic",
    variant: "default",
    orientation: "desktop",
    screenshotPath: "user-123/item-456.png",
    config: {
      layoutId: "classic",
      variant: "default",
      background: {
        type: "gradient",
        value: "custom",
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
      assets: {},
    },
    renderingFlags: {
      aspectLocked: false,
      screenshotZoom: 1,
    },
  };

  it("should generate a 32-character hex hash", () => {
    const hash = computeConfigHash(baseConfig);

    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should generate deterministic hashes for the same configuration", () => {
    const hash1 = computeConfigHash(baseConfig);
    const hash2 = computeConfigHash(baseConfig);

    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different configurations", () => {
    const config2: MemoryConfiguration = {
      ...baseConfig,
      orientation: "mobile",
    };

    const hash1 = computeConfigHash(baseConfig);
    const hash2 = computeConfigHash(config2);

    expect(hash1).not.toBe(hash2);
  });

  it("should generate the same hash regardless of key order", () => {
    // Create a config with keys in different order
    const reorderedConfig = {
      orientation: baseConfig.orientation,
      version: baseConfig.version,
      screenshotPath: baseConfig.screenshotPath,
      renderingFlags: baseConfig.renderingFlags,
      layoutId: baseConfig.layoutId,
      variant: baseConfig.variant,
      config: baseConfig.config,
    } as MemoryConfiguration;

    const hash1 = computeConfigHash(baseConfig);
    const hash2 = computeConfigHash(reorderedConfig);

    expect(hash1).toBe(hash2);
  });

  it("should detect changes in nested configuration", () => {
    const config2: MemoryConfiguration = {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        fontStyle: "billboard",
      },
    };

    const hash1 = computeConfigHash(baseConfig);
    const hash2 = computeConfigHash(config2);

    expect(hash1).not.toBe(hash2);
  });

  it("should detect changes in rendering flags", () => {
    const config2: MemoryConfiguration = {
      ...baseConfig,
      renderingFlags: {
        aspectLocked: true,
        screenshotZoom: 1.5,
      },
    };

    const hash1 = computeConfigHash(baseConfig);
    const hash2 = computeConfigHash(config2);

    expect(hash1).not.toBe(hash2);
  });

  it("should handle complex nested objects consistently", () => {
    const complexConfig: MemoryConfiguration = {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        background: {
          type: "gradient",
          value: "custom",
          customGradient: {
            type: "linear",
            angle: 45,
            stops: [
              { color: "#ff0000", position: 0 },
              { color: "#00ff00", position: 50 },
              { color: "#0000ff", position: 100 },
            ],
          },
        },
      },
    };

    const hash1 = computeConfigHash(complexConfig);
    const hash2 = computeConfigHash(complexConfig);

    expect(hash1).toBe(hash2);
  });
});
