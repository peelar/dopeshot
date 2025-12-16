"use client";

import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { Asset } from "@/domain/asset/types";
import type { LayoutConfig } from "@/domain/layout/types";
import {
  LAYOUT_DEFINITIONS,
  supportsScreenshots,
  withLayoutTextDefaults,
} from "@/domain/layout-def/definitions";
import {
  assetTypeAtom,
  assetsAtom,
  configAtom,
  lastLayoutByAssetTypeAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
  type AssetType,
} from "@/hooks/atoms";
import { cn } from "@/utils";
import { track } from "@/lib/analytics";
import { Provider, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";

// Memoize layout default configs at module level to avoid recreation
// Since layouts are now pre-flattened, each layout has exactly one variant baked in
const LAYOUT_DEFAULTS = LAYOUT_DEFINITIONS.map((layout) => {
  const defaultConfig = layout.createConfig();

  return {
    layout,
    defaultConfig,
    key: layout.id,
    displayName: layout.name,
  };
});

type PreviewCard = {
  key: string;
  displayName: string;
  layoutId: string;
  previewConfig: LayoutConfig;
};

export function LayoutSelector({ className }: { className?: string }) {
  const [assetType, setAssetType] = useAtom(assetTypeAtom);
  const [lastLayoutByAssetType, setLastLayoutByAssetType] = useAtom(lastLayoutByAssetTypeAtom);
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across layout switches
  // BUT reset gradient when switching to non-screenshot layouts
  const previewConfigs = useMemo(() => {
    const currentLayoutSupportsScreenshots = supportsScreenshots(currentConfig.layoutId);

    // Check if we have a stored screenshot gradient (persists across layout switches)
    const hasScreenshotGradient = screenshotGradient !== null;

    return LAYOUT_DEFAULTS.map(({ defaultConfig, key, displayName, layout }) => {
      const targetLayoutSupportsScreenshots = layout.capabilities.screenshot === "supported";

      // Determine background preservation strategy:
      // 1. If target look supports screenshots AND we have a screenshot gradient → use stored screenshot gradient
      // 2. If both looks have same screenshot support → preserve current background
      // 3. Otherwise → use default background
      let backgroundToUse;
      if (targetLayoutSupportsScreenshots && hasScreenshotGradient) {
        // Always use stored screenshot gradient for screenshot-capable looks
        backgroundToUse = screenshotGradient;
      } else if (currentLayoutSupportsScreenshots === targetLayoutSupportsScreenshots) {
        // Preserve background when staying in same category (screenshot→screenshot or non-screenshot→non-screenshot)
        backgroundToUse = currentConfig.background;
      } else {
        // Reset to default when switching categories without a screenshot gradient
        backgroundToUse = defaultConfig.background;
      }

      const previewConfig = withLayoutTextDefaults(
        {
          ...defaultConfig,
          // variant is already baked into defaultConfig by expandLayoutVariants
          text: currentConfig.text,
          assets: currentConfig.assets,
          background: backgroundToUse,
          colors: currentConfig.colors,
          screenshotShadow: currentConfig.screenshotShadow,
          fontId: currentConfig.fontId,
          fontSize: currentConfig.fontSize,
          screenshotFrame: currentConfig.screenshotFrame,
          // Preserve code snippet content, but fall back to default if undefined
          code: currentConfig.code ?? defaultConfig.code,
        } as typeof currentConfig,
        { preserveEmptyText: true },
      );

      return {
        key,
        displayName,
        layoutId: layout.id,
        previewConfig,
      };
    });
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontId,
    currentConfig.fontSize,
    currentConfig.layoutId,
    currentConfig.screenshotShadow,
    currentConfig.screenshotFrame,
    currentConfig.text,
    currentConfig.code,
    screenshotGradient,
  ]);

  const previewConfigByLayoutId = useMemo(() => {
    const map = new Map<string, LayoutConfig>();
    for (const option of previewConfigs) {
      map.set(option.layoutId, option.previewConfig);
    }
    return map;
  }, [previewConfigs]);

  const filteredPreviewConfigs = useMemo(() => {
    if (assetType === "code") {
      return previewConfigs.filter((option) => option.layoutId === "code-snippet");
    }
    return previewConfigs.filter((option) => supportsScreenshots(option.layoutId));
  }, [assetType, previewConfigs]);

  const applyLayoutSelection = useCallback(
    (layoutId: string, displayName?: string) => {
      const nextConfig = previewConfigByLayoutId.get(layoutId);
      if (!nextConfig) return;

      if (displayName) {
        track("look_changed", {
          from_look: currentConfig.layoutId,
          to_look: layoutId,
          look_name: displayName,
        });
      }

      setConfig(
        withLayoutTextDefaults(
          {
            ...nextConfig,
            // variant is already in nextConfig from the flattened layout definition
          },
          { preserveEmptyText: true },
        ),
      );
      setScreenshotZoom(1.0);
    },
    [currentConfig.layoutId, previewConfigByLayoutId, setConfig, setScreenshotZoom],
  );

  const handleAssetTypeChange = useCallback(
    (nextType: AssetType) => {
      setLastLayoutByAssetType((current) => ({
        ...current,
        [assetType]: currentConfig.layoutId,
      }));
      setAssetType(nextType);

      // Use flattened layout IDs with default variants
      const fallbackLayoutId = nextType === "code" ? "code-snippet" : "popup-gradient-right";
      const preferredLayoutId = lastLayoutByAssetType[nextType] ?? fallbackLayoutId;
      const nextLayoutId =
        nextType === "code"
          ? "code-snippet"
          : supportsScreenshots(preferredLayoutId)
            ? preferredLayoutId
            : fallbackLayoutId;

      setLastLayoutByAssetType((current) => ({ ...current, [nextType]: nextLayoutId }));
      applyLayoutSelection(nextLayoutId);
    },
    [
      applyLayoutSelection,
      assetType,
      currentConfig.layoutId,
      lastLayoutByAssetType,
      setAssetType,
      setLastLayoutByAssetType,
    ],
  );

  useEffect(() => {
    const currentIsCodeLayout = currentConfig.layoutId === "code-snippet";
    if (assetType === "code" && !currentIsCodeLayout) {
      handleAssetTypeChange("code");
    }
    if (assetType === "screenshot" && currentIsCodeLayout) {
      handleAssetTypeChange("screenshot");
    }
  }, [assetType, currentConfig.layoutId, handleAssetTypeChange]);

  return (
    <div className={cn("flex w-full flex-col gap-2 px-2 sm:px-4", className)}>
      <div className="flex items-center pt-4">
        <Select
          value={assetType}
          onValueChange={(value) => handleAssetTypeChange(value as AssetType)}
        >
          <SelectTrigger
            className={cn(
              "h-auto w-auto gap-1 border-0 bg-transparent px-0 py-0 shadow-none ring-offset-0 focus:ring-0 focus:ring-offset-0",
            )}
            aria-label="Select asset type"
          >
            <span className="text-sm font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4">
              {assetType === "screenshot" ? "Screenshot" : "Code"}
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="screenshot">Screenshot</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full gap-4 overflow-x-auto px-1 py-3">
        {filteredPreviewConfigs.map(({ key, displayName, layoutId, previewConfig }) => {
          const isSelected = currentConfig.layoutId === layoutId;

          const handleSelect = () => {
            setLastLayoutByAssetType((current) => ({ ...current, [assetType]: layoutId }));
            applyLayoutSelection(layoutId, displayName);
          };

          return (
            <LayoutPreviewCard
              key={key}
              option={{ key, displayName, layoutId, previewConfig }}
              assets={assets}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function LayoutPreviewCard({
  option,
  assets,
  isSelected,
  onSelect,
}: {
  option: PreviewCard;
  assets: Asset[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  // Create isolated store for each preview to prevent preview interactions from affecting main state
  const previewStore = useMemo(() => {
    const store = createStore();
    store.set(configAtom, option.previewConfig);
    store.set(assetsAtom, assets);
    return store;
  }, [option.previewConfig, assets]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-transparent p-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isSelected
          ? "border-primary/60 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "hover:border-border/60 hover:bg-muted/40",
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${option.displayName} look`}
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
          {option.displayName}
        </span>
      </div>
    </button>
  );
}
