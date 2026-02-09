import { renderMediaOnWeb } from "@remotion/web-renderer";
import { ScreenshotIntro } from "./compositions/screenshot-intro";
import type { ScreenshotIntroProps } from "./types";

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1080;
const VIDEO_FPS = 30;
const VIDEO_DURATION_FRAMES = 90;

const DEFAULT_PROPS: ScreenshotIntroProps = {
  screenshotUrl: "",
  title: "",
  subtitle: "",
  backgroundCss: "",
  fontFamily: "",
  textColor: "",
};

/**
 * Render the ScreenshotIntro composition to an MP4 blob client-side
 * using WebCodecs via @remotion/web-renderer.
 */
export async function renderVideoToBlob(
  inputProps: ScreenshotIntroProps,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id: "screenshot-intro",
      component: ScreenshotIntro,
      durationInFrames: VIDEO_DURATION_FRAMES,
      fps: VIDEO_FPS,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      defaultProps: DEFAULT_PROPS,
    },
    inputProps,
    container: "mp4",
    videoCodec: "h264",
    onProgress: onProgress
      ? ({ renderedFrames }) => {
          onProgress(renderedFrames / VIDEO_DURATION_FRAMES);
        }
      : undefined,
    signal,
  });

  return getBlob();
}
