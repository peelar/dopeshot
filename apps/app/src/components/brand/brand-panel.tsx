"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UpgradePrompt } from "@/components/auth/upgrade-prompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { useSession } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils/cn";
import { useAtom, useSetAtom } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";
import { useUserTier } from "@/hooks/use-user-tier";
import {
  brandModeValues,
  brandPersonalityLabels,
  brandPersonalityValues,
  type BrandMode,
  type BrandPersonality,
} from "@/lib/types/brand";
import { RefreshCw, Trash2, Loader2, Moon, Sun } from "lucide-react";
import { BackgroundsCollection } from "./backgrounds-collection";
import { AiBackgroundsCollection } from "./ai-backgrounds-collection";

function normalizeHex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return "";
}

export function BrandPanel() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isBrandUser, isLoading: isTierLoading } = useUserTier();
  const { resolvedTheme } = useTheme();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const { error: autoApplyError } = useBrandLogoAutoApply();
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fallbackMode: BrandMode = resolvedTheme === "light" ? "light" : "dark";
  const [accent, setAccent] = useState<string>(normalizeHex(brandSettings.accent ?? ""));
  const [mode, setMode] = useState<BrandMode>(brandSettings.mode ?? fallbackMode);
  const [personality, setPersonality] = useState<BrandPersonality | null>(
    brandSettings.personality ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const personalityOptions = useMemo(
    () =>
      brandPersonalityValues.map((id) => ({
        id,
        label: brandPersonalityLabels[id],
      })),
    [],
  );

  useEffect(() => {
    setAccent(normalizeHex(brandSettings.accent ?? ""));
    setMode(brandSettings.mode ?? fallbackMode);
    setPersonality(brandSettings.personality ?? null);
  }, [brandSettings.accent, brandSettings.mode, brandSettings.personality, fallbackMode]);

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

        const palette = payload?.profile?.colorPalette as
          | { accent?: unknown; mode?: unknown }
          | null
          | undefined;

        const nextAccent = typeof palette?.accent === "string" ? palette.accent : null;
        const nextMode = palette?.mode === "light" || palette?.mode === "dark" ? palette.mode : null;
        const nextPersonality = brandPersonalityValues.includes(
          payload?.profile?.personality as BrandPersonality,
        )
          ? (payload.profile.personality as BrandPersonality)
          : null;

        if (
          payload?.logoUrl ||
          payload?.profile?.logoPath ||
          payload?.profile?.logo_path ||
          nextAccent ||
          nextMode ||
          nextPersonality
        ) {
          setBrandSettings((prev) => ({
            ...prev,
            logoUrl: payload.logoUrl ?? prev.logoUrl,
            logoPath:
              payload.profile?.logoPath ??
              payload.profile?.logo_path ??
              prev.logoPath,
            accent: nextAccent ?? prev.accent,
            mode: nextMode ?? prev.mode,
            personality: nextPersonality ?? prev.personality,
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
    return (
      <div className="h-full w-full px-4 py-6 text-sm text-muted-foreground">
        Loading brand tools…
      </div>
    );
  }

  if (!isBrandUser) {
    return (
      <div className="h-full w-full px-4 py-6">
        <UpgradePrompt
          title="Brand tools"
          description="Upgrade to Brand to upload a logo and apply it to screenshots."
          onUpgradeClick={() => router.push("/billing")}
        />
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

      setBrandSettings((prev) => ({
        ...prev,
        logoUrl: null,
        logoPath: null,
        useLogoOnScreenshots: false,
      }));

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
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          logo: undefined,
        },
      }));
    }
  };

  const canSubmit =
    /^#[0-9a-fA-F]{6}$/.test(accent) &&
    brandModeValues.includes(mode) &&
    Boolean(personality) &&
    brandPersonalityValues.includes(personality as BrandPersonality);

  const accentSwatch = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#000000";

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error("Please check your selections and try again.");
      return;
    }

    setIsSaving(true);

    const selectedPersonality = personality as BrandPersonality;

    try {
      const response = await fetch("/api/brand/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accent,
          mode,
          personality: selectedPersonality,
        }),
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save brand settings");
      }

      setBrandSettings((prev) => ({
        ...prev,
        accent,
        mode,
        personality,
      }));

      track("brand_profile_saved", {
        mode,
        personality: selectedPersonality,
        has_logo: Boolean(brandSettings.logoPath),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save brand settings";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <section className="space-y-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Logo</span>
          </div>

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
                className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"
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
                  className="h-full w-full object-contain p-4"
                />
                {isProcessingUpload && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:bg-black/60 group-hover:backdrop-blur-sm group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:bg-black/60 group-focus-within:backdrop-blur-sm">
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

            {autoApplyError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {autoApplyError}
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
              <Label
                htmlFor="use-logo"
                className="cursor-pointer text-sm font-normal"
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
        </section>

        <AiBackgroundsCollection personality={personality} />
        <BackgroundsCollection />

        <section className="space-y-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Colors</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Accent</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentSwatch}
                onChange={(e) => setAccent(normalizeHex(e.target.value))}
                aria-label="Accent color picker"
                disabled={isSaving}
                className="h-10 w-10 cursor-pointer appearance-none overflow-hidden rounded-full border border-border/60 bg-transparent p-0 shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
              />
              <Input
                value={accent}
                onChange={(e) => setAccent(normalizeHex(e.target.value))}
                className="h-9 flex-1 border-border/60 bg-muted/10 font-mono text-xs uppercase tracking-[0.08em] shadow-inner focus-visible:ring-1 focus-visible:ring-foreground/30"
                placeholder="#6366F1"
                inputMode="text"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2 pt-3">
            <Label className="text-xs text-muted-foreground">Preferred Mode</Label>
            <div className="relative grid grid-cols-2 rounded-lg border border-border bg-muted/20 p-1">
              <div
                className={cn(
                  "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-foreground/10 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.45)] transition-transform duration-200",
                  mode === "light" ? "translate-x-0" : "translate-x-full",
                )}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setMode("light")}
                disabled={isSaving}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                  mode === "light" ? "text-foreground" : "text-muted-foreground",
                  isSaving && "cursor-not-allowed",
                )}
              >
                <Sun className="size-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setMode("dark")}
                disabled={isSaving}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                  mode === "dark" ? "text-foreground" : "text-muted-foreground",
                  isSaving && "cursor-not-allowed",
                )}
              >
                <Moon className="size-4" />
                Dark
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Personality</span>
          </div>
          <Select
            value={personality ?? ""}
            onValueChange={(value) => {
              if (!value) {
                setPersonality(null);
                return;
              }
              if (!brandPersonalityValues.includes(value as BrandPersonality)) return;
              setPersonality(value as BrandPersonality);
            }}
          >
            <SelectTrigger>
              <SelectValue className={!personality ? "text-muted-foreground" : undefined}>
                {personality ? brandPersonalityLabels[personality] : "Select personality"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-40">
              {personalityOptions.map((option) => (
                <SelectItem key={option.id} value={option.id} className="py-2">
                  <span className="text-sm font-medium">{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>

      {/* Footer with save button */}
      <div className="flex-shrink-0 bg-background px-4 py-3">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit || isSaving}
            size="sm"
            variant="secondary"
          >
            {isSaving ? "Saving…" : "Save brand settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
