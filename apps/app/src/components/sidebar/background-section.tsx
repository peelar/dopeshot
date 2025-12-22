"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { configAtom, assetsAtom, statusMessageAtom } from "@/hooks/atoms";
import { backgroundAssetAtom } from "@/hooks/atoms/derived";
import {
  backgroundSelectionAtom,
  backgroundUserTierAtom,
  personalBackgroundsAtom,
  presetBackgroundsAtom,
} from "@/hooks/atoms/backgrounds";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type {
  BackgroundType,
  PersonalBackground,
  PresetBackground,
} from "@/domain/backgrounds/types";
import {
  clearBackgroundSelection,
  deletePersonalBackground,
  getBackgroundSelection,
  listPersonalBackgrounds,
  listPresetBackgrounds,
  saveBackgroundSelection,
} from "@/domain/backgrounds/background-service";

interface BackgroundSectionProps {
  onUploadAsset?: (file: File, kind: "background") => void;
}

type BackgroundItem = PresetBackground | PersonalBackground;

export function BackgroundSection({ onUploadAsset }: BackgroundSectionProps) {
  const { data: session } = useSession();
  const config = useAtomValue(configAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const [presetBackgrounds, setPresetBackgrounds] = useAtom(presetBackgroundsAtom);
  const [personalBackgrounds, setPersonalBackgrounds] = useAtom(personalBackgroundsAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);
  const [userTier, setUserTier] = useAtom(backgroundUserTierAtom);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [bgType, setBgType] = useState<"gradient" | "image">(
    config.background?.type === "image" ? "image" : "gradient",
  );
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);

  const isAuthenticated = Boolean(session?.user);
  const selectedBackgroundId = selection?.backgroundId ?? backgroundAsset?.id ?? null;

  const handleCardKeyDown = useCallback((event: React.KeyboardEvent, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  }, []);

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
          grainEnabled: false,
          patternMode: "manual",
          patternId: "none",
        },
      }));
    },
    [setConfig],
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
      setBgType("image");
    },
    [setAssets, setBackgroundConfig, setStatusMessage, session?.user?.id],
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

  const refreshPersonalBackgrounds = useCallback(async () => {
    if (!isAuthenticated) {
      setPersonalBackgrounds([]);
      return;
    }
    setIsLoadingPersonal(true);
    try {
      const response = await listPersonalBackgrounds();
      setPersonalBackgrounds(response.items);
      if (response.userTier) {
        setUserTier(response.userTier);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load brand backgrounds.";
      setStatusMessage(message);
    } finally {
      setIsLoadingPersonal(false);
    }
  }, [isAuthenticated, setPersonalBackgrounds, setStatusMessage, setUserTier]);

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
    void refreshPersonalBackgrounds();
  }, [refreshPersonalBackgrounds]);

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
      selection.backgroundType === "preset" ? presetBackgrounds : personalBackgrounds;
    return pool.find((item) => item.id === selection.backgroundId) ?? null;
  }, [selection, presetBackgrounds, personalBackgrounds]);

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

  const handleRemoveBackground = useCallback(() => {
    setConfig((currentConfig) => {
      const fallbackBackground =
        currentConfig.background?.type === "gradient"
          ? currentConfig.background
          : ({ type: "gradient", value: "custom" } as BackgroundConfig);
      return {
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          background: undefined,
        },
        background: fallbackBackground,
      };
    });
    setSelection(null);
    void clearBackgroundSelection().catch(() => null);
  }, [setConfig, setSelection]);

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

  const handleDeletePersonal = useCallback(
    async (backgroundId: string) => {
      try {
        await deletePersonalBackground(backgroundId);
        setPersonalBackgrounds((prev) => prev.filter((item) => item.id !== backgroundId));
        track("background_personal_removed", {
          background_id: backgroundId,
          user_tier: userTier,
        });
        if (selection?.backgroundId === backgroundId) {
          handleRemoveBackground();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to remove background.";
        setStatusMessage(message);
      }
    },
    [handleRemoveBackground, selection?.backgroundId, setPersonalBackgrounds, setStatusMessage, userTier],
  );

  const handleUploadClick = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }
    uploadInputRef.current?.click();
  }, [isAuthenticated]);

  const handleUploadChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !onUploadAsset) {
        if (event.target) {
          event.target.value = "";
        }
        return;
      }

      await Promise.resolve(onUploadAsset(file, "background"));
      if (event.target) {
        event.target.value = "";
      }

      await refreshPersonalBackgrounds();
    },
    [onUploadAsset, refreshPersonalBackgrounds],
  );

  const renderBackgroundGrid = useCallback(
    (
      items: BackgroundItem[],
      backgroundType: BackgroundType,
      options?: { showDelete?: boolean; emptyMessage?: string },
    ) => {
      if (items.length === 0) {
        return (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
            {options?.emptyMessage ?? "No backgrounds available yet."}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const isSelected = selectedBackgroundId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-0 transition-all focus-within:ring-2 focus-within:ring-primary/30",
                  isSelected
                    ? "border-foreground bg-muted/30"
                    : "border-border bg-muted/10 hover:border-foreground/30",
                )}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(item, backgroundType)}
                onKeyDown={(event) => handleCardKeyDown(event, () => handleSelect(item, backgroundType))}
              >
                <div className="relative h-16 bg-muted/40">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name ?? "Background"}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-xs font-medium text-foreground">
                    {item.name ?? "Untitled"}
                  </span>
                  {options?.showDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 rounded-full bg-background/80 p-0 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeletePersonal(item.id);
                      }}
                      aria-label="Remove background"
                    >
                      <X className="h-3 w-3 text-foreground" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    [handleCardKeyDown, handleDeletePersonal, handleSelect, selectedBackgroundId],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SegmentedControl
        value={bgType}
        onChange={(value) => {
          if (value === "image") setBgType("image");
          else setBgType("gradient");
        }}
        options={[
          { id: "gradient", label: "Gradient" },
          { id: "image", label: "Image" },
        ]}
        ariaLabel="Background type"
      />

      {bgType === "gradient" && <GradientPicker onChangeAction={handleGradientChange} />}

      {bgType === "image" && (
        <div className="flex flex-col gap-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Presets
              </span>
            </div>
            {isLoadingPresets ? (
              <div className="text-xs text-muted-foreground">Loading presets...</div>
            ) : (
              renderBackgroundGrid(presetBackgrounds, "preset", {
                emptyMessage: "No preset backgrounds yet.",
              })
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Brand
              </span>
              {!isAuthenticated ? (
                <span className="text-[11px] text-muted-foreground/80">
                  Log in to upload your backgrounds.
                </span>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={uploadInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={handleUploadClick}
                  disabled={!onUploadAsset || !isAuthenticated}
                  className="gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload
                </Button>
              </div>
            </div>
            {isLoadingPersonal ? (
              <div className="text-xs text-muted-foreground">Loading brand backgrounds...</div>
            ) : (
              renderBackgroundGrid(personalBackgrounds, "personal", {
                showDelete: true,
                emptyMessage: "Upload a background to start your brand library.",
              })
            )}
          </section>

          {backgroundAsset ? (
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              <span className="truncate">Selected: {backgroundAsset.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleRemoveBackground}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
