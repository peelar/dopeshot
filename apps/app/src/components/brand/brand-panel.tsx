"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useBackgroundUpload } from "@/hooks/use-background-upload";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom, userBackgroundsAtom } from "@/hooks/atoms";
import { useState } from "react";
import type { Asset } from "@/domain/asset/types";
import { AssetDropzone } from "@/components/config/layout-config";

export function BrandPanel() {
  const { data: session } = useSession();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const userBackgrounds = useAtomValue(userBackgroundsAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const {
    upload: uploadBackground,
    status: backgroundUploadStatus,
    error: backgroundUploadError,
    progress: backgroundUploadProgress,
  } = useBackgroundUpload();

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

  const handleBackgroundUpload = async (file: File) => {
    await uploadBackground(file);

    track("background_uploaded", {
      file_size_kb: Math.round(file.size / 1024),
      file_type: file.type,
    });
  };

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

      {session?.user && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Backgrounds</h3>
            {userBackgrounds.length > 0 && (
              <Badge variant="secondary" data-testid="background-count">
                {userBackgrounds.length}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2" data-testid="background-upload-section">
            <Label className="text-sm font-medium">Upload background</Label>
            <div data-testid="background-upload-dropzone">
              <AssetDropzone
                label="Upload background"
                variant="default"
                onUpload={handleBackgroundUpload}
                disabled={backgroundUploadStatus === "uploading"}
                asset={
                  userBackgrounds[0]?.signedUrl
                    ? {
                        id: userBackgrounds[0].id,
                        projectId: "backgrounds",
                        userId: session.user.id,
                        name: userBackgrounds[0].name,
                        url: userBackgrounds[0].signedUrl,
                        kind: "background",
                        createdAt: userBackgrounds[0].createdAt,
                      }
                    : undefined
                }
              />
            </div>
            {backgroundUploadStatus === "uploading" && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${backgroundUploadProgress ?? 0}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}
            {backgroundUploadStatus === "success" && (
              <p className="text-sm text-green-600" data-testid="upload-success-message">
                Upload successful!
              </p>
            )}
            {backgroundUploadError && (
              <p className="text-sm text-destructive" data-testid="upload-error-message">
                {backgroundUploadError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
