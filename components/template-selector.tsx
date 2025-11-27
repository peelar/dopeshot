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
const TEMPLATE_DEFAULTS = TEMPLATES.map((template) => {
  const defaultConfig = template.createConfig();
  const defaultVariant = defaultConfig.variant || template.variants[0];

  return {
    template,
    defaultVariant,
    defaultConfig,
    key: template.id,
    displayName: template.name,
  };
});

export function TemplateSelector({
  currentConfig,
  onSelect,
  assets,
  className,
}: TemplateSelectorProps) {
  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across template switches
  const previewConfigs = useMemo(() => {
    return TEMPLATE_DEFAULTS.map(({ defaultConfig, defaultVariant, key, displayName, template }) => ({
      key,
      displayName,
      templateId: template.id,
      previewConfig: {
        ...defaultConfig,
        variant: defaultVariant,
        text: currentConfig.text,
        assets: currentConfig.assets,
        background: currentConfig.background,
        colors: currentConfig.colors,
        screenshotShadow: currentConfig.screenshotShadow,
        fontId: currentConfig.fontId,
        fontSize: currentConfig.fontSize,
      } as LayoutConfig,
      hasMultipleVariants: template.variants.length > 1,
      variantCount: template.variants.length,
      defaultVariant,
    }));
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontId,
    currentConfig.fontSize,
    currentConfig.screenshotShadow,
    currentConfig.text,
  ]);

  return (
    <div
      className={cn(
        "flex w-full gap-4 overflow-x-auto border-b border-border bg-muted/20 p-4",
        className,
      )}
    >
      {previewConfigs.map(
        ({ key, displayName, templateId, previewConfig, hasMultipleVariants, variantCount }) => {
          const isSelected = currentConfig.templateId === templateId;

          const handleSelect = () =>
            onSelect({
              ...previewConfig,
              // Reset to the template's primary layout while keeping user styling/content
              variant: previewConfig.variant,
            });

          return (
            <button
              key={key}
              type="button"
              onClick={handleSelect}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border-2 p-1 transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected ? "border-primary bg-muted" : "border-transparent hover:border-border",
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
              <div className="flex items-center justify-between gap-2 px-1">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {displayName}
                </span>
                {hasMultipleVariants ? (
                  <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {variantCount} layouts
                  </span>
                ) : null}
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
