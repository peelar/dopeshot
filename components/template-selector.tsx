"use client";

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

export function TemplateSelector({
  currentConfig,
  onSelect,
  assets,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn("flex w-full gap-4 overflow-x-auto p-4 bg-muted/20 border-b border-border", className)}>
      {TEMPLATES.flatMap((template) =>
        template.variants.map((variant) => {
          const templateDefaultConfig = template.createConfig();

          // Create a preview config that uses the template's defaults for layout/colors
          // but forces the specific variant and preserves the user's content
          const previewConfig: LayoutConfig = {
            ...templateDefaultConfig,
            variant: variant,
            text: currentConfig.text,
            assets: currentConfig.assets,
          };

          const isSelected =
            currentConfig.templateId === template.id &&
            currentConfig.variant === variant;
          
          // Create a unique key for the button
          const key = `${template.id}-${variant}`;
          
          // Generate a display name for the variant
          const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);
          const displayName = `${template.name} ${variantName}`;

          return (
            <button
              key={key}
              onClick={() => onSelect(previewConfig)}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border-2 p-1 transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-muted"
                  : "border-transparent hover:border-border"
              )}
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
        })
      )}
    </div>
  );
}

