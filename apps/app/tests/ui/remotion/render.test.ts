import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ScreenshotIntroProps } from "@/remotion/types";

const mockGetBlob = vi.fn();
const mockRenderMediaOnWeb = vi.fn();

vi.mock("@remotion/web-renderer", () => ({
  renderMediaOnWeb: (...args: unknown[]) => mockRenderMediaOnWeb(...args),
}));

vi.mock("remotion", () => ({
  AbsoluteFill: "div",
  Img: "img",
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1080, height: 1080, durationInFrames: 90, id: "test" }),
  spring: () => 0,
  interpolate: () => 0,
}));

import { renderVideoToBlob } from "@/remotion/render";

const testProps: ScreenshotIntroProps = {
  screenshotUrl: "data:image/png;base64,test",
  title: "Test Title",
  subtitle: "Test Subtitle",
  backgroundCss: "linear-gradient(135deg, #000, #fff)",
  fontFamily: "var(--font-clean)",
  textColor: "rgb(248 250 252)",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBlob.mockResolvedValue(new Blob(["video-data"], { type: "video/mp4" }));
  mockRenderMediaOnWeb.mockResolvedValue({ getBlob: mockGetBlob });
});

describe("renderVideoToBlob", () => {
  it("calls renderMediaOnWeb with correct composition params", async () => {
    await renderVideoToBlob(testProps);

    expect(mockRenderMediaOnWeb).toHaveBeenCalledOnce();
    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.composition).toMatchObject({
      id: "screenshot-intro",
      durationInFrames: 90,
      fps: 30,
      width: 1080,
      height: 1080,
    });
    expect(args.container).toBe("mp4");
    expect(args.videoCodec).toBe("h264");
    expect(args.inputProps).toEqual(testProps);
  });

  it("returns the blob from getBlob()", async () => {
    const blob = await renderVideoToBlob(testProps);

    expect(mockGetBlob).toHaveBeenCalledOnce();
    expect(blob).toBeInstanceOf(Blob);
  });

  it("forwards progress callback", async () => {
    const onProgress = vi.fn();
    await renderVideoToBlob(testProps, onProgress);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    // Simulate a progress event
    args.onProgress({ renderedFrames: 45, encodedFrames: 40 });

    expect(onProgress).toHaveBeenCalledWith(0.5); // 45/90
  });

  it("does not set onProgress when no callback provided", async () => {
    await renderVideoToBlob(testProps);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.onProgress).toBeUndefined();
  });

  it("passes abort signal when provided", async () => {
    const controller = new AbortController();
    await renderVideoToBlob(testProps, undefined, controller.signal);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.signal).toBe(controller.signal);
  });
});
