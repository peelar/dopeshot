"use client";

import { useRef, type ChangeEvent, useCallback, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Asset } from "@/domain/asset/types";
import { UploadCloud, X, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { configAtom, orientationAtom, brandSettingsAtom, assetsAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom, logoAssetAtom, brandLogoAssetAtom } from "@/hooks/atoms/derived";
import { ScreenshotSection } from "@/components/sidebar/screenshot-section";
import { LogoSection } from "@/components/sidebar/logo-section";
import { BackgroundSection } from "@/components/sidebar/background-section";
import { LayoutSection } from "@/components/sidebar/layout-section";
import { EffectsSection } from "@/components/sidebar/effects-section";
import { TestimonialContentSection, TestimonialAuthorSection } from "@/components/sidebar/testimonial-author-section";
import { TestimonialStyleSection } from "@/components/sidebar/testimonial-style-section";
import { LogoSwapLogosSection } from "@/components/sidebar/logo-swap-logos-section";
import { getLayoutFormat } from "@/domain/layout-def/definitions";
import { track } from "@/lib/analytics";


interface LayoutConfigProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isMobile?: boolean;
  isBrandUser?: boolean;
}

export const LayoutConfigPanel = ({
  onUploadAsset,
  isMobile = false,
  isBrandUser = false,
}: LayoutConfigProps) => {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const logoAsset = useAtomValue(logoAssetAtom);
  const brandLogoAsset = useAtomValue(brandLogoAssetAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const orientation = useAtomValue(orientationAtom);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const showLogoSection = lookCapabilities?.logo !== "hidden";
  const isTestimonialFormat = getLayoutFormat(config.layoutId) === "testimonial";
  const isLogoSwapFormat = getLayoutFormat(config.layoutId) === "logo-swap";
  const showTestimonialSections = isTestimonialFormat && isBrandUser;
  const showLogoSwapSections = isLogoSwapFormat && isBrandUser;
  const showScreenshotSection = !isTestimonialFormat && !isLogoSwapFormat;

  // Avatar field state for testimonial format
  const testimonialSettings = config.layoutSpecificSettings?.testimonial;
  const avatarAssetId = testimonialSettings?.authorAvatarAssetId;
  const avatarAsset = avatarAssetId ? assets.find((a) => a.id === avatarAssetId) : undefined;
  const showAuthorAvatar = testimonialSettings?.showAuthorAvatar !== false;
  const hasAvatarValue = showAuthorAvatar;
  const avatarLabel = avatarAsset?.name ?? "adrian.jpg";

  // Check if brand logo is currently applied
  const isBrandLogoApplied = logoAsset && brandLogoAsset && logoAsset.id === brandLogoAsset.id;

  // Check if brand logo is available but not applied (only for brand users)
  const hasBrandLogoAvailable = isBrandUser && !logoAsset && brandSettings.logoUrl;

  // Check if text is actually supported (not just hidden by layout type)
  const isPeakLeftOrRight = config.layoutId === "popup-gradient-left" || config.layoutId === "popup-gradient-right";
  const hideTextOnMobile = orientation === "mobile" && isPeakLeftOrRight;
  const hasHeadlineSupport = !hideTextOnMobile && (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const hasSubtitleSupport = !hideTextOnMobile && (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const hasTypography = !hideTextOnMobile && lookCapabilities?.typography !== false;
  const showTextSection = hasHeadlineSupport || hasSubtitleSupport || hasTypography;

  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (!onUploadAsset) return;
      
      // Process the file upload (this adds it to assets but doesn't apply to config)
      await onUploadAsset(file, "logo");
      
      // Find the newly uploaded logo asset (it will be the last one with kind "logo")
      // We need to wait a tick for the asset to be added
      setTimeout(() => {
        setAssets((currentAssets) => {
          const logoAssets = currentAssets.filter((a) => a.kind === "logo");
          const newLogoAsset = logoAssets[logoAssets.length - 1];
          
          if (newLogoAsset) {
            // Apply it to the config
            setConfig((currentConfig) => ({
              ...currentConfig,
              assets: {
                ...currentConfig.assets,
                logo: newLogoAsset.id,
              },
            }));
          }
          
          return currentAssets;
        });
      }, 50);
    },
    [onUploadAsset, setAssets, setConfig],
  );

  const handleHeaderFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, kind: "screenshot" | "logo") => {
      const file = event.target.files?.[0];
      if (file) {
        if (kind === "logo") {
          handleLogoUpload(file);
        } else if (onUploadAsset) {
          onUploadAsset(file, kind);
        }
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [onUploadAsset, handleLogoUpload],
  );

  const handleHeaderUploadClick = useCallback(
    (event: React.MouseEvent, kind: "screenshot" | "logo") => {
      event.stopPropagation();
      if (!onUploadAsset) return;
      if (kind === "screenshot") {
        screenshotInputRef.current?.click();
        return;
      }
      logoInputRef.current?.click();
    },
    [onUploadAsset],
  );

  const handleRemoveBrandLogo = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          logo: undefined,
        },
      }));
    },
    [setConfig],
  );

  const handleAvatarUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onUploadAsset) {
        onUploadAsset(file, "avatar");
      }
      if (event.target) event.target.value = "";
    },
    [onUploadAsset],
  );

  const handleRemoveAvatar = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      layoutSpecificSettings: {
        ...currentConfig.layoutSpecificSettings,
        testimonial: {
          ...currentConfig.layoutSpecificSettings?.testimonial,
          authorAvatarAssetId: undefined,
          showAuthorAvatar: false,
        },
      },
    }));
    track("testimonial_author_edited", { field: "authorAvatarAssetId" });
  }, [setConfig]);

  const handleApplyBrandLogo = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!brandSettings.logoUrl || !brandSettings.logoPath) return;
      
      // Check if brand logo already exists in assets
      const existingBrandLogo = assets.find(
        (asset) => asset.kind === "logo" && asset.url === brandSettings.logoUrl,
      );

      // Create or use existing brand logo asset
      const brandLogoAsset: Asset = existingBrandLogo ?? {
        id: `brand-logo-${Date.now()}`,
        projectId: "brand",
        userId: "brand",
        url: brandSettings.logoUrl,
        name: brandSettings.logoPath.split("/").pop() || "Brand logo",
        kind: "logo",
        createdAt: new Date().toISOString(),
      };

      // Add to assets if it's new
      if (!existingBrandLogo) {
        setAssets((prevAssets) => [...prevAssets, brandLogoAsset]);
      }

      // Apply logo to config (store asset ID, not the object)
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          logo: brandLogoAsset.id,
        },
      }));

      // Track re-application of brand logo
      track("brand_logo_reapplied", {
        source: "sidebar_header",
      });
    },
    [brandSettings.logoUrl, brandSettings.logoPath, assets, setAssets, setConfig],
  );



  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6 pt-6">
        {/* Content section — "what does it say?" */}
        {showTestimonialSections ? (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Content</span>
            </div>
            <TestimonialContentSection />
          </section>
        ) : showTextSection ? (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Content</span>
            </div>
            <LayoutSection isBrandUser={isBrandUser} />
          </section>
        ) : null}

        {/* Author section — "who said it?" (testimonial only) */}
        {showTestimonialSections && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Author</span>
            </div>
            <TestimonialAuthorSection />
          </section>
        )}

        {/* Avatar section (testimonial only) — same structure as Logo */}
        {showTestimonialSections && !isMobile && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Avatar</span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={avatarInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {hasAvatarValue ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        "h-6 gap-1.5 px-2 text-xs",
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "hover:bg-accent hover:text-accent-foreground",
                        "text-foreground underline decoration-muted-foreground/60 underline-offset-2 hover:decoration-foreground/80",
                      )}
                    >
                      <span className="max-w-[8rem] truncate" title={avatarLabel}>
                        {avatarLabel}
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        disabled={!onUploadAsset}
                        onClick={() => {
                          avatarInputRef.current?.click();
                        }}
                      >
                        <UploadCloud className="h-4 w-4" />
                        Upload new
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveAvatar}>
                        <Trash2 className="h-4 w-4" />
                        Clear avatar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={!onUploadAsset}
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="max-w-[8rem] truncate" title="Add avatar">
                      Add avatar...
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Font section (testimonial only — for screenshot, font is inside Content) */}
        {showTestimonialSections && showTextSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Font</span>
            </div>
            <LayoutSection isBrandUser={isBrandUser} />
          </section>
        )}

        {showTestimonialSections && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Style</span>
            </div>
            <TestimonialStyleSection />
          </section>
        )}

        {/* Logo Swap logos section (logo-swap only) */}
        {showLogoSwapSections && !isMobile && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Logos</span>
            </div>
            <LogoSwapLogosSection
              onUploadAsset={onUploadAsset}
              isBrandUser={isBrandUser}
            />
          </section>
        )}

        {/* Hide effects and background sections on mobile and for testimonial/logo-swap formats */}
        {!isMobile && !isTestimonialFormat && !isLogoSwapFormat && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Effects</span>
            </div>
            <EffectsSection />
          </section>
        )}

        {!isMobile && !isTestimonialFormat && <BackgroundSection />}

        {/* Hide screenshot section on mobile and for testimonial format */}
        {!isMobile && showScreenshotSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Screenshot</span>
              <div className="flex items-center">
                <input
                  type="file"
                  className="hidden"
                  ref={screenshotInputRef}
                  accept="image/*"
                  onChange={(event) => handleHeaderFileChange(event, "screenshot")}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!onUploadAsset}
                  onClick={(event) => handleHeaderUploadClick(event, "screenshot")}
                  className={cn(
                    "h-6 px-2 text-xs",
                    screenshotAsset
                      ? "text-foreground underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground/80 hover:decoration-foreground/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {screenshotAsset ? (
                    <span className="max-w-[8rem] truncate" title={screenshotAsset.name}>
                      {screenshotAsset.name}
                    </span>
                  ) : (
                    <span className="max-w-[8rem] truncate" title="Choose file">
                      Choose file...
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <ScreenshotSection onUploadAsset={onUploadAsset} />
          </section>
        )}

