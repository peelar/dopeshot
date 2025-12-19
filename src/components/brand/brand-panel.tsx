"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { useAtom, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";
import { useBackgrounds } from "@/hooks/use-backgrounds";
import { BrandBackgroundGrid } from "@/components/selectors/brand-background-grid";
import type { BrandBackground } from "@/domain/backgrounds/types";

export function BrandPanel() {
  const { data: session } = useSession();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backgroundErrorMessage, setBackgroundErrorMessage] = useState<string | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const {
    brandBackgrounds,
    isLoadingBrand,
    uploadBrandBackground,
    deleteBrandBackground,
  } = useBackgrounds();

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

  // Background handlers
  const handleBackgroundUpload = useCallback(
    async (file: File) => {
      if (!session?.user) return;

      setBackgroundErrorMessage(null);
      setIsUploadingBackground(true);

      try {
        await uploadBrandBackground(file);
        track("brand_background_uploaded", { file_size_kb: file.size / 1024 });
      } catch (error) {
        console.error("Background upload failed:", error);
        setBackgroundErrorMessage(
          error instanceof Error ? error.message : "Failed to upload background"
        );
      } finally {
        setIsUploadingBackground(false);
      }
    },
    [session?.user, uploadBrandBackground]
  );

  const handleBackgroundSelect = useCallback(
    (background: BrandBackground) => {
      // Apply background to canvas
      const backgroundAsset: Asset = {
        id: `brand-bg-${background.id}`,
        projectId: "brand",
        userId: "brand",
        url: background.url,
        name: background.name || "Brand background",
        kind: "background",
        createdAt: background.createdAt,
      };

      setAssets((prev) => [...prev, backgroundAsset]);
      setConfig((currentConfig) => ({
        ...currentConfig,
        background: {
          type: "image",
          value: backgroundAsset.id,
        },
        assets: {
          ...currentConfig.assets,
          background: backgroundAsset.id,
        },
      }));

      track("brand_background_selected", { background_id: background.id });
    },
    [setAssets, setConfig]
  );

  const handleBackgroundRemove = useCallback(
    async (id: string) => {
      setBackgroundErrorMessage(null);

      try {
        const success = await deleteBrandBackground(id);
        if (success) {
          track("brand_background_deleted", { background_id: id });
        }
      } catch (error) {
        console.error("Background deletion failed:", error);
        setBackgroundErrorMessage("Failed to delete background");
      }
    },
    [deleteBrandBackground]
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
              />
              <label htmlFor="logo-replace" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessingUpload}
                  asChild
                  className="w-full"
                >
                  <span>Replace</span>
                </Button>
              </label>
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
            />
            <label htmlFor="logo-add">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingUpload}
                asChild
                className="w-full"
              >
                <span>Add logo</span>
              </Button>
            </label>
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
          <h3 className="text-sm font-semibold">Brand Backgrounds</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])
            }
            className="hidden"
            id="background-add"
            aria-label="Add brand background"
          />
          <label htmlFor="background-add">
            <Button
              variant="outline"
              size="sm"
              disabled={isUploadingBackground || !session?.user}
              asChild
            >
              <span>Add</span>
            </Button>
          </label>
        </div>

        <BrandBackgroundGrid
          backgrounds={brandBackgrounds}
          onSelect={handleBackgroundSelect}
          onRemove={handleBackgroundRemove}
          isLoading={isLoadingBrand}
          showRemove={true}
        />

        {backgroundErrorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {backgroundErrorMessage}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Upload backgrounds to use across your screenshots. They'll also appear in the Design tab.
        </p>
      </div>
    </div>
  );
}
