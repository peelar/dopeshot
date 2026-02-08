"use client";

import { lazy, Suspense, useMemo, useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";
import { useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import type { ScreenshotIntroProps } from "@/remotion/types";
import { track } from "@/lib/analytics";

const LazyPlayerWrapper = lazy(() => import("@/remotion/player-wrapper"));

const VIDEO_FPS = 30;
const VIDEO_DURATION_FRAMES = 90; // 3 seconds
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1080;

export function VideoPreview() {
  const { backgroundStyle, text, config } = useLayoutPrimitives();
  const screenshot = useAtomValue(screenshotAssetAtom);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const textColor = useMemo(
    () => tokenToCssColor(config.colors.text),
    [config.colors.text]
  );

  const inputProps: ScreenshotIntroProps = useMemo(
    () => ({
      screenshotUrl: screenshot?.url ?? "",
      title: text.title ?? "",
      subtitle: text.subtitle ?? "",
      backgroundCss: backgroundStyle,
      fontFamily: text.fontFamily,
      textColor,
    }),
    [screenshot?.url, text.title, text.subtitle, backgroundStyle, text.fontFamily, textColor]
  );

  if (!screenshot?.url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Upload a screenshot to preview video
      </div>
    );
  }

  if (!isMounted) return null;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-[600px] overflow-hidden rounded-lg shadow-lg">
        <Suspense
          fallback={
            <div className="flex aspect-square w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
              Loading video preview...
            </div>
          }
        >
          <LazyPlayerWrapper
            inputProps={inputProps}
            durationInFrames={VIDEO_DURATION_FRAMES}
            fps={VIDEO_FPS}
            compositionWidth={VIDEO_WIDTH}
            compositionHeight={VIDEO_HEIGHT}
            onPlay={() => track("video_preview_played")}
          />
        </Suspense>
      </div>
    </div>
  );
}
