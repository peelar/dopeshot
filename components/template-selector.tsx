"use client";

import { useMemo } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { TEMPLATES } from "@/domain/layout/templates";
import { Asset } from "@/domain/asset/types";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { cn } from "@/utils";

interface TemplateSelectorProps {
  currentConfig: LayoutConfig;
  onSelect: (config: LayoutConfig) => void;
  assets: Asset[];
  className?: string;
}

// Memoize template default configs at module level to avoid recreation
const TEMPLATE_DEFAULTS = TEMPLATES.flatMap((template) =>
  template.variants.map((variant) => ({
    template,
    variant,
    defaultConfig: template.createConfig(),
    key: `${template.id}-${variant}`,
    displayName: `${template.name} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
  }))
);

export function TemplateSelector({
  currentConfig,
  onSelect,
  assets,
  className,
}: TemplateSelectorProps) {
  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across variant switches
  const previewConfigs = useMemo(() => {
    return TEMPLATE_DEFAULTS.map(({ defaultConfig, variant, key, displayName, template }) => ({
      key,
      displayName,
      templateId: template.id,
      variant,
      previewConfig: {
        ...defaultConfig,
        variant,
        text: currentConfig.text,
        assets: currentConfig.assets,
        background: currentConfig.background,
        colors: currentConfig.colors,
        screenshotShadow: currentConfig.screenshotShadow,
      } as LayoutConfig,
    }));
  }, [currentConfig.text, currentConfig.assets, currentConfig.background, currentConfig.colors, currentConfig.screenshotShadow]);

  return (
    <div className={cn("flex w-full gap-4 overflow-x-auto p-4 bg-muted/20 border-b border-border", className)}>
      {previewConfigs.map(({ key, displayName, templateId, variant, previewConfig }) => {
        const isSelected =
          currentConfig.templateId === templateId &&
          currentConfig.variant === variant;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(previewConfig)}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border-2 p-1 transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isSelected
                ? "border-primary bg-muted"
                : "border-transparent hover:border-border"
            )}
            aria-pressed={isSelected}
            aria-label={`Select ${displayName} template`}
          >
            <div className="relative h-[90px] w-[160px] overflow-hidden rounded bg-background shadow-sm ring-1 ring-border/10">
              <PreviewViewport surfaceWidth={1280} surfaceHeight={720}>
                <CoverPreview config={previewConfig} assets={assets} />
              </PreviewViewport>
              {/* Overlay to prevent interactions within the preview */}
              <div className="absolute inset-0 z-10 bg-transparent" />
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isSelected
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {displayName}
            </span>
          </button>
        );
      })}
    </div>
  );
}

