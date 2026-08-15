/**
 * Test: Design button visibility on mobile
 *
 * Validates that the Design button is hidden when there's nothing to customize
 * on mobile (e.g., Peak Left/Right layouts with no text).
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { MobileActions } from "@/components/layout/mobile-actions";
import { configAtom, orientationAtom } from "@/hooks/atoms";
import type { LayoutConfig } from "@/domain/layout/types";

// Test helper to create a layout config
function createPeakLeftConfig(): LayoutConfig {
  return {
    layoutId: "popup-gradient-left",
    variant: "left",
    text: {
      title: "",
      subtitle: "",
    },
    colors: {
      background: "indigo-50",
      text: "slate-50",
      accent: "violet-400",
    },
    background: {
      type: "gradient",
      value: "custom",
      customGradient: {
        type: "linear",
        stops: [
          { color: "#ec4899", position: 0 },
          { color: "#8b5cf6", position: 100 },
        ],
        angle: 90,
        colorSpace: "oklch",
      },
      grainEnabled: true,
      patternMode: "auto",
    },
    assets: {
      screenshot: undefined,
      logo: undefined,
      background: undefined,
    },
    screenshotShadow: "medium",
    screenshotFrame: {
      preset: "soft-glass",
      canvasMode: "adaptive",
      lockedAspectRatio: 16 / 9,
      shadowEnabled: true,
      shape: "rounded",
    },
  };
}

function createPeakCenterConfig(): LayoutConfig {
  return {
    ...createPeakLeftConfig(),
    layoutId: "popup-gradient-center",
    variant: "center",
  };
}

describe("MobileActions - Design button visibility", () => {
  afterEach(() => {
    cleanup();
  });

  const mockProps = {
    isOpen: false,
    onOpenChange: () => {},
    onUploadClick: () => {},
    isProcessingUpload: false,
    showUploadButton: false,
    onUploadAsset: () => {},
  };

  it("should hide Design button for Peak Left on mobile (no text to edit)", () => {
    const store = createStore();
    store.set(configAtom, createPeakLeftConfig());
    store.set(orientationAtom, "mobile");

    render(
      <Provider store={store}>
        <MobileActions {...mockProps} />
      </Provider>
    );

    // Design button should not be in the document
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });

  it("should hide Design button for Peak Right on mobile (no text to edit)", () => {
    const rightConfig = { ...createPeakLeftConfig(), layoutId: "popup-gradient-right", variant: "right" };
    const store = createStore();
    store.set(configAtom, rightConfig);
    store.set(orientationAtom, "mobile");

    render(
      <Provider store={store}>
        <MobileActions {...mockProps} />
      </Provider>
    );

    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });

  it("should show Design button for Peak Center on mobile (has text to edit)", () => {
    const store = createStore();
    store.set(configAtom, createPeakCenterConfig());
    store.set(orientationAtom, "mobile");

    render(
      <Provider store={store}>
        <MobileActions {...mockProps} />
      </Provider>
    );

    // Design button should be visible
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("should show Design button for Peak Left on desktop (text is visible)", () => {
    const store = createStore();
    store.set(configAtom, createPeakLeftConfig());
    store.set(orientationAtom, "desktop");

    render(
      <Provider store={store}>
        <MobileActions {...mockProps} />
      </Provider>
    );

    // Design button should be visible on desktop
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("should adjust Upload button width when Design button is hidden", () => {
    const store = createStore();
    store.set(configAtom, createPeakLeftConfig());
    store.set(orientationAtom, "mobile");

    render(
      <Provider store={store}>
        <MobileActions {...mockProps} showUploadButton={true} />
      </Provider>
    );

    // Upload button should exist
    const uploadButton = screen.getByText("Upload");
    expect(uploadButton).toBeInTheDocument();

    // Design button should not exist
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });
});
