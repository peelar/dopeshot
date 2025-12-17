"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSession } from "@/lib/auth/auth-client";
import { supabaseDb } from "@/lib/supabase-db";
import { track } from "@/lib/analytics";
import { useAtom, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import { useState } from "react";
import type { Asset } from "@/domain/asset/types";

export function BrandPanel() {
  const { data: session } = useSession();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrandProfile() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabaseDb
          .from("brand_profiles")
          .select("logo_path")
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Brand profile not available:", error.code);
          }
          setIsLoading(false);
          return;
        }

        if (data?.logo_path) {
          // Use signed URL for private bucket
          const { data: signedUrlData, error: urlError } = await supabaseDb.storage
            .from("brand-logos")
            .createSignedUrl(data.logo_path, 3600); // Valid for 1 hour

          if (!urlError && signedUrlData?.signedUrl) {
            // Preserve the persisted useLogoOnScreenshots setting
            // Note: Auto-apply logic is handled by useBrandLogoAutoApply hook on page mount
            setBrandSettings((prev) => ({
              logoUrl: signedUrlData.signedUrl,
              logoPath: data.logo_path,
              useLogoOnScreenshots: prev.useLogoOnScreenshots,
            }));
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Brand profile not available:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadBrandProfile();
  }, [session?.user?.id, setBrandSettings]);

  const handleUpload = async (file: File) => {
    if (!session?.user) return;

    setErrorMessage(null);

    try {
      await handleFileProcess(file, "logo");

      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${session.user.id}/logo-${timestamp}.${extension}`;

      const { error: uploadError } = await supabaseDb.storage
        .from("brand-logos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: profileError } = await supabaseDb
        .from("brand_profiles")
        .upsert(
          { user_id: session.user.id, logo_path: path },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      // Get signed URL for display
      const { data: signedUrlData, error: urlError } = await supabaseDb.storage
        .from("brand-logos")
        .createSignedUrl(path, 3600);

      if (!urlError && signedUrlData?.signedUrl) {
        // Preserve the persisted useLogoOnScreenshots setting
        setBrandSettings((prev) => ({
          logoUrl: signedUrlData.signedUrl,
          logoPath: path,
          useLogoOnScreenshots: prev.useLogoOnScreenshots,
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
      await supabaseDb.storage
        .from("brand-logos")
        .remove([brandSettings.logoPath]);

      const { error } = await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: null })
        .eq("user_id", session.user.id);

      if (error) throw error;

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

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
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
    </div>
  );
}
