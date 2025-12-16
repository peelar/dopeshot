import { useMemo, type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { getScreenshotTreatment } from "@/domain/layout/screenshot-mode";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";
import { configAtom, assetsAtom, screenshotZoomAtom, orientationAtom } from "@/hooks/atoms";
import { logoAssetAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import { getBackgroundStyle } from "./background-style";
import { tokenToTextColorClass } from "./color-utils";
import { getShadowValue } from "./shadows";
import { PatternOverlay } from "./PatternOverlay";

// Font size scale factor for mobile orientation (9:16)
// Mobile gets smaller font sizes to fit the taller, narrower format
const MOBILE_FONT_SCALE = 0.75;

export function useLayoutPrimitives() {
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const logo = useAtomValue(logoAssetAtom);
  const screenshotZoom = useAtomValue(screenshotZoomAtom);
  const orientation = useAtomValue(orientationAtom);

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);

  const fontSize = useMemo(() => getFontSizeById(config.fontSize), [config.fontSize]);
  const fontFamily = useMemo(() => getFontCssValue(config.fontId), [config.fontId]);
  const textColorClass = useMemo(() => tokenToTextColorClass(config.colors.text), [config.colors.text]);

  // Scale font sizes down for mobile orientation
  const fontScale = orientation === "mobile" ? MOBILE_FONT_SCALE : 1.0;

  const text = useMemo(
    () => ({
      title: config.text.title?.trim(),
      subtitle: config.text.subtitle?.trim(),
      titleStyle: { fontFamily, fontSize: `${fontSize.titleRem * fontScale}rem` },
      subtitleStyle: { fontFamily, fontSize: `${fontSize.subtitleRem * fontScale}rem` },
      fontFamily,
      fontSize,
      textColorClass,
    }),
    [
      config.text.subtitle,
      config.text.title,
      fontFamily,
      fontSize.subtitleRem,
      fontSize.titleRem,
      textColorClass,
      fontScale,
    ],
  );

  const screenshotTreatment = useMemo(() => getScreenshotTreatment(config), [config]);
  const screenshotShadow = useMemo(() => {
    if (screenshotTreatment.shadowEnabled === false) return undefined;
    return getShadowValue(config.screenshotShadow);
  }, [config.screenshotShadow, screenshotTreatment.shadowEnabled]);

  const layoutDefinition = getLayoutDefinition(config.layoutId);
  const zoomBehavior = layoutDefinition?.capabilities.zoomBehavior ?? "scale-container";

  return {
    config,
    assets,
    assetMap,
    backgroundStyle,
    screenshot,
    logo,
    text,
    screenshotTreatment,
    screenshotShadow,
    screenshotZoom,
    zoomBehavior,
  };
}

interface LayoutSurfaceProps {
  className?: string;
  backgroundStyle: string;
  assets: Asset[];
  config: LayoutConfig;
  assetMap: Map<string, Asset>;
  screenshot?: Asset;
  children: ReactNode;
}

export function LayoutSurface({
  className,
  backgroundStyle,
  assets,
  config,
  assetMap,
  screenshot,
  children,
}: LayoutSurfaceProps) {
  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundStyle, isolation: "isolate" }}
    >
      <PatternOverlay config={config} assets={assets} assetMap={assetMap} screenshotAsset={screenshot} />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
