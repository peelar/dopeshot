import { useMemo, type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils/cn";
import { getFontStyleCssValue } from "@/domain/layout/fonts";
import { getAdaptiveTypography } from "@/domain/layout/adaptive-typography";
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

export function useLayoutPrimitives() {
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const logo = useAtomValue(logoAssetAtom);
  const screenshotZoom = useAtomValue(screenshotZoomAtom);
  const orientation = useAtomValue(orientationAtom);

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);

  // Get font family from font style
  const fontFamily = useMemo(() => getFontStyleCssValue(config.fontStyle), [config.fontStyle]);
  const textColorClass = useMemo(() => tokenToTextColorClass(config.colors.text), [config.colors.text]);

  // Get adaptive typography based on font style and text content
  const adaptiveTypography = useMemo(() => {
    const titleText = config.text.title?.trim();
    const subtitleText = config.text.subtitle?.trim();

    return getAdaptiveTypography(config.fontStyle, fontFamily, titleText, subtitleText);
  }, [config.fontStyle, fontFamily, config.text.title, config.text.subtitle]);

  const text = useMemo(
    () => ({
      title: config.text.title?.trim(),
      subtitle: config.text.subtitle?.trim(),
      titleStyle: adaptiveTypography.titleStyle,
      subtitleStyle: adaptiveTypography.subtitleStyle,
      containerClasses: adaptiveTypography.containerClasses,
      titleClasses: adaptiveTypography.titleClasses,
      subtitleClasses: adaptiveTypography.subtitleClasses,
      fontFamily,
      textColorClass,
    }),
    [
      config.text.title,
      config.text.subtitle,
      adaptiveTypography.titleStyle,
      adaptiveTypography.subtitleStyle,
      adaptiveTypography.containerClasses,
      adaptiveTypography.titleClasses,
      adaptiveTypography.subtitleClasses,
      fontFamily,
      textColorClass,
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
