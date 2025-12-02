"use client";

import { useMemo } from "react";
import { useAtomValue, useSetAtom, Provider, createStore } from "jotai";
import { TEMPLATES, withTemplateTextDefaults } from "@/domain/layout/templates";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { cn } from "@/utils";
import { Type } from "lucide-react";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";

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

export function TemplateSelector({ className }: { className?: string }) {
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setConfig = useSetAtom(configAtom);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across template switches
  const previewConfigs = useMemo(() => {
    return TEMPLATE_DEFAULTS.map(
      ({ defaultConfig, defaultVariant, key, displayName, template }) => {
        const isTextTemplate = template.capabilities.text.headline !== "hidden";
        const previewConfig = withTemplateTextDefaults(
          {
            ...defaultConfig,
            variant: defaultVariant,
            text: currentConfig.text,
            assets: currentConfig.assets,
            background: currentConfig.background,
            colors: currentConfig.colors,
            screenshotShadow: currentConfig.screenshotShadow,
            fontId: currentConfig.fontId,
            fontSize: currentConfig.fontSize,
            screenshotFrame: currentConfig.screenshotFrame,
          } as typeof currentConfig,
          { preserveEmptyText: true },
        );

        return {
          key,
          displayName,
          templateId: template.id,
          previewConfig,
          showTextIcon: isTextTemplate,
        };
      },
    );
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontId,
    currentConfig.fontSize,
    currentConfig.screenshotShadow,
    currentConfig.screenshotFrame,
    currentConfig.text,
  ]);

  return (
    <div
      className={cn(
        "flex w-full gap-4 overflow-x-auto border-b border-border bg-muted/20 p-4",
        className,
      )}
    >
      {previewConfigs.map(({ key, displayName, templateId, previewConfig, showTextIcon }) => {
        const isSelected = currentConfig.templateId === templateId;

        const handleSelect = () =>
          setConfig(
            withTemplateTextDefaults(
              {
                ...previewConfig,
                variant: previewConfig.variant,
              },
              { preserveEmptyText: true },
            ),
          );

        // Create isolated store for each preview
        const previewStore = useMemo(() => {
          const store = createStore();
          store.set(configAtom, previewConfig);
          store.set(assetsAtom, assets);
          return store;
        }, [previewConfig]);

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
                <Provider store={previewStore}>
                  <CoverPreview />
                </Provider>
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
              {showTextIcon ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Type className="h-3 w-3" aria-hidden="true" />
                  Text
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