{showLogoSection && !isMobile && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Logo</span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={(event) => handleHeaderFileChange(event, "logo")}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div
                  className="relative group"
                  onMouseEnter={() => setIsLogoHovered(true)}
                  onMouseLeave={() => setIsLogoHovered(false)}
                >
                  {!logoAsset && hasBrandLogoAvailable ? (
                    // Show dropdown when no logo applied but brand logo is available
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={!onUploadAsset}
                        className={cn(
                          "h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground",
                          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          "disabled:pointer-events-none disabled:opacity-50",
                          "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="max-w-[8rem] truncate" title="Add logo">
                          Add logo...
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            const syntheticEvent = {
                              stopPropagation: () => {},
                            } as React.MouseEvent;
                            handleApplyBrandLogo(syntheticEvent);
                          }}
                        >
                          <Star className="h-4 w-4" />
                          Apply brand logo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            logoInputRef.current?.click();
                          }}
                        >
                          <UploadCloud className="h-4 w-4" />
                          Upload new
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Show regular button when logo is applied or no brand logo available
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={!onUploadAsset || (logoAsset && isLogoHovered)}
                      onClick={(event) => handleHeaderUploadClick(event, "logo")}
                      className={cn(
                        "h-6 gap-1.5 px-2 text-xs transition-opacity",
                        logoAsset
                          ? "text-foreground underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground/80 hover:decoration-foreground/80"
                          : "text-muted-foreground hover:text-foreground",
                        logoAsset && isLogoHovered && "opacity-0"
                      )}
                    >
                      {!logoAsset && <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />}
                      {logoAsset ? (
                        <span className="max-w-[8rem] truncate" title={isBrandLogoApplied ? "Brand logo" : logoAsset.name}>
                          {isBrandLogoApplied ? "Brand logo" : logoAsset.name}
                        </span>
                      ) : (
                        <span className="max-w-[8rem] truncate" title="Add logo">
                          Add logo...
                        </span>
                      )}
                    </Button>
                  )}
                  {logoAsset && isLogoHovered && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-150 rounded-md">
                      <button
                        onClick={handleRemoveBrandLogo}
                        className={cn(
                          "rounded-md p-1.5 transition-all",
                          "bg-white/10 hover:bg-white/20",
                          "text-white/90 hover:text-white",
                          "ring-1 ring-white/20 hover:ring-white/30",
                        )}
                        aria-label="Remove logo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <LogoSection onUploadAsset={onUploadAsset} />
          </section>
        )}
      </div>
    </div>
  );
};

