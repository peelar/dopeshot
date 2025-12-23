"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { configAtom, assetsAtom, statusMessageAtom } from "@/hooks/atoms";
import {
  backgroundSelectionAtom,
  backgroundUserTierAtom,
  presetBackgroundsAtom,
} from "@/hooks/atoms/backgrounds";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type { BackgroundType, PresetBackground } from "@/domain/backgrounds/types";
import { analyzeImageTextContrast } from "@/domain/asset/image-text-contrast";
import {
  clearBackgroundSelection,
  getBackgroundSelection,
  listPresetBackgrounds,
  saveBackgroundSelection,
} from "@/domain/backgrounds/background-service";

type BackgroundItem = PresetBackground;

export function BackgroundSection() {
  const { data: session } = useSession();
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const [presetBackgrounds, setPresetBackgrounds] = useAtom(presetBackgroundsAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);
  const [userTier, setUserTier] = useAtom(backgroundUserTierAtom);

  const [isLoadingPresets, setIsLoadingPresets] = useState(true);

  const isAuthenticated = Boolean(session?.user);

  const setBackgroundConfig = useCallback(
    (backgroundId: string) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          background: backgroundId,
        },
        background: {
          type: "image",
          value: backgroundId,
          grainEnabled: true,
          patternMode: "manual",
          patternId: "grain",
        },
      }));
    },
    [setConfig],
  );

  const applyBackgroundTextContrast = useCallback(
    async (background: BackgroundItem) => {
      if (!background.previewUrl) {
        return;
      }

      const { palette, textColor } = await analyzeImageTextContrast(background.previewUrl);
      if (palette) {
        setAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === background.id ? { ...asset, colorPalette: palette } : asset,
          ),
        );
      }

      if (!textColor) {
        return;
      }

      setConfig((currentConfig) => {
        if (
          currentConfig.background?.type !== "image" ||
          currentConfig.background.value !== background.id
        ) {
          return currentConfig;
        }

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
        };
      });
    },
    [setAssets, setConfig],
  );

  const applyBackgroundAsset = useCallback(
    (background: BackgroundItem, backgroundType: BackgroundType) => {
      if (!background.previewUrl) {
        setStatusMessage("Background preview is unavailable.");
        return;
      }

      setAssets((prevAssets) => {
        if (prevAssets.some((asset) => asset.id === background.id)) {
          return prevAssets;
        }
        return [
          ...prevAssets,
          {
            id: background.id,
            projectId: backgroundType,
            userId: session?.user?.id ?? "backgrounds",
            name: background.name ?? "Background",
            url: background.previewUrl,
            kind: "background",
            createdAt: new Date().toISOString(),
          },
        ];
      });

      setBackgroundConfig(background.id);
      void applyBackgroundTextContrast(background);
    },
    [applyBackgroundTextContrast, setAssets, setBackgroundConfig, setStatusMessage, session?.user?.id],
  );

  const persistSelection = useCallback(
    async (backgroundType: BackgroundType, backgroundId: string) => {
      try {
        const response = await saveBackgroundSelection({ backgroundType, backgroundId });
        setSelection({ backgroundType: response.backgroundType, backgroundId: response.backgroundId });
        if (response.userTier) {
          setUserTier(response.userTier);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save background selection.";
        setStatusMessage(message);
      }
    },
    [setSelection, setStatusMessage, setUserTier],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPresets() {
      setIsLoadingPresets(true);
      try {
        const response = await listPresetBackgrounds();
        if (!isMounted) return;
        setPresetBackgrounds(response.items);
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Failed to load preset backgrounds.";
        setStatusMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingPresets(false);
        }
      }
    }

    void loadPresets();

    return () => {
      isMounted = false;
    };
  }, [setPresetBackgrounds, setStatusMessage]);

  useEffect(() => {
    let isMounted = true;

    async function loadSelection() {
      if (!isAuthenticated) {
        setSelection(null);
        return;
      }
      try {
        const response = await getBackgroundSelection();
        if (!isMounted) return;
        if (response) {
          setSelection({
            backgroundType: response.backgroundType,
            backgroundId: response.backgroundId,
          });
          if (response.userTier) {
            setUserTier(response.userTier);
          }
        } else {
          setSelection(null);
        }
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Failed to load background selection.";
        setStatusMessage(message);
      }
    }

    void loadSelection();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setSelection, setStatusMessage, setUserTier]);

  const selectionTarget = useMemo(() => {
    if (!selection) return null;
    const pool =
      selection.backgroundType === "preset" ? presetBackgrounds : [];
    return pool.find((item) => item.id === selection.backgroundId) ?? null;
  }, [selection, presetBackgrounds]);

  useEffect(() => {
    if (!selection || !selectionTarget) {
      if (selection && !selectionTarget) {
        setStatusMessage("That background is no longer available. Please choose another.");
        void clearBackgroundSelection().catch(() => null);
        setSelection(null);
      }
      return;
    }

    applyBackgroundAsset(selectionTarget, selection.backgroundType);
  }, [
    applyBackgroundAsset,
    selection,
    selectionTarget,
    setSelection,
    setStatusMessage,
  ]);

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;
        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            ...currentBackground,
            ...background,
            grainEnabled,
            patternId: background.patternId ?? currentBackground.patternId,
            patternMode: background.patternMode ?? currentBackground.patternMode,
          },
        };
      });

      if (selection) {
        setSelection(null);
        void clearBackgroundSelection().catch(() => null);
      }
    },
    [selection, setConfig, setSelection],
  );

  const handleSelect = useCallback(
    async (background: BackgroundItem, backgroundType: BackgroundType) => {
      if (!background.previewUrl) {
        setStatusMessage("Background preview is unavailable.");
        return;
      }
      applyBackgroundAsset(background, backgroundType);
      await persistSelection(backgroundType, background.id);

      if (backgroundType === "preset") {
        track("background_preset_selected", {
          preset_id: background.id,
          user_tier: userTier,
          source: "sidebar",
        });
      } else {
        track("background_personal_selected", {
          background_id: background.id,
          user_tier: userTier,
        });
      }
    },
    [applyBackgroundAsset, persistSelection, setStatusMessage, userTier],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <GradientPicker
        onChangeAction={handleGradientChange}
        presetBackgrounds={presetBackgrounds}
        selectedPresetId={selection?.backgroundType === "preset" ? selection.backgroundId : null}
        isLoadingPresets={isLoadingPresets}
        onSelectPreset={(background) => handleSelect(background, "preset")}
      />

    </div>
  );
}
