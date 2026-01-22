import { memo, useMemo, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils/cn";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { orientationAtom } from "@/hooks/atoms";

// Desktop dimensions (16:9)
const SIDE_CONTENT_TOP_DESKTOP = "30%";
const CENTER_CONTENT_TOP_DESKTOP = "15%";
const CENTER_SCREENSHOT_TOP_DESKTOP = "40%";
const CENTER_SCREENSHOT_GUTTER_DESKTOP = 0.07;
const SCREENSHOT_FRAME_WIDTH_DESKTOP = "62%";

// Mobile dimensions (9:16) - bigger screenshot coverage
const SIDE_CONTENT_TOP_MOBILE = "20%";
const CENTER_CONTENT_TOP_MOBILE = "12%";
const CENTER_SCREENSHOT_TOP_MOBILE = "35%";
const CENTER_SCREENSHOT_GUTTER_MOBILE = 0; // No side margins on mobile
const SCREENSHOT_FRAME_WIDTH_MOBILE = "85%"; // Screenshots "peak" from the side, not full width

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

const PEAK_CORNER_RADIUS = "16px";

// Minimum zoom values to ensure screenshot always fills the frame
// These are calculated based on: minZoom >= 1.0 / baseScale
const MIN_ZOOM_CENTER = 1.0; // No base scale for center variant
const MIN_ZOOM_SIDE = 1.0 / SIDE_SCREENSHOT_ZOOM; // ≈ 0.74 for side variants

function getPeakBorderRadius(placement: "left" | "right" | "center", radius: string) {
  switch (placement) {
    case "left":
      return `${radius} 0 0 0`;
    case "right":
      return `0 ${radius} 0 0`;
    case "center":
    default:
      return `${radius} ${radius} 0 0`;
  }
}

/**
 * Clamps the screenshot zoom to ensure the image always fills the container.
 * For center variant: minimum is 1.0 (no zoom out)
 * For side variants: minimum is ~0.74 (accounts for base 1.35x scale)
 */
function getClampedZoom(screenshotZoom: number, placement: "left" | "right" | "center"): number {
  const minZoom = placement === "center" ? MIN_ZOOM_CENTER : MIN_ZOOM_SIDE;
  return Math.max(minZoom, screenshotZoom);
}

interface PopupGradientProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function PopupGradientComponent({ className, onUploadAsset, isStatic = false }: PopupGradientProps) {
  const orientation = useAtomValue(orientationAtom);
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

  // Use personality-driven corner radius if available, otherwise default
  const peakCornerRadius = cornerRadius ? `${cornerRadius}px` : PEAK_CORNER_RADIUS;

  // Use layout-specific fade state, defaulting to false for Peak layout
  const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
  const fadeEnabled = layoutSpecificFadeEnabled ?? false;

  // Responsive dimensions based on orientation
  const isMobile = orientation === "mobile";
  const SIDE_CONTENT_TOP = isMobile ? SIDE_CONTENT_TOP_MOBILE : SIDE_CONTENT_TOP_DESKTOP;
  const CENTER_CONTENT_TOP = isMobile ? CENTER_CONTENT_TOP_MOBILE : CENTER_CONTENT_TOP_DESKTOP;
  const CENTER_SCREENSHOT_TOP = isMobile ? CENTER_SCREENSHOT_TOP_MOBILE : CENTER_SCREENSHOT_TOP_DESKTOP;
  const CENTER_SCREENSHOT_GUTTER = isMobile ? CENTER_SCREENSHOT_GUTTER_MOBILE : CENTER_SCREENSHOT_GUTTER_DESKTOP;

  const textColumnStyle: CSSProperties = useMemo(() => ({ width: "min(420px, calc(45%))" }), []);

  const textVariant: "left" | "right" | "center" = (() => {
    if (config.variant === "left" || config.variant === "center") return config.variant;
    if (config.variant === "right") return "right";
    return "right";
  })();

  // Hide text on mobile for Peak Left/Right (only show on Peak Center)
  const shouldShowText = !(isMobile && (textVariant === "left" || textVariant === "right"));
  const title = shouldShowText ? text.title : undefined;
  const subtitle = shouldShowText ? text.subtitle : undefined;

  // Adaptive typography classes
  const titleClassName = cn(text.titleClasses, text.textColorClass);
  const subtitleClassName = cn(text.subtitleClasses, "mt-4", text.textColorClass);

  const screenshotFrameWidth = useMemo(() => {
    if (textVariant === "center") {
      return "100%";
    }
    // On mobile, use full width for side variants (left/right)
    return isMobile ? SCREENSHOT_FRAME_WIDTH_MOBILE : SCREENSHOT_FRAME_WIDTH_DESKTOP;
  }, [textVariant, isMobile]);

  const centerTextRegionStyle = useMemo(
    () => ({
      top: CENTER_CONTENT_TOP,
      height: `calc(${CENTER_SCREENSHOT_TOP} - ${CENTER_CONTENT_TOP} - ${CENTER_TEXT_GUTTER_PX}px)`,
    }),
    [CENTER_CONTENT_TOP, CENTER_SCREENSHOT_TOP],
  );

  const renderScreenshot = (placement: "left" | "right" | "center") => {
    if (!screenshot) return null;

    // Clamp zoom to ensure screenshot always fills the frame
    const clampedZoom = getClampedZoom(screenshotZoom, placement);

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
            borderRadius: getPeakBorderRadius("center", peakCornerRadius),
            background: "transparent",
            boxShadow: screenshotShadow,
          }}
        >
          <div className="flex h-full w-full items-start justify-center">
            <img
              src={screenshot.url}
              alt="Screenshot"
              data-export-element
              data-element="screenshot"
              data-role="screenshot"
              className="block h-full w-full object-cover"
              style={{
                objectPosition: "top",
                transform: `scale(${clampedZoom})`,
                transformOrigin: "top center",
                ...(fadeEnabled && {
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
                }),
              }}
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
          borderRadius: getPeakBorderRadius(placement, peakCornerRadius),
          background: "transparent",
          boxShadow: screenshotShadow,
        }}
      >
        <img
          src={screenshot.url}
          alt="Screenshot"
          data-export-element
          data-element="screenshot"
          data-role="screenshot"
          className="block h-full w-full object-cover"
          style={{
            objectPosition,
            transform: `scale(${SIDE_SCREENSHOT_ZOOM * clampedZoom})`,
            transformOrigin: SIDE_SCREENSHOT_TRANSFORM_ORIGINS[placement],
            ...(fadeEnabled && {
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.05) 100%)",
            }),
          }}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <LayoutSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={screenshot}
    >
      <div className="relative z-10 h-full w-full" data-export-element data-element="container">
        <div
          className={cn(
            "absolute top-8 z-10 flex items-center",
            textVariant === "right" ? "right-14 justify-end" : "left-14 justify-start",
          )}
        >
          {logo ? (
            <img
              src={logo.url}
              alt="Logo"
              className="h-8 w-auto max-w-[200px] object-contain"
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
              className={cn("absolute left-14 z-10 space-y-4", text.containerClasses)}
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1 className={titleClassName} style={text.titleStyle}>
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={subtitleClassName} style={text.subtitleStyle}>
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
              className={cn("absolute right-14 z-10 text-right", text.containerClasses)}
              style={{ ...textColumnStyle, top: SIDE_CONTENT_TOP, bottom: "18%" }}
            >
              {title ? (
                <h1 className={cn(titleClassName, "text-right")} style={text.titleStyle}>
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn(subtitleClassName, "text-right")} style={text.subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </>
        )}

        {textVariant === "center" && (
          <>
            <div
              className={cn(
                "absolute left-1/2 z-10 w-[calc(100%-96px)] max-w-6xl -translate-x-1/2 space-y-4 px-8 text-center",
                text.containerClasses,
              )}
              style={centerTextRegionStyle}
            >
              {title ? (
                <h1 className={titleClassName} style={text.titleStyle}>
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={subtitleClassName} style={text.subtitleStyle}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {renderScreenshot("center")}
          </>
        )}
      </div>
    </LayoutSurface>
  );
}

export const PopupGradient = memo(PopupGradientComponent);
