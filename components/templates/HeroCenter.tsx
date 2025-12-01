import { memo, useMemo } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { InlineEditableText } from "@/components/templates/shared/InlineEditableText";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { getShadowValue } from "@/components/templates/shared/shadows";
import { getEffectiveCanvasMode, getScreenshotTreatment, isScreenshotFocused } from "@/domain/layout/screenshot-mode";
import { getScreenshotFrameAppearance } from "@/components/templates/shared/screenshot-frame";

interface HeroCenterProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
  onTextChange?: (field: "title" | "subtitle", value: string) => void;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function HeroCenterComponent({
  config,
  assets = [],
  className,
  onTextChange,
  onUploadAsset,
  isStatic = false,
}: HeroCenterProps) {
  const { screenshot, logo, assetMap } = useMemo(() => {
    const map = new Map(assets.map((asset) => [asset.id, asset]));
    return {
      assetMap: map,
      screenshot: config.assets.screenshot ? map.get(config.assets.screenshot) : null,
      logo: config.assets.logo ? map.get(config.assets.logo) : null,
    };
  }, [assets, config.assets.logo, config.assets.screenshot]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);
  const fontSize = getFontSizeById(config.fontSize);
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem`, lineHeight: 1.05 };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const shadowStyle = getShadowValue(config.screenshotShadow);
  const isFocused = isScreenshotFocused(config);
  const isAdaptiveCanvas = getEffectiveCanvasMode(config) === "adaptive";
  const screenshotTreatment = getScreenshotTreatment(config);
  const frameAppearance = useMemo(
    () =>
      getScreenshotFrameAppearance({
        preset: screenshotTreatment.preset,
        palette: screenshot?.colorPalette,
        isFocused,
        shadowEnabled: screenshotTreatment.shadowEnabled ?? true,
        shape: screenshotTreatment.shape,
      }),
    [
      isFocused,
      screenshot?.colorPalette,
      screenshotTreatment.preset,
      screenshotTreatment.shadowEnabled,
      screenshotTreatment.shape,
    ],
  );
  const appliedShadow = useMemo(() => {
    if (frameAppearance.shadow) return frameAppearance.shadow;
    if (screenshotTreatment.shadowEnabled === false) return undefined;
    return shadowStyle;
  }, [frameAppearance.shadow, screenshotTreatment.shadowEnabled, shadowStyle]);

  const variant = config.variant === "right" ? "right" : "left";

  const renderLogo = () => {
    if (isFocused) {
      return null;
    }
    if (logo) {
      return (
        <img src={logo.url} alt="Logo" className="h-9 w-auto object-contain" crossOrigin="anonymous" />
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

    return (
      <div className={cn("space-y-4", alignmentClass)}>
        <InlineEditableText
          element="h1"
          field="title"
          value={config.text.title}
          placeholder="Bring the heat"
          className={cn("font-semibold", fontSize.titleClass, textColorClass)}
          style={titleStyle}
          ariaLabel="Edit title"
          onTextChange={onTextChange}
        />
        {(config.text.subtitle || onTextChange) && (
          <InlineEditableText
            element="p"
            field="subtitle"
            value={config.text.subtitle}
            placeholder="Keep the heat going"
            className={cn("opacity-90", fontSize.subtitleClass, textColorClass)}
            style={subtitleStyle}
            ariaLabel="Edit subtitle"
            onTextChange={onTextChange}
          />
        )}
      </div>
    );
  };

  const renderScreenshot = () =>
    screenshot ? (
      <div className="flex flex-1 items-center justify-center">
        <div
          className={cn(
            "relative flex w-full items-center justify-center overflow-hidden",
            isAdaptiveCanvas ? "rounded-[36px]" : "rounded-[32px]",
          )}
          style={{
            ...frameAppearance.style,
            boxShadow: appliedShadow,
            height: isAdaptiveCanvas ? "min(540px, calc(100% - 120px))" : "min(520px, calc(100% - 160px))",
            maxWidth: isAdaptiveCanvas ? "70%" : "640px",
            width: "100%",
          }}
        >
          <img
            src={screenshot.url}
            alt="Screenshot"
            className="h-full w-full object-contain"
            style={{ borderRadius: frameAppearance.contentRadius }}
            crossOrigin="anonymous"
          />
        </div>
      </div>
    ) : null;

  const renderFocusedScreenshot = () =>
    screenshot ? (
      <div className="flex w-full items-center justify-center">
        <div
          className="relative flex w-full max-w-5xl items-center justify-center overflow-hidden rounded-[48px]"
          style={{
            ...frameAppearance.style,
            boxShadow: appliedShadow,
            width: "100%",
          }}
        >
          <img
            src={screenshot.url}
            alt="Screenshot"
            className="h-full w-full object-contain"
            style={{ borderRadius: frameAppearance.contentRadius }}
            crossOrigin="anonymous"
          />
        </div>
      </div>
    ) : null;

  if (isFocused) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: backgroundStyle }}>
        <div className="flex h-full w-full items-center justify-center px-8 py-10">
          {renderFocusedScreenshot()}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: backgroundStyle }}>
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
            "flex w-full items-center gap-12",
            variant === "right" ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div
            className={cn(
              "flex flex-1",
              variant === "right" ? "justify-end" : "justify-start",
            )}
          >
            <div className="max-w-md">
              {variant === "right" ? renderTextBlock("right") : renderTextBlock("left")}
            </div>
          </div>
          {renderScreenshot()}
        </div>
      </div>
    </div>
  );
}

export const HeroCenter = memo(HeroCenterComponent);
