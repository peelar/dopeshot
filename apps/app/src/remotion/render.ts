import { renderMediaOnWeb } from "@remotion/web-renderer";
import { PeakVideo } from "./compositions/peak-video";
import type { PeakVideoProps } from "./types";
import { calculateVideoDuration, VIDEO_FPS } from "./typing-schedule";

const DEFAULT_PROPS: PeakVideoProps = {
  screenshotUrl: "",
  title: "",
  subtitle: "",
  backgroundCss: "",
  fontFamily: "",
  textColor: "",
  variant: "center",
  screenshotShadowCss: "",
};

/**
 * Render the PeakVideo composition to an MP4 blob client-side
 * using WebCodecs via @remotion/web-renderer.
 */
export async function renderVideoToBlob(
  inputProps: PeakVideoProps,
  options: { width: number; height: number },
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const durationInFrames = calculateVideoDuration(inputProps);

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id: "peak-video",
      component: PeakVideo,
      durationInFrames,
      fps: VIDEO_FPS,
      width: options.width,
      height: options.height,
      defaultProps: DEFAULT_PROPS,
    },
    inputProps,
    container: "mp4",
    videoCodec: "h264",
    onProgress: onProgress
      ? ({ renderedFrames }) => {
          onProgress(renderedFrames / durationInFrames);
        }
      : undefined,
    signal,
  });

  return getBlob();
}
