import { memo, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_LOCKED_ASPECT_RATIO } from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/layouts/shared/screenshot-frame";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { getFadeMaskGradient, inferFadeDirection, type FadeDirection } from "@/domain/layout/fade-direction";

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
    cornerRadius,
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
  const fadeMask = useMemo(
    () => getFadeMaskGradient((config.layoutSpecificSettings?.fadeDirection?.[config.layoutId] as FadeDirection | undefined) ?? inferFadeDirection(config)),
    [config],
  );

  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        isFocused: true,
        shadowEnabled: screenshotTreatment.shadowEnabled ?? true,
        shape: screenshotTreatment.shape,
        cornerRadius,
        customShadow: screenshotShadow,
      }),
    [screenshotTreatment.preset, screenshotTreatment.shadowEnabled, screenshotTreatment.shape, cornerRadius, screenshotShadow],
  );

  const appliedShadow = useMemo(() => {
    if (frameAppearance.shadow) return frameAppearance.shadow;
    return screenshotShadow;
  }, [frameAppearance.shadow, screenshotShadow]);

  const screenshotAspectRatio = screenshot?.metadata?.aspectRatio ?? DEFAULT_LOCKED_ASPECT_RATIO;
  const stagePadding = 48;
  const frameMaxWidth = `calc(100% - ${stagePadding * 2}px)`;
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
      <div className="relative z-10 h-full w-full" data-export-element data-element="container">
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden"
          style={{ padding: `${stagePadding}px` }}
        >
          <div
            className="relative flex w-full items-center justify-center overflow-hidden"
            style={{
              ...frameAppearance.style,
              boxShadow: fadeEnabled ? "none" : appliedShadow,
              width: "100%",
              maxWidth: "100%",
              maxHeight: frameMaxHeight,
              aspectRatio: screenshotAspectRatio,
              transform: `scale(${screenshotZoom})`,
            }}
          >
            {screenshot ? (
              <img
                src={screenshot.url}
                alt="Screenshot"
                data-export-element
                data-element="screenshot"
                data-role="screenshot"
                className="h-full w-full object-cover"
                style={{
                  borderRadius: frameAppearance.contentRadius,
                  objectPosition: "top",
                  ...(fadeEnabled && {
                    maskImage: fadeMask,
                    WebkitMaskImage: fadeMask,
                  }),
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white/70">
                {isStatic
                  ? null
                  : config.assets.screenshot
                    ? "Saved screenshot missing - upload to restore"
                    : "Drop a screenshot to get started"}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const AdaptiveScreenshot = memo(AdaptiveScreenshotComponent);
