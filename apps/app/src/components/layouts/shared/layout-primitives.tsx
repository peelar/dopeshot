import { useMemo, type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils/cn";
import { getFontStyleCssValue } from "@/domain/layout/fonts";
import { getAdaptiveTypography } from "@/domain/layout/adaptive-typography";
import { getScreenshotTreatment } from "@/domain/layout/screenshot-mode";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";
import { configAtom, assetsAtom, screenshotZoomAtom, orientationAtom } from "@/hooks/atoms";
import { logoAssetAtom, screenshotAssetAtom, personalityStyleAtom } from "@/hooks/atoms/derived";
import type { LayoutConfig, RichTextSegment } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import { getBackgroundStyle } from "./background-style";
import { tokenToTextColorClass } from "./color-utils";
import { getShadowValue, buildShadowFromStyle } from "./shadows";
import { PatternOverlay } from "./PatternOverlay";
import { renderRichTextSegments } from "./rich-text-render";
import {
  normalizeRichTextSegments,
  segmentsToPlainText,
} from "@/domain/layout/rich-text";

function resolveRichTextSegments(
  segments: RichTextSegment[] | undefined,
  fallbackText: string | undefined,
): RichTextSegment[] | undefined {
  const normalized = normalizeRichTextSegments(segments);
  if (!normalized.length) {
    return undefined;
  }

  const normalizedText = segmentsToPlainText(normalized).trim();
  if (!normalizedText.length) {
    return undefined;
  }

  if (!fallbackText || normalizedText === fallbackText) {
    return normalized;
  }

  return [{ text: fallbackText }];
}

export function useLayoutPrimitives() {
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const logo = useAtomValue(logoAssetAtom);
  const screenshotZoom = useAtomValue(screenshotZoomAtom);
  const orientation = useAtomValue(orientationAtom);
  const personalityStyle = useAtomValue(personalityStyleAtom);

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);

  // Determine effective font style: personality provides the default,
  // but user can override via sidebar font selector (which sets config.fontStyle)
  const effectiveFontStyle = useMemo(() => {
    // If user has explicitly set a font style in config, use it (override)
    if (config.fontStyle) {
      return config.fontStyle;
    }
    // If a personality is set, use its font style as the default
    if (personalityStyle) {
      return personalityStyle.fontStyle;
    }
    // Fallback to founder
    return "founder";
  }, [config.fontStyle, personalityStyle]);

  // Get font family from effective font style
  const fontFamily = useMemo(() => getFontStyleCssValue(effectiveFontStyle), [effectiveFontStyle]);
  const textColorClass = useMemo(() => tokenToTextColorClass(config.colors.text), [config.colors.text]);

  // Get adaptive typography based on font style and text content
  const adaptiveTypography = useMemo(() => {
    const titleText = config.text.title?.trim();
    const subtitleText = config.text.subtitle?.trim();

    return getAdaptiveTypography(effectiveFontStyle, fontFamily, titleText, subtitleText);
  }, [effectiveFontStyle, fontFamily, config.text.title, config.text.subtitle]);

  const title = useMemo(() => config.text.title?.trim(), [config.text.title]);
  const subtitle = useMemo(() => config.text.subtitle?.trim(), [config.text.subtitle]);

  const richTextSegments = useMemo(
    () => ({
      title: resolveRichTextSegments(config.layoutSpecificSettings?.richText?.title, title),
      subtitle: resolveRichTextSegments(config.layoutSpecificSettings?.richText?.subtitle, subtitle),
    }),
    [
      config.layoutSpecificSettings?.richText?.title,
      config.layoutSpecificSettings?.richText?.subtitle,
      subtitle,
      title,
    ],
  );

  const text = useMemo(
    () => ({
      title,
      subtitle,
      titleStyle: adaptiveTypography.titleStyle,
      subtitleStyle: adaptiveTypography.subtitleStyle,
      containerClasses: adaptiveTypography.containerClasses,
      titleClasses: adaptiveTypography.titleClasses,
      subtitleClasses: adaptiveTypography.subtitleClasses,
      fontFamily,
      textColorClass,
      titleContent: renderRichTextSegments(richTextSegments.title, title),
      subtitleContent: renderRichTextSegments(richTextSegments.subtitle, subtitle),
    }),
    [
      title,
      subtitle,
      adaptiveTypography.titleStyle,
      adaptiveTypography.subtitleStyle,
      adaptiveTypography.containerClasses,
      adaptiveTypography.titleClasses,
      adaptiveTypography.subtitleClasses,
      fontFamily,
      textColorClass,
      richTextSegments.title,
      richTextSegments.subtitle,
    ],
  );

  const screenshotTreatment = useMemo(() => getScreenshotTreatment(config), [config]);

  // Compute corner radius: personality style takes precedence as preset
  const cornerRadius = useMemo(() => {
    if (personalityStyle) {
      return personalityStyle.cornerRadius;
    }
    return undefined; // use default from screenshot-frame.ts
  }, [personalityStyle]);

  // Compute shadow: personality style takes precedence as preset
  const screenshotShadow = useMemo(() => {
    if (screenshotTreatment.shadowEnabled === false) return undefined;

    // If personality provides a shadow style, use it
    if (personalityStyle) {
      const customShadow = buildShadowFromStyle(personalityStyle.shadow);
      return customShadow !== "none" ? customShadow : undefined;
    }

    // Fall back to standard shadow presets
    return getShadowValue(config.screenshotShadow);
  }, [config.screenshotShadow, screenshotTreatment.shadowEnabled, personalityStyle]);

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
    // New personality-driven tokens
    personalityStyle,
    cornerRadius,
  };
}

interface LayoutSurfaceProps {
  className?: string;
  backgroundStyle: string;
  assets: Asset[];
  config: LayoutConfig;
  assetMap: Map<string, Asset>;
  screenshot?: Asset;
  disablePatternOverlay?: boolean;
  children: ReactNode;
}

export function LayoutSurface({
  className,
  backgroundStyle,
  assets,
  config,
  assetMap,
  screenshot,
  disablePatternOverlay = false,
  children,
}: LayoutSurfaceProps) {
  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundStyle, isolation: "isolate" }}
    >
      {!disablePatternOverlay ? <PatternOverlay config={config} /> : null}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
