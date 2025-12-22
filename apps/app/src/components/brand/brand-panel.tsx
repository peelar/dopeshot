"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { useAtom, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";
import {
  deletePersonalBackground,
  listPersonalBackgrounds,
} from "@/domain/backgrounds/background-service";

export function BrandPanel() {
  const { data: session } = useSession();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const [brandBackgrounds, setBrandBackgrounds] = useAtom(personalBackgroundsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Fetch brand profile in background on mount
  useEffect(() => {
    async function loadBrandProfile() {
      if (!session?.user) return;

      try {
        const response = await fetch("/api/brand/profile", {
          credentials: "include",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load brand profile");
        }

        if (payload?.logoUrl) {
          setBrandSettings((prev) => ({
            ...prev,
            logoUrl: payload.logoUrl,
            logoPath: payload.profile?.logo_path ?? prev.logoPath,
          }));
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Brand profile not available:", error);
        }
      }
    }

    loadBrandProfile();
  }, [session?.user?.id, setBrandSettings]);

  const handleUpload = async (file: File) => {
    if (!session?.user) return;

    setErrorMessage(null);

    try {
      await handleFileProcess(file, "logo");

      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch("/api/brand/upload-logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Upload failed");
      }

      if (payload.logoPath || payload.signedUrl) {
        setBrandSettings((prev) => ({
          ...prev,
          logoUrl: payload.signedUrl ?? prev.logoUrl,
          logoPath: payload.logoPath ?? prev.logoPath,
        }));
      }

      track("brand_logo_updated", { file_size_kb: file.size / 1024 });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Upload failed:", error);
      }
      setErrorMessage(
        "Brand features are not yet configured. Please check back later."
      );
    }
  };

  const handleRemove = async () => {
    if (!session?.user || !brandSettings.logoPath) return;

    setErrorMessage(null);

    try {
      const response = await fetch("/api/brand/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_path: null }),
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to remove logo");
      }

      setBrandSettings({
        logoUrl: null,
        logoPath: null,
        useLogoOnScreenshots: false,
      });

      track("brand_logo_removed");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Remove failed:", error);
      }
      setErrorMessage(
        "Brand features are not yet configured. Please check back later."
      );
    }
  };

  const handleToggleUse = (checked: boolean) => {
    setBrandSettings({
      ...brandSettings,
      useLogoOnScreenshots: checked,
    });
    track("brand_logo_toggle", { enabled: checked });

    // When toggled ON, immediately apply logo to current screenshot
    if (checked && brandSettings.logoUrl && brandSettings.logoPath) {
      const brandLogoAsset: Asset = {
        id: `brand-logo-${Date.now()}`,
        projectId: "brand",
        userId: "brand",
        url: brandSettings.logoUrl,
        name: brandSettings.logoPath.split("/").pop() || "brand-logo",
        kind: "logo",
        createdAt: new Date().toISOString(),
      };

      setAssets((prev) => [...prev, brandLogoAsset]);
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          logo: brandLogoAsset.id,
        },
      }));
    } else if (!checked) {
      // When toggled OFF, remove logo from screenshot
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          logo: undefined,
        },
      }));
    }
  };

  const refreshBrandBackgrounds = useCallback(async () => {
    if (!session?.user) {
      setBrandBackgrounds([]);
      return;
    }

    setIsLoadingBackgrounds(true);
    setBackgroundError(null);
    try {
      const response = await listPersonalBackgrounds();
      setBrandBackgrounds(response.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load brand backgrounds.";
      setBackgroundError(message);
    } finally {
      setIsLoadingBackgrounds(false);
    }
  }, [session?.user, setBrandBackgrounds]);

  useEffect(() => {
    void refreshBrandBackgrounds();
  }, [refreshBrandBackgrounds]);

  const handleBrandBackgroundUpload = useCallback(
    async (file?: File) => {
      if (!file) return;
      setBackgroundError(null);
      try {
        await handleFileProcess(file, "background");
        await refreshBrandBackgrounds();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload background.";
        setBackgroundError(message);
      }
    },
    [handleFileProcess, refreshBrandBackgrounds],
  );

  const handleBrandBackgroundDelete = useCallback(
    async (backgroundId: string) => {
      setBackgroundError(null);
      try {
        await deletePersonalBackground(backgroundId);
        setBrandBackgrounds((prev) => prev.filter((item) => item.id !== backgroundId));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to remove background.";
        setBackgroundError(message);
      }
    },
    [setBrandBackgrounds],
  );

  return (
    <div className="h-full w-full space-y-6 overflow-y-auto p-4">
      {/* Logo Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Logo</h3>

        {brandSettings.logoUrl ? (
          <div className="space-y-3">
            <div
              className="aspect-video w-full rounded-lg border border-border overflow-hidden relative bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
                  linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%),
                  linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)
                `,
                backgroundColor: 'hsl(var(--muted))'
              }}
            >
              <img
                src={brandSettings.logoUrl}
                alt="Brand logo"
                className="w-full h-full object-contain p-4 relative z-10"
              />
            </div>

            {/* Toggle for using logo */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
              <Label
                htmlFor="use-logo"
                className="text-sm font-normal cursor-pointer"
              >
                Use on screenshots
              </Label>
              <Switch
                id="use-logo"
                checked={brandSettings.useLogoOnScreenshots}
                onCheckedChange={handleToggleUse}
              />
            </div>

            {/* Replace/Remove buttons */}
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleUpload(e.target.files[0])
                }
                className="hidden"
                id="logo-replace"
                aria-label="Replace logo file"
                ref={replaceInputRef}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingUpload}
                className="w-full"
                type="button"
                aria-controls="logo-replace"
                onClick={() => replaceInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isProcessingUpload}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleUpload(e.target.files[0])
              }
              className="hidden"
              id="logo-add"
              aria-label="Add logo file"
              ref={addInputRef}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessingUpload}
              className="w-full"
              type="button"
              aria-controls="logo-add"
              onClick={() => addInputRef.current?.click()}
            >
              Add logo
            </Button>
          </>
        )}

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Brand Backgrounds Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Brand backgrounds</h3>
          {!session?.user ? (
            <span className="text-[11px] text-muted-foreground/80">
              Log in to upload your backgrounds.
            </span>
          ) : null}
          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleBrandBackgroundUpload(file);
                }
                if (event.target) {
                  event.target.value = "";
                }
              }}
              className="hidden"
              ref={backgroundInputRef}
              aria-label="Add brand background"
            />
            <Button
              variant="outline"
              size="xs"
              disabled={isProcessingUpload || !session?.user}
              className="gap-1.5"
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
            >
              <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>

        {isLoadingBackgrounds ? (
          <div className="text-xs text-muted-foreground">Loading brand backgrounds...</div>
        ) : brandBackgrounds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
            Upload a background to start your brand library.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {brandBackgrounds.map((background) => (
              <div
                key={background.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-muted/10"
              >
                <div className="relative h-16 bg-muted/40">
                  {background.previewUrl ? (
                    <img
                      src={background.previewUrl}
                      alt={background.name ?? "Brand background"}
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
                    {background.name ?? "Untitled"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 rounded-full bg-background/80 p-0 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                    onClick={() => void handleBrandBackgroundDelete(background.id)}
                    aria-label="Remove background"
                  >
                    <X className="h-3 w-3 text-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {backgroundError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {backgroundError}
          </p>
        )}
      </div>
    </div>
  );
}
