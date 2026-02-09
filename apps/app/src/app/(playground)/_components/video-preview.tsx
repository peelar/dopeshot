"use client";

import { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { orientationAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";
import { useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { EXPORT_ORIENTATION_DIMENSIONS, ORIENTATION_DIMENSIONS } from "@/domain/layout/screenshot-mode";
import { getVideoTextStyles } from "@/domain/layout/adaptive-typography";
import type { PeakVideoProps } from "@/remotion/types";
import type { FontStyle } from "@/domain/layout/types";
import { calculateVideoDuration, VIDEO_FPS } from "@/remotion/typing-schedule";
import { track } from "@/lib/analytics";

const LazyPlayerWrapper = lazy(() => import("@/remotion/player-wrapper"));

export function VideoPreview() {
  const { backgroundStyle, text, config, screenshotShadow } = useLayoutPrimitives();
  const screenshot = useAtomValue(screenshotAssetAtom);
  const orientation = useAtomValue(orientationAtom);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const textColor = useMemo(
    () => tokenToCssColor(config.colors.text),
    [config.colors.text]
  );

  const dims = EXPORT_ORIENTATION_DIMENSIONS[orientation];

  const variant = (config.variant === "left" || config.variant === "right" || config.variant === "center")
    ? config.variant
    : "center";

  const effectiveFontStyle: FontStyle = config.fontStyle ?? "founder";
  const videoTextStyles = useMemo(
    () => getVideoTextStyles(effectiveFontStyle, text.title, text.subtitle),
    [effectiveFontStyle, text.title, text.subtitle],
  );

  // Grain is enabled for non-image backgrounds (matches PatternOverlay behavior)
  const grainEnabled = config.background?.type !== "image";

  // Fade is per-layout toggle from config
  const fadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId] ?? false;

  // Typing animation per-layout toggle
  const typingEnabled = config.layoutSpecificSettings?.typingEnabled?.[config.layoutId] ?? false;

  const inputProps: PeakVideoProps = useMemo(
    () => ({
      screenshotUrl: screenshot?.url ?? "",
      title: text.title ?? "",
      subtitle: text.subtitle ?? "",
      backgroundCss: backgroundStyle,
      fontFamily: text.fontFamily,
      textColor,
      variant,
      screenshotShadowCss: screenshotShadow ?? "",
      titleStyle: videoTextStyles.titleStyle,
      subtitleStyle: videoTextStyles.subtitleStyle,
      grainEnabled,
      fadeEnabled,
      typingEnabled,
    }),
    [screenshot?.url, text.title, text.subtitle, backgroundStyle, text.fontFamily, textColor, variant, screenshotShadow, videoTextStyles, grainEnabled, fadeEnabled, typingEnabled]
  );

  const durationInFrames = useMemo(
    () => calculateVideoDuration({
      title: text.title ?? "",
      subtitle: text.subtitle ?? "",
      typingEnabled,
    }),
    [text.title, text.subtitle, typingEnabled],
  );

  // Debounce props passed to the Player to avoid re-rendering
  // the entire Remotion composition on every keystroke.
  const [debouncedProps, setDebouncedProps] = useState(inputProps);
  const [debouncedDuration, setDebouncedDuration] = useState(durationInFrames);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedProps(inputProps);
      setDebouncedDuration(durationInFrames);
    }, 600);
    return () => clearTimeout(timer);
  }, [inputProps, durationInFrames]);

  if (!screenshot?.url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Upload a screenshot to preview video
      </div>
    );
  }

  if (!isMounted) return null;

  const aspectRatio = dims.width / dims.height;

  // Use preview dimensions (1280×720 / 720×1280) as max size to match
  // image canvas — the Remotion Player renders the composition at export
  // dimensions internally and scales to fit this display area.
  const previewDims = ORIENTATION_DIMENSIONS[orientation];

  return (
    <div className="flex max-h-full w-full items-center justify-center">
      <div
        className="w-full overflow-hidden rounded-lg shadow-sm"
        style={{
          aspectRatio: `${dims.width} / ${dims.height}`,
          maxWidth: previewDims.width,
          maxHeight: "100%",
        }}
      >
        <Suspense
          fallback={
            <div
              className="flex h-full w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground"
              style={{ aspectRatio }}
            >
              Loading video preview...
            </div>
          }
        >
          <LazyPlayerWrapper
            inputProps={debouncedProps}
            durationInFrames={debouncedDuration}
            fps={VIDEO_FPS}
            compositionWidth={dims.width}
            compositionHeight={dims.height}
            onPlay={() => track("video_preview_played")}
          />
        </Suspense>
      </div>
    </div>
  );
}
