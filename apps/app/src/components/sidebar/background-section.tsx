"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useState, useCallback, useEffect, Component, type ReactNode } from "react";
import { configAtom, userBackgroundsAtom } from "@/hooks/atoms";
import { backgroundAssetAtom } from "@/hooks/atoms/derived";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BackgroundSelector } from "@/components/sidebar/background-selector";
import { useBackgrounds } from "@/hooks/use-backgrounds";
import { useBackgroundUpload } from "@/hooks/use-background-upload";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type { BackgroundAsset, CuratedBackground } from "@/domain/background/types";
import { AssetDropzone } from "@/components/config/layout-config";

interface BackgroundSectionProps {
  onUploadAsset?: (file: File, kind: "background") => void;
}

interface BackgroundUploadBoundaryProps {
  children: ReactNode;
}

interface BackgroundUploadBoundaryState {
  hasError: boolean;
}

class BackgroundUploadBoundary extends Component<
  BackgroundUploadBoundaryProps,
  BackgroundUploadBoundaryState
> {
  state: BackgroundUploadBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Background tools ran into an issue. Please refresh and try again.
        </div>
      );
    }

    return this.props.children;
  }
}

export function BackgroundSection({ onUploadAsset }: BackgroundSectionProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const setUserBackgrounds = useSetAtom(userBackgroundsAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);

  // Fetch backgrounds on mount
  const { isLoading: isLoadingBackgrounds, error: backgroundsError } = useBackgrounds();
  const {
    upload: uploadBackground,
    status: uploadStatus,
    error: uploadError,
    progress: uploadProgress,
  } = useBackgroundUpload();

  // Local state for background tab selection
  const [bgType, setBgType] = useState<"gradient" | "image">(
    config.background?.type === "image" ? "image" : "gradient",
  );

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
    },
    [setConfig],
  );

  const handleRemoveBackground = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        background: undefined,
      },
    }));
  }, [setConfig]);

  // Handle persistent background upload
  const handlePersistentUpload = useCallback(
    async (file: File) => {
      if (!isAuthenticated) return;
      await uploadBackground(file);

      // Track upload event
      track("background_uploaded", {
        file_size_kb: Math.round(file.size / 1024),
        file_type: file.type,
      });
    },
    [isAuthenticated, uploadBackground],
  );

  // Handle background selection
  const handleSelectBackground = useCallback(
    (background: BackgroundAsset | CuratedBackground, source: "user" | "curated") => {
      // Determine the URL based on background type
      const backgroundUrl = source === "curated"
        ? (background as CuratedBackground).publicUrl
        : (background as BackgroundAsset).signedUrl;

      // Apply background to config
      setConfig((currentConfig) => ({
        ...currentConfig,
        background: {
          type: "image",
          value: backgroundUrl,
        } as BackgroundConfig,
      }));

      // Track selection event
      track("background_selected", {
        source,
        background_id: background.id,
      });
    },
    [setConfig]
  );

  // Handle background deletion
  const handleDeleteBackground = useCallback(
    async (backgroundId: string) => {
      try {
        const response = await fetch("/api/background/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backgroundId }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete background");
        }

        // Track deletion event
        track("background_deleted", {
          background_id: backgroundId,
        });

        setUserBackgrounds((prev) => prev.filter((bg) => bg.id !== backgroundId));
      } catch (error) {
        console.error("Failed to delete background:", error);
      }
    },
    [setUserBackgrounds]
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
        <div className="flex flex-col gap-3">
          {/* Temporary upload via AssetDropzone */}
          <AssetDropzone
            asset={backgroundAsset}
            onUpload={(file) => onUploadAsset?.(file, "background")}
            onRemove={handleRemoveBackground}
            disabled={!onUploadAsset}
            label="Upload Background (Temporary)"
          />

          <BackgroundUploadBoundary>
            {isAuthenticated && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="background-persistent-upload">
                  Upload Persistent Background
                </label>
                <input
                  id="background-persistent-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePersistentUpload(file);
                    }
                  }}
                  className="text-sm"
                  disabled={uploadStatus === "uploading"}
                />
                {uploadStatus === "uploading" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${uploadProgress ?? 0}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}
                {uploadStatus === "success" && (
                  <p className="text-sm text-green-600">Upload successful!</p>
                )}
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>
            )}

            {/* Background selector */}
            {!isLoadingBackgrounds && (
              <BackgroundSelector
                onSelect={handleSelectBackground}
                onDelete={handleDeleteBackground}
              />
            )}

            {backgroundsError && (
              <p className="text-sm text-destructive" data-testid="backgrounds-error">
                Failed to load backgrounds
              </p>
            )}
          </BackgroundUploadBoundary>
        </div>
      )}
    </div>
  );
}
