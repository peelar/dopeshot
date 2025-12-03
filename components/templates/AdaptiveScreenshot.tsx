import { memo, useMemo } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getScreenshotTreatment,
} from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/templates/shared/screenshot-frame";
import { getShadowValue } from "@/components/templates/shared/shadows";
import { GrainOverlay } from "@/components/templates/shared/GrainOverlay";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";

interface AdaptiveScreenshotProps {
  className?: string;
  isStatic?: boolean;
}

function AdaptiveScreenshotComponent({ className, isStatic = false }: AdaptiveScreenshotProps) {
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);

  const assetMap = useMemo(() => {
    return new Map(assets.map((asset) => [asset.id, asset]));
  }, [assets]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);
  const showGrainOverlay = config.background?.grainEnabled ?? true;
  const screenshotTreatment = getScreenshotTreatment(config);
  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
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
  const stagePadding = 48;
  const frameMaxWidth = `min(1100px, calc(100% - ${stagePadding * 2}px))`;
  const frameMaxHeight = `calc(100% - ${stagePadding * 2}px)`;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundStyle, isolation: "isolate" }}
    >
      <GrainOverlay enabled={showGrainOverlay} isStatic={isStatic} />
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
                }}
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
    </div>
  );
}

export const AdaptiveScreenshot = memo(AdaptiveScreenshotComponent);
