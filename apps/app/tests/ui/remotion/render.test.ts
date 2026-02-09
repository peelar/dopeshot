import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PeakVideoProps } from "@/remotion/types";
import { calculateVideoDuration } from "@/remotion/typing-schedule";

const mockGetBlob = vi.fn();
const mockRenderMediaOnWeb = vi.fn();

vi.mock("@remotion/web-renderer", () => ({
  renderMediaOnWeb: (...args: unknown[]) => mockRenderMediaOnWeb(...args),
}));

vi.mock("remotion", () => ({
  AbsoluteFill: "div",
  Img: "img",
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 90, id: "test" }),
  spring: () => 0,
  interpolate: () => 0,
}));

import { renderVideoToBlob } from "@/remotion/render";

const testProps: PeakVideoProps = {
  screenshotUrl: "data:image/png;base64,test",
  title: "Test Title",
  subtitle: "Test Subtitle",
  backgroundCss: "linear-gradient(135deg, #000, #fff)",
  fontFamily: "var(--font-clean)",
  textColor: "rgb(248 250 252)",
  variant: "left",
  screenshotShadowCss: "0 4px 8px rgba(0,0,0,0.2)",
};

const testDimensions = { width: 1920, height: 1080 };
const expectedDuration = calculateVideoDuration(testProps);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBlob.mockResolvedValue(new Blob(["video-data"], { type: "video/mp4" }));
  mockRenderMediaOnWeb.mockResolvedValue({ getBlob: mockGetBlob });
});

describe("renderVideoToBlob", () => {
  it("calls renderMediaOnWeb with correct composition params", async () => {
    await renderVideoToBlob(testProps, testDimensions);

    expect(mockRenderMediaOnWeb).toHaveBeenCalledOnce();
    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.composition).toMatchObject({
      id: "peak-video",
      durationInFrames: expectedDuration,
      fps: 30,
      width: 1920,
      height: 1080,
    });
    expect(args.container).toBe("mp4");
    expect(args.videoCodec).toBe("h264");
    expect(args.inputProps).toEqual(testProps);
  });

  it("uses mobile dimensions when passed", async () => {
    const mobileDims = { width: 1080, height: 1920 };
    await renderVideoToBlob(testProps, mobileDims);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.composition.width).toBe(1080);
    expect(args.composition.height).toBe(1920);
  });

  it("returns the blob from getBlob()", async () => {
    const blob = await renderVideoToBlob(testProps, testDimensions);

    expect(mockGetBlob).toHaveBeenCalledOnce();
    expect(blob).toBeInstanceOf(Blob);
  });

  it("forwards progress callback", async () => {
    const onProgress = vi.fn();
    await renderVideoToBlob(testProps, testDimensions, onProgress);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    // Simulate a progress event — half the calculated duration
    const halfFrames = Math.floor(expectedDuration / 2);
    args.onProgress({ renderedFrames: halfFrames, encodedFrames: halfFrames });

    expect(onProgress).toHaveBeenCalledWith(halfFrames / expectedDuration);
  });

  it("does not set onProgress when no callback provided", async () => {
    await renderVideoToBlob(testProps, testDimensions);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.onProgress).toBeUndefined();
  });

  it("passes abort signal when provided", async () => {
    const controller = new AbortController();
    await renderVideoToBlob(testProps, testDimensions, undefined, controller.signal);

    const args = mockRenderMediaOnWeb.mock.calls[0][0];
    expect(args.signal).toBe(controller.signal);
  });
});
