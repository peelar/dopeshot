import { memo, useMemo } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { InlineEditableText } from "@/components/templates/shared/InlineEditableText";
import { LogoBadge } from "@/components/templates/shared/LogoBadge";
import { tokenToTextColorClass } from "@/components/templates/shared/color-utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";
import { getBackgroundStyle } from "@/components/templates/shared/background-style";
import { getShadowValue } from "@/components/templates/shared/shadows";

interface HeroCenterProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
  onTextChange?: (field: "title" | "subtitle", value: string) => void;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function HeroCenterComponent({
  config,
  assets = [],
  className,
  onTextChange,
  onUploadAsset,
  isStatic = false,
}: HeroCenterProps) {
  const { screenshot, logo, assetMap } = useMemo(() => {
    const map = new Map(assets.map((asset) => [asset.id, asset]));
    return {
      assetMap: map,
      screenshot: config.assets.screenshot ? map.get(config.assets.screenshot) : null,
      logo: config.assets.logo ? map.get(config.assets.logo) : null,
    };
  }, [assets, config.assets.logo, config.assets.screenshot]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(config, assetMap), [config, assetMap]);
  const fontSize = getFontSizeById(config.fontSize);
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem`, lineHeight: 1.05 };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const shadowStyle = getShadowValue(config.screenshotShadow);
  const screenshotAspect = screenshot?.metadata?.aspectRatio || 1;

  const variant = config.variant === "right" ? "right" : "left";

  const renderLogo = () => {
    if (logo) {
      return (
        <img src={logo.url} alt="Logo" className="h-9 w-auto object-contain" crossOrigin="anonymous" />
      );
    }

    if (!onUploadAsset || isStatic) {
      return null;
    }

    return (
      <LogoBadge
        logo={logo}
        label="Drop your logo here"
        replaceLabel="Replace logo"
        onUploadLogo={(file) => onUploadAsset(file, "logo")}
      />
    );
  };

  const renderTextBlock = (align: "left" | "center" | "right") => {
    const alignmentClass =
      align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    return (
      <div className={cn("space-y-4", alignmentClass)}>
        <InlineEditableText
          element="h1"
          field="title"
          value={config.text.title}
          placeholder="Bring the heat"
          className={cn("font-semibold", fontSize.titleClass, textColorClass)}
          style={titleStyle}
          ariaLabel="Edit title"
          onTextChange={onTextChange}
        />
        {(config.text.subtitle || onTextChange) && (
          <InlineEditableText
            element="p"
            field="subtitle"
            value={config.text.subtitle}
            placeholder="Tell a short story"
            className={cn("opacity-90", fontSize.subtitleClass, textColorClass)}
            style={subtitleStyle}
            ariaLabel="Edit subtitle"
            onTextChange={onTextChange}
          />
        )}
      </div>
    );
  };

  const renderScreenshot = () =>
    screenshot ? (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="relative flex w-full max-w-[640px] items-center justify-center overflow-hidden rounded-[32px]"
          style={{
            boxShadow: shadowStyle,
            height: "min(520px, calc(100% - 160px))",
          }}
        >
          <img
            src={screenshot.url}
            alt="Screenshot"
            className="h-full w-full object-contain"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    ) : null;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ aspectRatio: "1280 / 720", background: backgroundStyle }}
    >
      <div
        className={cn(
          "absolute top-8 z-10 flex items-center gap-2",
          variant === "right" ? "right-14" : "left-14",
        )}
      >
        {renderLogo()}
      </div>

      <div className="flex h-full w-full items-center justify-center px-12 py-16">
        <div className="flex w-full max-w-5xl items-center gap-12">
          {variant === "left" ? (
            <>
              <div className="flex-1 max-w-md">{renderTextBlock("left")}</div>
              {renderScreenshot()}
            </>
          ) : (
            <>
              {renderScreenshot()}
              <div className="flex-1 max-w-md">{renderTextBlock("right")}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const HeroCenter = memo(HeroCenterComponent);
