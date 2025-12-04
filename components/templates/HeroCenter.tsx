import { memo, useMemo } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { getShadowValue } from "@/components/templates/shared/shadows";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getEffectiveCanvasMode,
  getScreenshotTreatment,
} from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/templates/shared/screenshot-frame";
import { PatternOverlay } from "@/components/templates/shared/PatternOverlay";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom, logoAssetAtom } from "@/hooks/atoms/derived";

interface HeroCenterProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function HeroCenterComponent({ className, onUploadAsset, isStatic = false }: HeroCenterProps) {
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const logo = useAtomValue(logoAssetAtom);

  const assetMap = useMemo(() => {
    return new Map(assets.map((asset) => [asset.id, asset]));
  }, [assets]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);
  const fontSize = getFontSizeById(config.fontSize);
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem`, lineHeight: 1.05 };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const shadowStyle = getShadowValue(config.screenshotShadow);
  const isAdaptiveCanvas = getEffectiveCanvasMode(config) === "adaptive";
  const screenshotTreatment = getScreenshotTreatment(config);
  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        isFocused: false,
        shadowEnabled: screenshotTreatment.shadowEnabled ?? true,
        shape: screenshotTreatment.shape,
      }),
    [screenshotTreatment.preset, screenshotTreatment.shadowEnabled, screenshotTreatment.shape],
  );
  const appliedShadow = useMemo(() => {
    if (frameAppearance.shadow) return frameAppearance.shadow;
    if (screenshotTreatment.shadowEnabled === false) return undefined;
    return shadowStyle;
  }, [frameAppearance.shadow, screenshotTreatment.shadowEnabled, shadowStyle]);

  const variant = config.variant === "right" ? "right" : "left";

  const renderLogo = () => {
    if (logo) {
      return (
        <img
          src={logo.url}
          alt="Logo"
          className="h-9 w-auto object-contain"
          crossOrigin="anonymous"
        />
      );
    }

    if (!onUploadAsset || isStatic) {
      return null;
    }

    return (
      <LogoBadge
        logo={logo}
        label="Drop your logo here"
        replaceLabel="Replace logo"
        onUploadLogo={(file) => onUploadAsset(file, "logo")}
      />
    );
  };

  const renderTextBlock = (align: "left" | "center" | "right") => {
    const alignmentClass =
      align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
    const title = config.text.title?.trim();
    const subtitle = config.text.subtitle?.trim();

    return (
      <div className={cn("space-y-4", alignmentClass)}>
        {title ? (
          <h1
            className={cn("font-semibold", fontSize.titleClass, textColorClass)}
            style={titleStyle}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className={cn("opacity-90", fontSize.subtitleClass, textColorClass)}
            style={subtitleStyle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    );
  };

  const renderScreenshot = () => {
    if (!screenshot) return null;

    const screenshotAspectRatio = screenshot.metadata?.aspectRatio ?? DEFAULT_LOCKED_ASPECT_RATIO;
    const isPortraitScreenshot = screenshotAspectRatio < 0.9;
    const screenshotObjectFit = isPortraitScreenshot ? "contain" : "cover";
    const verticalPadding = 16;

    // For tall/portrait images, use full height minus padding
    if (isPortraitScreenshot) {
      return (
        <div className="flex h-full flex-1 items-center justify-center">
          <div
            className={cn(
              "relative flex h-full max-h-full w-full items-center justify-center overflow-hidden",
              "rounded-[16px]",
            )}
            style={{
              ...frameAppearance.style,
              boxShadow: appliedShadow,
              aspectRatio: `${screenshotAspectRatio}`,
              maxHeight: `calc(100% - ${verticalPadding * 2}px)`,
              maxWidth: "480px",
            }}
          >
            <img
              src={screenshot.url}
              alt="Screenshot"
              className="h-full w-full"
              style={{
                borderRadius: frameAppearance.contentRadius,
                objectFit: screenshotObjectFit,
                objectPosition: "top",
              }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      );
    }

    // For landscape images, use existing logic
    const maxHeight = isAdaptiveCanvas
      ? `min(560px, calc(100% - ${verticalPadding + 32}px))`
      : `min(520px, calc(100% - ${verticalPadding + 72}px))`;
    const maxWidth = isAdaptiveCanvas ? "70%" : "640px";

    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div
          className={cn(
            "relative flex max-h-full w-full items-center justify-center overflow-hidden",
            "rounded-[16px]",
          )}
          style={{
            ...frameAppearance.style,
            boxShadow: appliedShadow,
            width: "max-content",
            maxWidth,
            maxHeight,
            aspectRatio: `${screenshotAspectRatio}`,
          }}
        >
          <img
            src={screenshot.url}
            alt="Screenshot"
            className="h-full w-full object-cover"
            style={{
              borderRadius: frameAppearance.contentRadius,
              objectFit: screenshotObjectFit,
              objectPosition: "top",
            }}
            crossOrigin="anonymous"
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundStyle, isolation: "isolate" }}
    >
      <PatternOverlay
        config={config}
        assets={assets}
        assetMap={assetMap}
        screenshotAsset={screenshot}
      />
      <div className="relative z-10 h-full w-full">
        <div
          className={cn(
            "absolute top-8 z-10 flex items-center gap-2",
            variant === "right" ? "right-8" : "left-8",
          )}
        >
          {renderLogo()}
        </div>

        <div className="flex h-full w-full items-center px-14 py-16">
          <div
            className={cn(
              "flex h-full w-full items-center gap-12",
              variant === "right" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn("flex flex-1", variant === "right" ? "justify-end" : "justify-start")}
            >
              <div className="max-w-md">
                {variant === "right" ? renderTextBlock("right") : renderTextBlock("left")}
              </div>
            </div>
            {renderScreenshot()}
          </div>
        </div>
      </div>
    </div>
  );
}

export const HeroCenter = memo(HeroCenterComponent);
