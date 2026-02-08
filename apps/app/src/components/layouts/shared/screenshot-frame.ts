import { CSSProperties } from "react";
import { FrameShape, ScreenshotFramePreset } from "@/domain/layout/types";

const GLASS_BACKGROUND = "rgba(255, 255, 255, 0.14)";
const ROUNDED_PADDING = {
  focused: "10px",
  default: "8px",
};
const RECT_PADDING = {
  focused: "8px",
  default: "6px",
};

/** Default corner radius when no personality override is provided */
const DEFAULT_CORNER_RADIUS = 8;

function roundedRadius(customRadius?: number) {
  const radius = customRadius ?? DEFAULT_CORNER_RADIUS;
  return `${radius}px`;
}

export type ScreenshotFrameAppearance = {
  style: CSSProperties;
  shadow?: string;
  contentRadius: string;
};

export function getScreenshotFrameAppearance({
  preset = "soft-glass",
  isFocused = false,
  shadowEnabled = true,
  shape = "rounded",
  cornerRadius,
  customShadow,
}: {
  preset?: ScreenshotFramePreset;
  isFocused?: boolean;
  shadowEnabled?: boolean;
  shape?: FrameShape;
  /** Override corner radius (from personality style) */
  cornerRadius?: number;
  /** Override shadow CSS (from personality style) */
  customShadow?: string;
}): ScreenshotFrameAppearance {
  if (preset === "soft-glass") {
    const radius = shape === "rounded" ? roundedRadius(cornerRadius) : "0px";
    const padding =
      shape === "rounded"
        ? isFocused
          ? ROUNDED_PADDING.focused
          : ROUNDED_PADDING.default
        : isFocused
          ? RECT_PADDING.focused
          : RECT_PADDING.default;
    
    // Use custom shadow if provided, otherwise fall back to default
    const shadow = shadowEnabled
      ? customShadow ?? "0 18px 42px rgba(15, 23, 42, 0.35)"
      : undefined;

    return {
      style: {
        background: GLASS_BACKGROUND,
        border: "1px solid rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: radius,
        padding,
      },
      shadow,
      contentRadius: radius,
    };
  }

  const radius = shape === "rounded" ? roundedRadius(cornerRadius) : "0px";
  
  // Use custom shadow if provided, otherwise fall back to defaults
  let shadow: string | undefined;
  if (shadowEnabled) {
    if (customShadow) {
      shadow = customShadow;
    } else {
      shadow = shape === "rounded"
        ? "0 24px 55px rgba(15, 23, 42, 0.35)"
        : "0 16px 36px rgba(15, 23, 42, 0.2)";
    }
  }

  return {
    style: {
      background: "transparent",
      borderRadius: radius,
      padding: "0px",
    },
    shadow,
    contentRadius: radius,
  };
}
