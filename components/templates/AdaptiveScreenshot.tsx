import { memo, useMemo } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { DEFAULT_LOCKED_ASPECT_RATIO, getScreenshotTreatment } from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/templates/shared/screenshot-frame";
import { getShadowValue } from "@/components/templates/shared/shadows";

interface AdaptiveScreenshotProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
  isStatic?: boolean;
}

function AdaptiveScreenshotComponent({ config, assets = [], className }: AdaptiveScreenshotProps) {
  const { screenshot, assetMap } = useMemo(() => {
    const map = new Map(assets.map((asset) => [asset.id, asset]));
    return {
      assetMap: map,
      screenshot: config.assets.screenshot ? map.get(config.assets.screenshot) : null,
    };
  }, [assets, config.assets.screenshot]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);
  const screenshotTreatment = getScreenshotTreatment(config);
  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        palette: screenshot?.colorPalette,
        isFocused: true,
        shadowEnabled: screenshotTreatment.shadowEnabled ?? true,
        shape: screenshotTreatment.shape,
      }),
    [
      screenshot?.colorPalette,
      screenshotTreatment.preset,
      screenshotTreatment.shadowEnabled,
      screenshotTreatment.shape,
    ],
  );
  const appliedShadow = useMemo(() => {
    if (frameAppearance.shadow) return frameAppearance.shadow;
    if (screenshotTreatment.shadowEnabled === false) return undefined;
    return getShadowValue(config.screenshotShadow);
  }, [config.screenshotShadow, frameAppearance.shadow, screenshotTreatment.shadowEnabled]);

  const screenshotAspectRatio = screenshot?.metadata?.aspectRatio ?? DEFAULT_LOCKED_ASPECT_RATIO;
  const frameMaxWidth = "min(1100px, calc(100% - 40px))";
  const frameMaxHeight = "calc(100% - 40px)";

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundStyle }}
    >
      <div className="flex h-full w-full items-center justify-center px-2 py-3">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden"
          style={{
            ...frameAppearance.style,
            boxShadow: appliedShadow,
            width: "100%",
            maxWidth: frameMaxWidth,
            maxHeight: frameMaxHeight,
            aspectRatio: screenshotAspectRatio,
          }}
        >
          {screenshot ? (
            <img
              src={screenshot.url}
              alt="Screenshot"
              className="h-full w-full object-contain"
              style={{ borderRadius: frameAppearance.contentRadius }}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white/70">
              Drop a screenshot to get started
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const AdaptiveScreenshot = memo(AdaptiveScreenshotComponent);
