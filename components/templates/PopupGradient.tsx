import { memo, useMemo, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { getScreenshotTreatment } from "@/domain/layout/screenshot-mode";
import { getShadowValue } from "@/components/templates/shared/shadows";
import { PatternOverlay } from "@/components/templates/shared/PatternOverlay";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom, logoAssetAtom } from "@/hooks/atoms/derived";

const SIDE_CONTENT_TOP = "30%";
const CENTER_CONTENT_TOP = "15%";
const CENTER_SCREENSHOT_TOP = "40%";
const CENTER_TEXT_GUTTER_PX = 12; // keeps space before the screenshot region
const SCREENSHOT_OBJECT_POSITIONS: Record<"left" | "right", string> = {
  left: "0% 0%", // show top-left when text anchors left
  right: "100% 0%", // show top-right when text anchors right
};
const SIDE_SCREENSHOT_ZOOM = 1.35;
const SIDE_SCREENSHOT_TRANSFORM_ORIGINS: Record<"left" | "right", string> = {
  left: "left top",
  right: "right top",
};

const CENTER_SCREENSHOT_GUTTER = 0.07; // Keep inset so rounded corners are visible
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
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const logo = useAtomValue(logoAssetAtom);

  // Memoize asset map to avoid recreation on every render
  const assetMap = useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]));
  }, [assets]);

  // Memoize background style computation
  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);

  const textColumnStyle: CSSProperties = useMemo(() => ({ width: "min(420px, calc(45%))" }), []);

  const screenshotTreatment = getScreenshotTreatment(config);
  const appliedShadow = useMemo(() => {
    if (screenshotTreatment.shadowEnabled === false) return undefined;
    return getShadowValue(config.screenshotShadow);
  }, [config.screenshotShadow, screenshotTreatment.shadowEnabled]);

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
  const title = config.text.title?.trim();
  const subtitle = config.text.subtitle?.trim();

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
            boxShadow: appliedShadow,
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
          boxShadow: appliedShadow,
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
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-cover bg-center bg-no-repeat",
        className,
      )}
      style={{
        background: backgroundStyle,
        isolation: "isolate",
      }}
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

        {/* Content based on image position */}
        {textVariant === "left" && (
          <>
            {/* Text on left */}
            <div
              className="absolute left-14 z-10 space-y-4"
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "text-balance leading-tight")}
                  style={{ ...titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-balance")} style={subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
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
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "text-right text-balance leading-tight")}
                  style={{ ...titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p
                  className={cn(subtitleClassName, "text-right text-balance")}
                  style={subtitleStyle}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
          </>
        )}

        {textVariant === "center" && (
          <>
            <div
              className="absolute left-1/2 z-10 w-[calc(100%-96px)] max-w-6xl -translate-x-1/2 px-8 text-center space-y-4"
              style={centerTextRegionStyle}
            >
              {title ? (
                <h1
                  className={cn(titleClassName, "whitespace-nowrap leading-tight")}
                  style={{ ...titleStyle, lineHeight: 1.05 }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-balance")} style={subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Screenshot centered, popping up from bottom */}
            {renderScreenshot("center")}
          </>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PopupGradient = memo(PopupGradientComponent);
