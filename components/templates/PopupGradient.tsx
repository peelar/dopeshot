import type React from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";

interface PopupGradientProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
}

// Map color tokens to CSS color values
function tokenToCssColor(token: string): string {
  const colorMap: Record<string, string> = {
    "slate-50": "rgb(248 250 252)",
    "slate-100": "rgb(241 245 249)",
    "slate-200": "rgb(226 232 240)",
    "slate-300": "rgb(203 213 225)",
    "slate-500": "rgb(100 116 139)",
    "slate-600": "rgb(71 85 105)",
    "slate-800": "rgb(30 41 59)",
    "slate-900": "rgb(15 23 42)",
    "zinc-50": "rgb(250 250 250)",
    "zinc-200": "rgb(228 228 231)",
    "zinc-900": "rgb(24 24 27)",
    "indigo-50": "rgb(238 242 255)",
    "indigo-400": "rgb(129 140 248)",
    "indigo-950": "rgb(23 37 84)",
    "violet-400": "rgb(167 139 250)",
    "violet-500": "rgb(139 92 246)",
  };
  return colorMap[token] || "rgb(248 250 252)";
}

// Map color tokens to Tailwind text color classes
function tokenToTextColorClass(token: string): string {
  const classMap: Record<string, string> = {
    "slate-50": "text-slate-50",
    "slate-100": "text-slate-100",
    "slate-200": "text-slate-200",
    "slate-300": "text-slate-300",
    "slate-500": "text-slate-500",
    "slate-600": "text-slate-600",
    "slate-800": "text-slate-800",
    "slate-900": "text-slate-900",
    "zinc-50": "text-zinc-50",
    "zinc-200": "text-zinc-200",
    "zinc-900": "text-zinc-900",
    "indigo-50": "text-indigo-50",
    "indigo-400": "text-indigo-400",
    "indigo-950": "text-indigo-950",
    "violet-400": "text-violet-400",
    "violet-500": "text-violet-500",
  };
  return classMap[token] || "text-slate-900";
}

export function PopupGradient({ config, assets = [], className }: PopupGradientProps) {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const screenshot = config.assets.screenshot ? assetMap.get(config.assets.screenshot) : null;
  const logo = config.assets.logo ? assetMap.get(config.assets.logo) : null;

  const bgColor1 = tokenToCssColor(config.colors.background);
  const bgColor2 = tokenToCssColor(config.colors.accent);

  // Variant determines image position: "left", "right", or "center"
  const imagePosition = config.variant || "right";

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        aspectRatio: "1280 / 720",
        background: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`,
      }}
    >
      {/* Logo */}
      {logo && (
        <div className="absolute left-8 top-8 z-10">
          <img
            src={logo.url}
            alt="Logo"
            className="h-12 w-auto object-contain"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Content based on image position */}
      {imagePosition === "right" && (
        <>
          {/* Text on left */}
          <div className="absolute left-8 top-[30%] z-10 max-w-lg">
            <h1 className={cn("text-4xl font-bold", tokenToTextColorClass(config.colors.text))}>
              {config.text.title}
            </h1>
            {config.text.subtitle && (
              <p className={cn("mt-4 text-lg", tokenToTextColorClass(config.colors.text))}>
                {config.text.subtitle}
              </p>
            )}
          </div>

          {/* Screenshot on right, popping up from bottom */}
          {screenshot && (
            <div
              className="absolute bottom-0 right-0 z-5 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "0px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}

      {imagePosition === "left" && (
        <>
          {/* Screenshot on left */}
          {screenshot && (
            <div
              className="absolute bottom-0 left-0 z-5 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Text on right */}
          <div className="absolute right-8 top-[30%] z-10 max-w-lg text-right">
            <h1 className={cn("text-4xl font-bold", tokenToTextColorClass(config.colors.text))}>
              {config.text.title}
            </h1>
            {config.text.subtitle && (
              <p className={cn("mt-4 text-lg", tokenToTextColorClass(config.colors.text))}>
                {config.text.subtitle}
              </p>
            )}
          </div>
        </>
      )}

      {imagePosition === "center" && (
        <>
          {/* Text on top */}
          <div className="absolute left-1/2 top-[12%] z-10 w-full max-w-2xl -translate-x-1/2 px-8 text-center">
            <h1 className={cn("text-5xl font-bold", tokenToTextColorClass(config.colors.text))}>
              {config.text.title}
            </h1>
            {config.text.subtitle && (
              <p className={cn("mt-4 text-xl", tokenToTextColorClass(config.colors.text))}>
                {config.text.subtitle}
              </p>
            )}
          </div>

          {/* Screenshot centered, popping up from bottom */}
          {screenshot && (
            <div
              className="absolute bottom-0 left-1/2 z-5 -translate-x-1/2 overflow-hidden"
              style={{
                width: "60%",
                height: "60%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

