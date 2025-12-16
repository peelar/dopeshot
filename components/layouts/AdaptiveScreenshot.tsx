import { memo, useMemo } from "react";
import { cn } from "@/utils";
import { DEFAULT_LOCKED_ASPECT_RATIO } from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/layouts/shared/screenshot-frame";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";

interface AdaptiveScreenshotProps {
  className?: string;
  isStatic?: boolean;
}

function AdaptiveScreenshotComponent({ className, isStatic = false }: AdaptiveScreenshotProps) {
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    screenshot,
    screenshotShadow,
    screenshotTreatment,
    screenshotZoom,
  } = useLayoutPrimitives();

  // Default fadeEnabled based on screenshot dimensions for Backdrop layout
  const shouldAutoEnableFade = useMemo(() => {
    const isBackdropLayout = config.layoutId === "adaptive-stage" || config.layoutId === "full-visual";
    if (!isBackdropLayout || !screenshot?.metadata) return false;

    const { height, aspectRatio } = screenshot.metadata;
    // Enable fade for tall vertical images (height > 720px and aspect ratio < 1)
    return height > 720 && aspectRatio < 1;
  }, [config.layoutId, screenshot?.metadata]);

  // Use layout-specific fade state
  const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
  const fadeEnabled = layoutSpecificFadeEnabled ?? shouldAutoEnableFade;

  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        isFocused: true,
        shadowEnabled: screenshotTreatment.shadowEnabled ?? true,
        shape: screenshotTreatment.shape,
      }),
    [screenshotTreatment.preset, screenshotTreatment.shadowEnabled, screenshotTreatment.shape],
  );

  const appliedShadow = useMemo(() => {
    if (frameAppearance.shadow) return frameAppearance.shadow;
    return screenshotShadow;
  }, [frameAppearance.shadow, screenshotShadow]);

  const screenshotAspectRatio = screenshot?.metadata?.aspectRatio ?? DEFAULT_LOCKED_ASPECT_RATIO;
  const stagePadding = 48;
  const frameMaxWidth = `min(1100px, calc(100% - ${stagePadding * 2}px))`;
  const frameMaxHeight = `calc(100% - ${stagePadding * 2}px)`;

  return (
    <LayoutSurface
      className={className}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={screenshot}
    >
      <div className="relative z-10 h-full w-full">
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ padding: `${stagePadding}px` }}
        >
          <div
            className="relative flex w-full items-center justify-center overflow-hidden"
            style={{
              ...frameAppearance.style,
              boxShadow: appliedShadow,
              width: "max-content",
              maxWidth: frameMaxWidth,
              maxHeight: frameMaxHeight,
              aspectRatio: screenshotAspectRatio,
              transform: `scale(${screenshotZoom})`,
            }}
          >
            {screenshot ? (
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="h-full w-full object-cover"
                style={{
                  borderRadius: frameAppearance.contentRadius,
                  objectPosition: "top",
                  ...(fadeEnabled && {
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
                  }),
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white/70">
                {isStatic ? null : "Drop a screenshot to get started"}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const AdaptiveScreenshot = memo(AdaptiveScreenshotComponent);
