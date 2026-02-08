import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import {
  configAtom,
  assetsAtom,
  hasCustomScreenshotAtom,
} from "@/hooks/atoms";
import { getEmptyCanvasConfig } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

// Mock the lazy-loaded player wrapper module
vi.mock("@/remotion/player-wrapper", () => ({
  default: (props: { inputProps: Record<string, unknown> }) => (
    <div data-testid="remotion-player" data-screenshot-url={props.inputProps.screenshotUrl as string}>
      Remotion Player
    </div>
  ),
}));

// Mock remotion to avoid import issues
vi.mock("remotion", () => ({
  AbsoluteFill: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Img: ({ src }: { src: string }) => <img src={src} alt="" />,
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1080, height: 1080, durationInFrames: 90, id: "test" }),
  spring: () => 0,
  interpolate: () => 0,
}));

// Mock auth hooks used by BrandOnly
vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({
    data: { session: { userId: "test-user" } },
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-user-tier", () => ({
  useUserTier: () => ({
    tier: "brand" as const,
    isLoading: false,
    isBrandUser: true,
  }),
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

function renderWithStore(ui: React.ReactElement, initialAssets: Asset[] = []) {
  const store = createStore();
  const config = getEmptyCanvasConfig();

  if (initialAssets.length > 0) {
    store.set(assetsAtom, initialAssets);
    store.set(hasCustomScreenshotAtom, true);
    store.set(configAtom, {
      ...config,
      assets: {
        ...config.assets,
        screenshot: initialAssets[0].id,
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
      renderWithStore(<VideoPreview />, [testScreenshot]);
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toBeInTheDocument();
  });

  it("passes screenshot URL to player input props", async () => {
    await act(async () => {
      renderWithStore(<VideoPreview />, [testScreenshot]);
    });
    const player = await screen.findByTestId("remotion-player");
    expect(player).toHaveAttribute("data-screenshot-url", testScreenshot.url);
  });
});
