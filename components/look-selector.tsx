"use client";

import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { Asset } from "@/domain/asset/types";
import type { LayoutConfig } from "@/domain/layout/types";
import {
  LOOK_DEFINITIONS,
  supportsScreenshots,
  withLookTextDefaults,
} from "@/domain/look/definitions";
import {
  assetTypeAtom,
  assetsAtom,
  configAtom,
  lastLookByAssetTypeAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
  type AssetType,
} from "@/hooks/atoms";
import { cn } from "@/utils";
import { track } from "@/lib/analytics";
import { Provider, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Type } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

// Memoize look default configs at module level to avoid recreation
const LOOK_DEFAULTS = LOOK_DEFINITIONS.map((look) => {
  const defaultConfig = look.createConfig();
  const defaultVariant = defaultConfig.variant || look.variants[0];

  return {
    look,
    defaultVariant,
    defaultConfig,
    key: look.id,
    displayName: look.name,
  };
});

type PreviewCard = {
  key: string;
  displayName: string;
  lookId: string;
  previewConfig: LayoutConfig;
  showTextIcon: boolean;
};

export function LookSelector({ className }: { className?: string }) {
  const [assetType, setAssetType] = useAtom(assetTypeAtom);
  const [lastLookByAssetType, setLastLookByAssetType] = useAtom(lastLookByAssetTypeAtom);
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across look switches
  // BUT reset gradient when switching to non-screenshot looks
  const previewConfigs = useMemo(() => {
    const currentLookSupportsScreenshots = supportsScreenshots(currentConfig.lookId);

    // Check if we have a stored screenshot gradient (persists across look switches)
    const hasScreenshotGradient = screenshotGradient !== null;

    return LOOK_DEFAULTS.map(({ defaultConfig, defaultVariant, key, displayName, look }) => {
      const isTextLook = look.capabilities.text.headline !== "hidden";
      const targetLookSupportsScreenshots = look.capabilities.screenshot === "supported";

      // Determine background preservation strategy:
      // 1. If target look supports screenshots AND we have a screenshot gradient → use stored screenshot gradient
      // 2. If both looks have same screenshot support → preserve current background
      // 3. Otherwise → use default background
      let backgroundToUse;
      if (targetLookSupportsScreenshots && hasScreenshotGradient) {
        // Always use stored screenshot gradient for screenshot-capable looks
        backgroundToUse = screenshotGradient;
      } else if (currentLookSupportsScreenshots === targetLookSupportsScreenshots) {
        // Preserve background when staying in same category (screenshot→screenshot or non-screenshot→non-screenshot)
        backgroundToUse = currentConfig.background;
      } else {
        // Reset to default when switching categories without a screenshot gradient
        backgroundToUse = defaultConfig.background;
      }

      const previewConfig = withLookTextDefaults(
        {
          ...defaultConfig,
          variant: defaultVariant,
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
        lookId: look.id,
        previewConfig,
        showTextIcon: isTextLook,
      };
    });
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontId,
    currentConfig.fontSize,
    currentConfig.lookId,
    currentConfig.screenshotShadow,
    currentConfig.screenshotFrame,
    currentConfig.text,
    currentConfig.code,
    screenshotGradient,
  ]);

  const previewConfigByLookId = useMemo(() => {
    const map = new Map<string, LayoutConfig>();
    for (const option of previewConfigs) {
      map.set(option.lookId, option.previewConfig);
    }
    return map;
  }, [previewConfigs]);

  const filteredPreviewConfigs = useMemo(() => {
    if (assetType === "code") {
      return previewConfigs.filter((option) => option.lookId === "code-snippet");
    }
    return previewConfigs.filter((option) => supportsScreenshots(option.lookId));
  }, [assetType, previewConfigs]);

  const applyLookSelection = useCallback(
    (lookId: string, displayName?: string) => {
      const nextConfig = previewConfigByLookId.get(lookId);
      if (!nextConfig) return;

      if (displayName) {
        track("look_changed", {
          from_look: currentConfig.lookId,
          to_look: lookId,
          look_name: displayName,
        });
      }

      setConfig(
        withLookTextDefaults(
          {
            ...nextConfig,
            variant: nextConfig.variant,
          },
          { preserveEmptyText: true },
        ),
      );
      setScreenshotZoom(1.0);
    },
    [currentConfig.lookId, previewConfigByLookId, setConfig, setScreenshotZoom],
  );

  const handleAssetTypeChange = useCallback(
    (nextType: AssetType) => {
      setLastLookByAssetType((current) => ({
        ...current,
        [assetType]: currentConfig.lookId,
      }));
      setAssetType(nextType);

      const fallbackLookId = nextType === "code" ? "code-snippet" : "popup-gradient";
      const preferredLookId = lastLookByAssetType[nextType] ?? fallbackLookId;
      const nextLookId =
        nextType === "code"
          ? "code-snippet"
          : supportsScreenshots(preferredLookId)
            ? preferredLookId
            : fallbackLookId;

      setLastLookByAssetType((current) => ({ ...current, [nextType]: nextLookId }));
      applyLookSelection(nextLookId);
    },
    [
      applyLookSelection,
      assetType,
      currentConfig.lookId,
      lastLookByAssetType,
      setAssetType,
      setLastLookByAssetType,
    ],
  );

  useEffect(() => {
    const currentIsCode = currentConfig.lookId === "code-snippet";
    if (assetType === "code" && !currentIsCode) {
      handleAssetTypeChange("code");
    }
    if (assetType === "screenshot" && currentIsCode) {
      handleAssetTypeChange("screenshot");
    }
  }, [assetType, currentConfig.lookId, handleAssetTypeChange]);

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
        {filteredPreviewConfigs.map(({ key, displayName, lookId, previewConfig, showTextIcon }) => {
          const isSelected = currentConfig.lookId === lookId;

          const handleSelect = () => {
            setLastLookByAssetType((current) => ({ ...current, [assetType]: lookId }));
            applyLookSelection(lookId, displayName);
          };

          return (
            <LookPreviewCard
              key={key}
              option={{ key, displayName, lookId, previewConfig, showTextIcon }}
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

function LookPreviewCard({
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
        {option.showTextIcon ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Type className="h-3 w-3" aria-hidden="true" />
            Text
          </span>
        ) : null}
      </div>
    </button>
  );
}
