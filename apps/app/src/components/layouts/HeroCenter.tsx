import { memo, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getEffectiveCanvasMode,
} from "@/domain/layout/screenshot-mode";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { getScreenshotFrameAppearance } from "@/components/layouts/shared/screenshot-frame";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";

interface HeroCenterProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function HeroCenterComponent({ className, onUploadAsset, isStatic = false }: HeroCenterProps) {
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    logo,
    screenshot,
    screenshotShadow,
    screenshotTreatment,
    screenshotZoom,
    text,
    cornerRadius,
  } = useLayoutPrimitives();

  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        isFocused: false,
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

  const variant = config.variant === "right" ? "right" : "left";

  const renderLogo = () => {
    if (logo) {
      return (
        <img
          src={logo.url}
          alt="Logo"
          className="h-8 w-auto max-w-[200px] object-contain"
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
    const title = text.title;
    const subtitle = text.subtitle;

    return (
      <div className={cn("space-y-4", alignmentClass, text.containerClasses)}>
        {title ? (
          <h1 className={cn(text.titleClasses, text.textColorClass)} style={text.titleStyle}>
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className={cn(text.subtitleClasses, text.textColorClass)} style={text.subtitleStyle}>
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

    if (isPortraitScreenshot) {
      return (
        <div className="flex h-full flex-1 items-center justify-center">
          <div
            className="relative flex h-full max-h-full w-full items-center justify-center overflow-hidden"
            style={{
              ...frameAppearance.style,
              boxShadow: appliedShadow,
              aspectRatio: `${screenshotAspectRatio}`,
              maxHeight: `calc(100% - ${verticalPadding * 2}px)`,
              maxWidth: "480px",
              transform: `scale(${screenshotZoom})`,
            }}
          >
            <img
              src={screenshot.url}
              alt="Screenshot"
              data-export-element
              data-element="screenshot"
              data-role="screenshot"
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

    const isAdaptiveCanvas = getEffectiveCanvasMode(config) === "adaptive";
    const maxHeight = isAdaptiveCanvas
      ? `min(560px, calc(100% - ${verticalPadding + 32}px))`
      : `min(520px, calc(100% - ${verticalPadding + 72}px))`;
    const maxWidth = isAdaptiveCanvas ? "70%" : "640px";

    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div
          className="relative flex max-h-full w-full items-center justify-center overflow-hidden"
          style={{
            ...frameAppearance.style,
            boxShadow: appliedShadow,
            width: "max-content",
            maxWidth,
            maxHeight,
            aspectRatio: `${screenshotAspectRatio}`,
            transform: `scale(${screenshotZoom})`,
          }}
        >
          <img
            src={screenshot.url}
            alt="Screenshot"
            data-export-element
            data-element="screenshot"
            data-role="screenshot"
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
          className={cn(
            "absolute top-8 z-10 flex items-center gap-2",
            variant === "right" ? "right-14" : "left-14",
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
              className={cn(
                "flex min-w-0 flex-1",
                variant === "right" ? "justify-end" : "justify-start",
              )}
            >
              <div className="w-full max-w-md">
                {variant === "right" ? renderTextBlock("right") : renderTextBlock("left")}
              </div>
            </div>
            {renderScreenshot()}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const HeroCenter = memo(HeroCenterComponent);
