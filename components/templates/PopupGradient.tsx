import { memo, useMemo, type CSSProperties } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { InlineEditableText } from "@/components/templates/shared/InlineEditableText";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToCssColor, tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { SHADOW_PRESETS } from "@/components/templates/shared/shadows";

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
  const shadowStyle = SHADOW_PRESETS[config.screenshotShadow || "medium"];
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const fontSize = getFontSizeById(config.fontSize);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem` };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleClassName = cn("font-bold", fontSize.titleClass, textColorClass);
  const subtitleClassName = cn("mt-4 min-h-[1.2rem]", fontSize.subtitleClass, textColorClass);

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
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 right-0 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "0px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}

      {textVariant === "right" && (
        <>
          {/* Screenshot on left */}
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 left-0 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "8px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}

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
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
              style={{
                width: "60%",
                height: "60%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

type TextField = "title" | "subtitle";

// Memoize the component to prevent unnecessary re-renders
export const PopupGradient = memo(PopupGradientComponent);
