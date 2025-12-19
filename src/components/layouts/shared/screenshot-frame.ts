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

function roundedRadius(_isFocused: boolean) {
  return "16px";
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
}: {
  preset?: ScreenshotFramePreset;
  isFocused?: boolean;
  shadowEnabled?: boolean;
  shape?: FrameShape;
}): ScreenshotFrameAppearance {
  if (preset === "soft-glass") {
    const radius = shape === "rounded" ? roundedRadius(isFocused) : "0px";
    const padding =
      shape === "rounded"
        ? isFocused
          ? ROUNDED_PADDING.focused
          : ROUNDED_PADDING.default
        : isFocused
          ? RECT_PADDING.focused
          : RECT_PADDING.default;
    return {
      style: {
        background: GLASS_BACKGROUND,
        border: "1px solid rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: radius,
        padding,
      },
      shadow: shadowEnabled ? "0 18px 42px rgba(15, 23, 42, 0.35)" : undefined,
      contentRadius: radius,
    };
  }

  const radius = shape === "rounded" ? roundedRadius(isFocused) : "0px";
  return {
    style: {
      background: "transparent",
      borderRadius: radius,
      padding: "0px",
    },
    shadow: shadowEnabled
      ? shape === "rounded"
        ? "0 24px 55px rgba(15, 23, 42, 0.35)"
        : "0 16px 36px rgba(15, 23, 42, 0.2)"
      : undefined,
    contentRadius: radius,
  };
}
