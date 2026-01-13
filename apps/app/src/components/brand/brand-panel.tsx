"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UpgradePrompt } from "@/components/auth/upgrade-prompt";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { useAtom, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";
import { useUserTier } from "@/hooks/use-user-tier";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";

export function BrandPanel() {
  const { data: session } = useSession();
  const { isBrandUser, isLoading: isTierLoading } = useUserTier();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const { error: autoApplyError } = useBrandLogoAutoApply();
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Fetch brand profile in background on mount
  useEffect(() => {
    async function loadBrandProfile() {
      if (!isBrandUser || !session?.user) return;

      try {
        const response = await fetch("/api/brand/profile", {
          credentials: "include",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load brand profile");
        }

        if (payload?.logoUrl || payload?.profile?.logoPath || payload?.profile?.logo_path) {
          setBrandSettings((prev) => ({
            ...prev,
            logoUrl: payload.logoUrl ?? prev.logoUrl,
            logoPath:
              payload.profile?.logoPath ??
              payload.profile?.logo_path ??
              prev.logoPath,
          }));
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Brand profile not available:", error);
        }
      }
    }

    loadBrandProfile();
  }, [isBrandUser, session?.user?.id, setBrandSettings]);

  if (isTierLoading) {
    return <div className="h-full w-full p-4 text-sm text-muted-foreground">Loading brand tools…</div>;
  }

  if (!isBrandUser) {
    return (
      <div className="h-full w-full p-4">
        <UpgradePrompt title="Brand tools" description="Upgrade to Brand to upload a logo and apply it to screenshots." />
      </div>
    );
  }

  const handleUpload = async (file: File) => {
    setErrorMessage(null);

    try {
      // Process file locally first (creates asset but doesn't auto-apply to canvas)
      await handleFileProcess(file, "logo");

      // Upload to backend
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

      // Remove logo from canvas if it was being used
      if (brandSettings.useLogoOnScreenshots) {
        setConfig((currentConfig) => ({
          ...currentConfig,
          assets: {
            ...currentConfig.assets,
            logo: undefined,
          },
        }));
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
    setBrandSettings((prev) => ({
      ...prev,
      useLogoOnScreenshots: checked,
    }));
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

  return (
    <div className="h-full w-full space-y-6 overflow-y-auto p-4">
      {/* Logo Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Logo</h3>

        {brandSettings.logoUrl ? (
          <div className="space-y-3">
            <div className="relative group">
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
              <div
                className="aspect-video w-full rounded-lg border border-border overflow-hidden bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] relative"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)
                  `,
                  backgroundColor: "hsl(var(--muted))",
                }}
              >
                <img
                  src={brandSettings.logoUrl}
                  alt="Brand logo"
                  className="w-full h-full object-contain p-4"
                />
                {isProcessingUpload && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition duration-150 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:bg-black/60 group-hover:backdrop-blur-sm group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:bg-black/60 group-focus-within:backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 shadow-lg ring-1 ring-white/30 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    disabled={isProcessingUpload}
                    className="h-9 w-9 rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  >
                    <span className="sr-only">Replace logo</span>
                    <RefreshCw className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isProcessingUpload}
                    className="h-9 w-9 rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  >
                    <span className="sr-only">Remove logo</span>
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-apply error message */}
            {autoApplyError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {autoApplyError}
              </p>
            )}

            {/* Toggle for using logo */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
              <Label
                htmlFor="use-logo"
                className="text-sm font-normal cursor-pointer"
              >
                Apply to all screenshots
              </Label>
              <Switch
                id="use-logo"
                checked={brandSettings.useLogoOnScreenshots}
                onCheckedChange={handleToggleUse}
              />
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
              {isProcessingUpload ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add logo"
              )}
            </Button>
          </>
        )}

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>

    </div>
  );
}
