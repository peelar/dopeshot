import type React from "react";
import {
  LayoutConfig,
  BackgroundPrimitive,
  TextBlockPrimitive,
  ScreenshotPrimitive,
} from "@/domain/layout/types";
import {
  resolveBackgroundColor,
  resolveBorderRadius,
  resolveFontSize,
  resolveFontWeight,
  resolveHorizontalAlign,
  resolveShadow,
  resolveTextColor,
  resolveVerticalAlign,
  tokenToCssColor,
} from "@/domain/layout/theme";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";

interface CoverPreviewProps {
  config: LayoutConfig;
  className?: string;
  assets?: Asset[];
}

export function CoverPreview({ config, className, assets = [] }: CoverPreviewProps) {
  const { primitives, gridColumns, gridRows, theme } = config;

  // Create asset map for quick lookup
  const assetMap = new Map<string, Asset>();
  assets.forEach((asset) => assetMap.set(asset.id, asset));

  // Sort primitives by zIndex
  const sortedPrimitives = [...primitives].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-slate-200",
        className,
      )}
      style={{
        aspectRatio: "1200 / 630", // Standard OG Image ratio
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          backgroundColor: config.theme.backgroundColor.startsWith("slate-")
            ? undefined // handled by class if token
            : config.theme.backgroundColor, // fallback if hex
        }}
      >
        {/* Global Background from Theme (if not covered by primitives) */}
        <div
          className={cn("absolute inset-0 -z-10", resolveBackgroundColor(theme.backgroundColor))}
        />

        {sortedPrimitives.map((primitive) => {
          const style = {
            gridColumnStart: primitive.gridColumnStart,
            gridColumnEnd: primitive.gridColumnEnd,
            gridRowStart: primitive.gridRowStart,
            gridRowEnd: primitive.gridRowEnd,
          };

          if (primitive.type === "background") {
            const p = primitive as BackgroundPrimitive;
            const backgroundStyle: React.CSSProperties = { ...style };

            if (p.variant === "solid") {
              // Solid backgrounds can use Tailwind classes
              return (
                <div
                  key={p.id}
                  style={backgroundStyle}
                  className={cn("h-full w-full", resolveBackgroundColor(p.colorPrimary))}
                />
              );
            }

            if (p.variant === "gradientLinear") {
              // Gradients must use inline styles since Tailwind can't handle dynamic class names
              const color1 = tokenToCssColor(p.colorPrimary);
              const color2 = tokenToCssColor(p.colorSecondary || p.colorPrimary);
              backgroundStyle.background = `linear-gradient(${p.gradientAngleDeg || 135}deg, ${color1}, ${color2})`;

              return <div key={p.id} style={backgroundStyle} className="h-full w-full" />;
            }

            // Fallback for other variants
            return <div key={p.id} style={backgroundStyle} className="h-full w-full" />;
          }

          if (primitive.type === "textBlock") {
            const p = primitive as TextBlockPrimitive;
            return (
              <div
                key={p.id}
                style={style}
                className={cn(
                  "flex flex-col p-4",
                  resolveHorizontalAlign(p.horizontalAlign),
                  resolveVerticalAlign(p.verticalAlign),
                )}
              >
                <span
                  className={cn(
                    resolveFontSize(p.fontSizeToken),
                    resolveFontWeight(p.fontWeightToken),
                    resolveTextColor(theme.textColor), // Currently using theme text color, could be primitive specific if added later
                  )}
                >
                  {p.text}
                </span>
              </div>
            );
          }

          if (primitive.type === "screenshot") {
            const p = primitive as ScreenshotPrimitive;
            return (
              <div
                key={p.id}
                style={style}
                className={cn(
                  "relative flex h-full w-full items-center justify-center overflow-hidden",
                  p.cropStyle === "bottomCut" ? "items-end" : "items-center",
                )}
              >
                <div
                  className={cn(
                    "relative h-full w-full overflow-hidden bg-slate-100",
                    resolveShadow(p.shadowStyle),
                    resolveBorderRadius(p.borderRadiusPx),
                  )}
                  style={{
                    borderColor: theme.screenshotFrameColor, // TODO: resolve if token
                    borderWidth: 1,
                  }}
                >
                  {p.assetId ? (
                    (() => {
                      const asset = assetMap.get(p.assetId);
                      return asset ? (
                        <img
                          src={asset.url}
                          alt="Screenshot"
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                          <span className="text-xs">Asset not found</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