// Export AssetDropzone for use in section components
export interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "logo";
}

export const AssetDropzone = ({
  asset,
  onUpload,
  onRemove,
  disabled,
  label,
  variant = "default",
}: AssetDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUpload) return;
      onUpload(file);
    },
    [onUpload],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      handleFile(file);
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onRemove) return;
      setConfirmOpen(true);
    },
    [onRemove],
  );

  const ariaLabel = asset
    ? `${label}: ${asset.name}. Press Enter to replace`
    : `${label}. Press Enter to upload`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "group relative h-auto w-full rounded-lg border border-border bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50",
        variant === "logo"
          ? "flex min-h-[120px] flex-col items-center gap-4 px-4 py-4"
          : "flex min-h-[72px] items-center gap-3 px-3 py-2",
      )}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background",
          variant === "logo" ? "h-16 w-16" : "h-10 w-14",
        )}
      >
        {asset ? (
          <>
            <img
              src={asset.url}
              alt={`Preview of ${asset.name}`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
            {asset && onRemove && (
              <Button
                type="button"
                onClick={handleRemove}
                aria-label="Remove asset"
                variant="ghost"
                size="sm"
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-white" aria-hidden="true" />
              </Button>
            )}
          </>
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          variant === "logo"
            ? "flex flex-col items-center gap-1 text-center"
            : "flex min-w-0 flex-1 flex-col",
        )}
      >
        <span
          className={cn(
            "w-full truncate font-semibold text-foreground",
            variant === "logo" ? "text-sm" : "text-xs",
          )}
          title={asset?.name ?? label}
        >
          {asset ? asset.name : label}
        </span>
        <span
          className={cn("text-muted-foreground", "text-xs")}
        >
          {asset ? "Click to replace" : "PNG, JPG"}
        </span>
      </div>

      {onRemove && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to remove this {label.toLowerCase()}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the uploaded {label.toLowerCase()} from your design. You can re-upload anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onRemove();
                  setConfirmOpen(false);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Button>
  );
};
