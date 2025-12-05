import { memo, useMemo, type CSSProperties } from "react";
import { cn } from "@/utils";
import { LogoBadge } from "@/components/looks/shared/LogoBadge";
import { LookSurface, useLookPrimitives } from "@/components/looks/shared/look-primitives";

const SIDE_CONTENT_TOP = "30%";
const CENTER_CONTENT_TOP = "15%";
const CENTER_SCREENSHOT_TOP = "40%";
const CENTER_TEXT_GUTTER_PX = 12;
const SCREENSHOT_OBJECT_POSITIONS: Record<"left" | "right", string> = {
  left: "0% 0%",
  right: "100% 0%",
};
const SIDE_SCREENSHOT_ZOOM = 1.35;
const SIDE_SCREENSHOT_TRANSFORM_ORIGINS: Record<"left" | "right", string> = {
  left: "left top",
  right: "right top",
};

const CENTER_SCREENSHOT_GUTTER = 0.07;
const PEAK_CORNER_RADIUS = "16px";

function getPeakBorderRadius(placement: "left" | "right" | "center") {
  switch (placement) {
    case "left":
      return `${PEAK_CORNER_RADIUS} 0 0 0`;
    case "right":
      return `0 ${PEAK_CORNER_RADIUS} 0 0`;
    case "center":
    default:
      return `${PEAK_CORNER_RADIUS} ${PEAK_CORNER_RADIUS} 0 0`;
  }
}

interface PopupGradientProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function PopupGradientComponent({ className, onUploadAsset, isStatic = false }: PopupGradientProps) {
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    logo,
    screenshot,
    screenshotShadow,
    text,
  } = useLookPrimitives();

  const textColumnStyle: CSSProperties = useMemo(() => ({ width: "min(420px, calc(45%))" }), []);

  const textVariant: "left" | "right" | "center" = (() => {
    if (config.variant === "left" || config.variant === "center") return config.variant;
    if (config.variant === "right") return "right";
    return "right";
  })();

  const titleClassName = cn("font-bold", text.fontSize.titleClass, text.textColorClass);
  const subtitleClassName = cn(
    "mt-4 min-h-[1.2rem]",
    text.fontSize.subtitleClass,
    text.textColorClass,
  );
  const title = text.title;
  const subtitle = text.subtitle;

  const screenshotFrameWidth = useMemo(() => {
    if (textVariant === "center") {
      return "100%";
    }
    return "62%";
  }, [textVariant]);

  const centerTextRegionStyle = useMemo(
    () => ({
      top: CENTER_CONTENT_TOP,
      height: `calc(${CENTER_SCREENSHOT_TOP} - ${CENTER_CONTENT_TOP} - ${CENTER_TEXT_GUTTER_PX}px)`,
    }),
    [],
  );

  const renderScreenshot = (placement: "left" | "right" | "center") => {
    if (!screenshot) return null;

    if (placement === "center") {
      const insetPercentage = `${CENTER_SCREENSHOT_GUTTER * 100}%`;
      return (
        <div
          className="z-5 absolute overflow-hidden"
          style={{
            top: CENTER_SCREENSHOT_TOP,
            bottom: 0,
            left: insetPercentage,
            right: insetPercentage,
            borderRadius: getPeakBorderRadius("center"),
            background: "transparent",
            boxShadow: screenshotShadow,
          }}
        >
          <div className="flex h-full w-full items-start justify-center">
            <img
              src={screenshot.url}
              alt="Screenshot"
              className="block h-full w-full object-cover"
              style={{ objectPosition: "top" }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      );
    }

    const objectPosition = SCREENSHOT_OBJECT_POSITIONS[placement];
    const baseStyle: CSSProperties = {
      top: SIDE_CONTENT_TOP,
      bottom: 0,
      width: screenshotFrameWidth,
    };

    return (
      <div
        className={cn(
          "z-5 absolute overflow-hidden",
          placement === "left" && "right-0",
          placement === "right" && "left-0",
        )}
        style={{
          ...baseStyle,
          borderRadius: getPeakBorderRadius(placement),
          background: "transparent",
          boxShadow: screenshotShadow,
        }}
      >
        <img
          src={screenshot.url}
          alt="Screenshot"
          className="block h-full w-full object-cover"
          style={{
            objectPosition,
            transform: `scale(${SIDE_SCREENSHOT_ZOOM})`,
            transformOrigin: SIDE_SCREENSHOT_TRANSFORM_ORIGINS[placement],
          }}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <LookSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={screenshot}
    >
      <div className="relative z-10 h-full w-full">
        <div
          className={cn(
            "absolute top-8 z-10 flex items-center",
            textVariant === "right" ? "right-8 justify-end" : "left-8 justify-start",
          )}
        >
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

        {textVariant === "left" && (
          <>
            <div
              className="absolute left-14 z-10 space-y-4"
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "text-balance leading-tight")}
                  style={{ ...text.titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-balance")} style={text.subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {renderScreenshot("left")}
          </>
        )}

        {textVariant === "right" && (
          <>
            {renderScreenshot("right")}

            <div
              className="absolute right-14 z-10 text-right"
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "text-right text-balance leading-tight")}
                  style={{ ...text.titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-right text-balance")} style={text.subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </>
        )}

        {textVariant === "center" && (
          <>
            <div
              className="absolute left-1/2 z-10 w-[calc(100%-96px)] max-w-6xl -translate-x-1/2 space-y-4 px-8 text-center"
              style={centerTextRegionStyle}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "whitespace-nowrap leading-tight")}
                  style={{ ...text.titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-balance")} style={text.subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {renderScreenshot("center")}
          </>
        )}
      </div>
    </LookSurface>
  );
}

export const PopupGradient = memo(PopupGradientComponent);
