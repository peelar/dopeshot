import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import {
  configAtom,
  assetsAtom,
  hasCustomScreenshotAtom,
  orientationAtom,
} from "@/hooks/atoms";
import { getEmptyCanvasConfig } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

// Mock the lazy-loaded player wrapper module
vi.mock("@/remotion/player-wrapper", () => ({
  default: (props: { inputProps: Record<string, unknown>; compositionWidth: number; compositionHeight: number }) => (
    <div
      data-testid="remotion-player"
      data-screenshot-url={props.inputProps.screenshotUrl as string}
      data-variant={props.inputProps.variant as string}
      data-width={props.compositionWidth}
      data-height={props.compositionHeight}
    >
      Remotion Player
    </div>
  ),
}));

vi.mock("remotion", () => ({
  AbsoluteFill: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Img: ({ src }: { src: string }) => <img src={src} alt="" />,
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 150, id: "test" }),
  spring: () => 0,
  interpolate: () => 0,
}));

import { VideoPreview } from "@/app/(playground)/_components/video-preview";

const testScreenshot: Asset = {
  id: "test-screenshot-id",
  projectId: "test-project",
  userId: "test-user",
  name: "test.png",
  url: "data:image/png;base64,test-data",
  kind: "screenshot",
  createdAt: new Date().toISOString(),
  colorPalette: {
    dominant: "rgb(30 41 59)",
    accent: "rgb(100 116 139)",
  },
  metadata: {
    width: 1280,
    height: 720,
    aspectRatio: 16 / 9,
    orientation: "landscape",
  },
};

function renderWithStore(
  ui: React.ReactElement,
  options?: { assets?: Asset[]; layoutId?: string; variant?: string; orientation?: "mobile" | "desktop" },
) {
  const store = createStore();
  const config = getEmptyCanvasConfig();
  const { assets = [], layoutId, variant, orientation = "desktop" } = options ?? {};

  store.set(orientationAtom, orientation);

  if (assets.length > 0) {
    store.set(assetsAtom, assets);
    store.set(hasCustomScreenshotAtom, true);
    store.set(configAtom, {
      ...config,
      ...(layoutId && { layoutId }),
      ...(variant && { variant }),
      assets: {
        ...config.assets,
        screenshot: assets[0].id,
      },
    });
  }

  return render(<Provider store={store}>{ui}</Provider>);
}

afterEach(() => {
  cleanup();
});

describe("VideoPreview", () => {
  it("shows empty state when no screenshot is uploaded", () => {
    renderWithStore(<VideoPreview />);
    expect(screen.getByText("Upload a screenshot to preview video")).toBeInTheDocument();
  });

  it("renders the Remotion player when a screenshot is available", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, { assets: [testScreenshot] });
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toBeInTheDocument();
  });

  it("passes screenshot URL to player input props", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, { assets: [testScreenshot] });
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toHaveAttribute("data-screenshot-url", testScreenshot.url);
  });

  it("uses desktop export dimensions (1920x1080) for desktop orientation", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, { assets: [testScreenshot], orientation: "desktop" });
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toHaveAttribute("data-width", "1920");
    expect(player).toHaveAttribute("data-height", "1080");
  });

  it("uses mobile export dimensions (1080x1920) for mobile orientation", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, { assets: [testScreenshot], orientation: "mobile" });
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toHaveAttribute("data-width", "1080");
    expect(player).toHaveAttribute("data-height", "1920");
  });

  it("passes variant to player input props", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, {
        assets: [testScreenshot],
        layoutId: "popup-gradient-left",
        variant: "left",
      });
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toHaveAttribute("data-variant", "left");
  });
});
