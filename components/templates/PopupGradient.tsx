import { memo, useMemo, type CSSProperties } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { InlineEditableText } from "@/components/templates/shared/InlineEditableText";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";

const SIDE_CONTENT_TOP = "30%";
const CENTER_CONTENT_TOP = "12%";
const CENTER_SCREENSHOT_TOP = "40%";
const SCREENSHOT_OBJECT_POSITIONS: Record<"left" | "right", string> = {
  left: "0% 0%", // show top-left when text anchors left
  right: "100% 0%", // show top-right when text anchors right
};

const CENTER_SCREENSHOT_GUTTER = 0.07; // Keep inset so rounded corners are visible

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

  const screenshotFrameWidth = useMemo(() => {
    if (textVariant === "center") {
      return "100%";
    }
    return "62%";
  }, [textVariant]);

  const renderScreenshot = (placement: "left" | "right" | "center") => {
    if (!screenshot) return null;

    if (placement === "center") {
      const insetPercentage = `${CENTER_SCREENSHOT_GUTTER * 100}%`;
      return (
        <div
          className="z-5 absolute overflow-hidden rounded-t-[20px]"
          style={{
            top: CENTER_SCREENSHOT_TOP,
            bottom: 0,
            left: insetPercentage,
            right: insetPercentage,
          }}
        >
          <div className="flex h-full w-full items-start justify-center">
            <img
              src={screenshot.url}
              alt="Screenshot"
              className="block h-auto w-full max-w-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      );
    }

    const objectPosition = SCREENSHOT_OBJECT_POSITIONS[placement];
    const baseStyle: CSSProperties = {
      top: placement === "center" ? CENTER_SCREENSHOT_TOP : SIDE_CONTENT_TOP,
      bottom: 0,
      width: screenshotFrameWidth,
      borderTopLeftRadius: placement === "right" ? "0px" : "12px",
      borderTopRightRadius: placement === "right" ? "12px" : "0px",
    };

    return (
      <div
        className={cn(
          "z-5 absolute overflow-hidden",
          placement === "left" && "right-0",
          placement === "right" && "left-0",
        )}
        style={baseStyle}
      >
        <img
          src={screenshot.url}
          alt="Screenshot"
          className="block h-full w-full object-cover"
          style={{ objectPosition }}
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
          <div
            className="absolute left-14 z-10"
            style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP }}
          >
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
          <div
            className="absolute right-14 z-10 text-right"
            style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP }}
          >
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
          <div
            className="absolute left-1/2 z-10 w-full max-w-2xl -translate-x-1/2 px-8 text-center"
            style={{ top: CENTER_CONTENT_TOP }}
          >
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
