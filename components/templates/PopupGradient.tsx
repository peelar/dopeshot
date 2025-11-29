import { memo, useMemo, type CSSProperties } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset, ImageMetadata } from "@/domain/asset/types";
import { cn } from "@/utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { InlineEditableText } from "@/components/templates/shared/InlineEditableText";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";

type ScreenshotOrientation = NonNullable<ImageMetadata["orientation"]>;

const FALLBACK_ORIENTATION: ScreenshotOrientation = "landscape";
const ORIENTATION_PRESETS: Record<ScreenshotOrientation, { heightFactor: number; objectPosition: string }> = {
  ultrawide: { heightFactor: 0.48, objectPosition: "50% 6%" },
  landscape: { heightFactor: 0.54, objectPosition: "50% 10%" },
  square: { heightFactor: 0.6, objectPosition: "50% 16%" },
  portrait: { heightFactor: 0.66, objectPosition: "50% 22%" },
};

interface PopupGradientProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
  onTextChange?: (field: "title" | "subtitle", value: string) => void;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function PopupGradientComponent({
  config,
  assets = [],
  className,
  onTextChange,
  onUploadAsset,
  isStatic = false,
}: PopupGradientProps) {
  // Memoize asset map to avoid recreation on every render
  const { screenshot, logo, assetMap } = useMemo(() => {
    const map = new Map(assets.map((a) => [a.id, a]));
    return {
      assetMap: map,
      screenshot: config.assets.screenshot ? map.get(config.assets.screenshot) : null,
      logo: config.assets.logo ? map.get(config.assets.logo) : null,
    };
  }, [assets, config.assets.screenshot, config.assets.logo]);

  // Memoize background style computation
  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);

  const textColumnStyle: CSSProperties = useMemo(
    () => ({ width: "min(420px, calc(45%))" }),
    [],
  );

  const textVariant: "left" | "right" | "center" = (() => {
    if (config.variant === "left" || config.variant === "center") return config.variant;
    if (config.variant === "right") return "right";
    return "right";
  })();

  // Interpret variant as text position; screenshot mirrors opposite side
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const fontSize = getFontSizeById(config.fontSize);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem` };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleClassName = cn("font-bold", fontSize.titleClass, textColorClass);
  const subtitleClassName = cn("mt-4 min-h-[1.2rem]", fontSize.subtitleClass, textColorClass);

  const screenshotOrientation: ScreenshotOrientation = useMemo(() => {
    if (!screenshot) return FALLBACK_ORIENTATION;
    if (screenshot.metadata?.orientation) {
      return screenshot.metadata.orientation;
    }

    const ratio = screenshot.metadata?.aspectRatio;
    if (!ratio) return FALLBACK_ORIENTATION;
    if (ratio >= 2.1) return "ultrawide";
    if (ratio >= 1.1) return "landscape";
    if (ratio <= 0.85) return "portrait";
    return "square";
  }, [screenshot]);

  const screenshotFrameDimensions = useMemo(() => {
    const base = ORIENTATION_PRESETS[screenshotOrientation].heightFactor;
    const variantBoost = textVariant === "center" ? 0.04 : 0;
    const clampedHeight = Math.min(0.7, Math.max(0.48, base + variantBoost));

    return {
      width: `${(textVariant === "center" ? 0.58 : 0.62) * 100}%`,
      height: `${clampedHeight * 100}%`,
    };
  }, [screenshotOrientation, textVariant]);

  const screenshotImageStyle = useMemo(() => {
    const { objectPosition } = ORIENTATION_PRESETS[screenshotOrientation];
    return {
      objectPosition,
      transform: "scale(1.06)",
      transformOrigin: "top center",
    } as CSSProperties;
  }, [screenshotOrientation]);

  const renderScreenshot = (placement: "left" | "right" | "center") => {
    if (!screenshot) return null;

    const baseStyle: CSSProperties = {
      width: screenshotFrameDimensions.width,
      height: screenshotFrameDimensions.height,
      borderTopLeftRadius: placement === "right" ? "0px" : "12px",
      borderTopRightRadius: placement === "right" ? "12px" : "0px",
    };

    if (placement === "center") {
      baseStyle.borderTopLeftRadius = "12px";
      baseStyle.borderTopRightRadius = "12px";
    }

    return (
      <div
        className={cn(
          "z-5 absolute bottom-0 overflow-hidden",
          placement === "left" && "right-0",
          placement === "right" && "left-0",
          placement === "center" && "left-1/2 -translate-x-1/2",
        )}
        style={baseStyle}
      >
        <img
          src={screenshot.url}
          alt="Screenshot"
          className="block h-full w-full object-cover"
          style={screenshotImageStyle}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-cover bg-center bg-no-repeat",
        className,
      )}
      style={{
        aspectRatio: "1280 / 720",
        background: backgroundStyle,
      }}
    >
      <div className="absolute left-8 top-8 z-10">
        {logo ? (
          <img
            src={logo.url}
            alt="Logo"
            className="h-8 w-auto object-contain"
            crossOrigin="anonymous"
          />
        ) : null}
        {!logo && onUploadAsset && !isStatic ? (
          <LogoBadge
            logo={logo}
            label="Drop your logo here"
            replaceLabel="Replace logo"
            onUploadLogo={(file) => onUploadAsset(file, "logo")}
          />
        ) : null}
      </div>

      {/* Content based on image position */}
      {textVariant === "left" && (
        <>
          {/* Text on left */}
          <div className="absolute left-14 top-[30%] z-10" style={textColumnStyle}>
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={titleClassName}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={subtitleClassName}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>

          {/* Screenshot on right, popping up from bottom */}
          {renderScreenshot("left")}
        </>
      )}

      {textVariant === "right" && (
        <>
          {/* Screenshot on left */}
          {renderScreenshot("right")}

          {/* Text on right */}
          <div className="absolute right-14 top-[30%] z-10 text-right" style={textColumnStyle}>
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={cn(titleClassName, "text-right")}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={cn(subtitleClassName, "text-right")}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>
        </>
      )}

      {textVariant === "center" && (
        <>
          {/* Text on top */}
          <div className="absolute left-1/2 top-[12%] z-10 w-full max-w-2xl -translate-x-1/2 px-8 text-center">
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={titleClassName}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={subtitleClassName}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>

          {/* Screenshot centered, popping up from bottom */}
          {renderScreenshot("center")}
        </>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PopupGradient = memo(PopupGradientComponent);
