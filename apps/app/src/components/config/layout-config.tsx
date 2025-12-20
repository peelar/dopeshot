"use client";

import { useRef, type ChangeEvent, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { Asset } from "@/domain/asset/types";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { configAtom, orientationAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom, logoAssetAtom } from "@/hooks/atoms/derived";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { ScreenshotSection } from "@/components/sidebar/screenshot-section";
import { LogoSection } from "@/components/sidebar/logo-section";
import { BackgroundSection } from "@/components/sidebar/background-section";
import { LayoutSection } from "@/components/sidebar/layout-section";
import { EffectsSection } from "@/components/sidebar/effects-section";
import { CodeSection } from "@/components/sidebar/code-section";

interface LayoutConfigProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  useAccordions?: boolean;
}

export const LayoutConfigPanel = ({ onUploadAsset, useAccordions = true }: LayoutConfigProps) => {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const logoAsset = useAtomValue(logoAssetAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const orientation = useAtomValue(orientationAtom);

  const { expandedSection, expandSection } = useSidebarState();

  const showLogoSection = lookCapabilities?.logo !== "hidden";
  const showCodeSection = config.layoutId === "code-snippet";

  // Check if text is actually supported (not just hidden by layout type)
  const isPeakLeftOrRight = config.layoutId === "popup-gradient-left" || config.layoutId === "popup-gradient-right";
  const hideTextOnMobile = orientation === "mobile" && isPeakLeftOrRight;
  const hasHeadlineSupport = !hideTextOnMobile && (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const hasSubtitleSupport = !hideTextOnMobile && (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTextSection = !showCodeSection && (hasHeadlineSupport || hasSubtitleSupport);

  // Initialize default expansion based on state
  useEffect(() => {
    if (!screenshotAsset && !expandedSection) {
      expandSection("screenshot");
    }
  }, [screenshotAsset, expandedSection, expandSection]);

  const getScreenshotStatus = () => {
    if (!screenshotAsset) return "No screenshot";
    return screenshotAsset.name;
  };

  const getLogoStatus = () => {
    if (logoAsset) return "Uploaded";
    return "Optional";
  };

  const defaultAccordionValues = showCodeSection
    ? ["code", "background"]
    : ["look", "effects", "background"];
  const getAccordionIds = (sectionId: string) => {
    const baseId = `layout-config-${sectionId}`;
    return {
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
    };
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      {useAccordions ? (
        <Accordion
          type="multiple"
          defaultValue={defaultAccordionValues}
          className="w-full"
        >
          {showTextSection && (
            <AccordionItem value="look" className="border-b">
              <AccordionTrigger
                id={getAccordionIds("look").triggerId}
                aria-controls={getAccordionIds("look").contentId}
                className="px-4 py-3 hover:no-underline"
              >
                <div className="flex w-full items-center justify-between pr-4">
                  <span className="text-sm font-semibold">Text</span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                id={getAccordionIds("look").contentId}
                aria-labelledby={getAccordionIds("look").triggerId}
                className="px-4 pb-4"
              >
                <LayoutSection />
              </AccordionContent>
            </AccordionItem>
          )}

          {showCodeSection && (
            <div className="border-b">
              <div className="px-4 py-3">
                <span className="text-sm font-semibold">Code</span>
              </div>
              <div className="px-4 pb-4">
                <CodeSection />
              </div>
            </div>
          )}

          {!showCodeSection && (
            <AccordionItem value="effects" className="border-b">
              <AccordionTrigger
                id={getAccordionIds("effects").triggerId}
                aria-controls={getAccordionIds("effects").contentId}
                className="px-4 py-3 hover:no-underline"
              >
                <div className="flex w-full items-center justify-between pr-4">
                  <span className="text-sm font-semibold">Effects</span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                id={getAccordionIds("effects").contentId}
                aria-labelledby={getAccordionIds("effects").triggerId}
                className="px-4 pb-4"
              >
                <EffectsSection />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="background" className="border-b">
            <AccordionTrigger
              id={getAccordionIds("background").triggerId}
              aria-controls={getAccordionIds("background").contentId}
              className="px-4 py-3 hover:no-underline"
            >
              <div className="flex w-full items-center justify-between pr-4">
                <span className="text-sm font-semibold">Background</span>
              </div>
            </AccordionTrigger>
            <AccordionContent
              id={getAccordionIds("background").contentId}
              aria-labelledby={getAccordionIds("background").triggerId}
              className="px-4 pb-4"
            >
              <BackgroundSection onUploadAsset={onUploadAsset} />
            </AccordionContent>
          </AccordionItem>

          {!showCodeSection && (
            <AccordionItem value="screenshot" className="border-b">
              <AccordionTrigger
                id={getAccordionIds("screenshot").triggerId}
                aria-controls={getAccordionIds("screenshot").contentId}
                className="px-4 py-3 hover:no-underline"
              >
                <div className="flex w-full items-center justify-between pr-4">
                  <span className="text-sm font-semibold">Screenshot</span>
                  <span className="text-xs text-muted-foreground">{getScreenshotStatus()}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                id={getAccordionIds("screenshot").contentId}
                aria-labelledby={getAccordionIds("screenshot").triggerId}
                className="px-4 pb-4"
              >
                <ScreenshotSection onUploadAsset={onUploadAsset} />
              </AccordionContent>
            </AccordionItem>
          )}

          {showLogoSection && (
            <AccordionItem value="logo" className="border-b">
              <AccordionTrigger
                id={getAccordionIds("logo").triggerId}
                aria-controls={getAccordionIds("logo").contentId}
                className="px-4 py-3 hover:no-underline"
              >
                <div className="flex w-full items-center justify-between pr-4">
                  <span className="text-sm font-semibold">Logo</span>
                  <span className="text-xs text-muted-foreground">{getLogoStatus()}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                id={getAccordionIds("logo").contentId}
                aria-labelledby={getAccordionIds("logo").triggerId}
                className="px-4 pb-4"
              >
                <LogoSection onUploadAsset={onUploadAsset} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      ) : (
        <div className="flex flex-col gap-6 pb-6">
          {showTextSection && (
            <section className="space-y-3 px-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Text</span>
              </div>
              <LayoutSection />
            </section>
          )}

          {showCodeSection && (
            <section className="space-y-3 px-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Code</span>
              </div>
              <CodeSection />
            </section>
          )}

          {!showCodeSection && (
            <section className="space-y-3 px-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Effects</span>
              </div>
              <EffectsSection />
            </section>
          )}

          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Background</span>
            </div>
            <BackgroundSection onUploadAsset={onUploadAsset} />
          </section>

          {!showCodeSection && (
            <section className="space-y-3 px-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Screenshot</span>
                <span className="text-xs text-muted-foreground">{getScreenshotStatus()}</span>
              </div>
              <ScreenshotSection onUploadAsset={onUploadAsset} />
            </section>
          )}

          {showLogoSection && (
            <section className="space-y-3 px-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Logo</span>
                <span className="text-xs text-muted-foreground">{getLogoStatus()}</span>
              </div>
              <LogoSection onUploadAsset={onUploadAsset} />
            </section>
          )}
        </div>
      )}
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
      onRemove?.();
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
        "group relative h-auto w-full rounded-2xl border border-border bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          "relative flex items-center justify-center overflow-hidden rounded border border-border bg-background",
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
            "truncate font-semibold text-foreground",
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
    </Button>
  );
};
