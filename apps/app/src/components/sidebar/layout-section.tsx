"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { configAtom, orientationAtom, brandSettingsAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, personalityStyleAtom } from "@/hooks/atoms/derived";
import { getLayoutFormat } from "@/domain/layout-def/definitions";
import { Label } from "@/components/ui/label";
import { FontStyleSelector } from "@/components/selectors/font-style-selector";
import { brandPersonalityLabels } from "@/lib/types/brand";
import type { FontStyle } from "@/domain/layout/types";

interface LayoutSectionProps {
  isBrandUser?: boolean;
}

export function LayoutSection({ isBrandUser = false }: LayoutSectionProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const orientation = useAtomValue(orientationAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const personalityStyle = useAtomValue(personalityStyleAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);
  
  // Get the personality label for display
  const personalityName = brandSettings.personality 
    ? brandPersonalityLabels[brandSettings.personality] 
    : undefined;

  // Hide text inputs for Peak Left/Right on mobile orientation
  const isPeakLeftOrRight = config.layoutId === "popup-gradient-left" || config.layoutId === "popup-gradient-right";
  const hideTextOnMobile = orientation === "mobile" && isPeakLeftOrRight;

  const isTestimonialFormat = getLayoutFormat(config.layoutId) === "testimonial";
  const showHeadlineInput = !hideTextOnMobile && (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const showSubtitleInput = !hideTextOnMobile && (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTypographyControls = !hideTextOnMobile && lookCapabilities?.typography !== false;

  const handleTextInputChange = useCallback(
    (field: "title" | "subtitle", value: string) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        text: {
          ...currentConfig.text,
          [field]: value,
        },
      }));
    },
    [setConfig],
  );

  const handleFontStyleChange = useCallback(
    (fontStyle: FontStyle) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontStyle,
      }));
    },
    [setConfig],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      {showHeadlineInput && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="look-headline" className="text-xs font-medium text-muted-foreground">
            {isTestimonialFormat ? "Quote" : "Headline"}
          </Label>
          <textarea
            id="look-headline"
            value={config.text.title ?? ""}
            onChange={(event) => handleTextInputChange("title", event.target.value)}
            placeholder={isTestimonialFormat ? "This product changed everything..." : "Bring the heat"}
            rows={2}
            maxLength={120}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      )}

      {showSubtitleInput && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="look-subtitle" className="text-xs font-medium text-muted-foreground">
            Subtitle
          </Label>
          <textarea
            id="look-subtitle"
            value={config.text.subtitle ?? ""}
            onChange={(event) => handleTextInputChange("subtitle", event.target.value)}
            placeholder="Keep the heat going"
            rows={2}
            maxLength={240}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      )}

      {showTypographyControls && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Font Name</Label>
          <FontStyleSelector
            fontStyle={config.fontStyle}
            onFontStyleChange={handleFontStyleChange}
            isBrandUser={isBrandUser}
            brandFontStyle={isBrandUser ? personalityStyle?.fontStyle : undefined}
            brandPersonalityName={isBrandUser ? personalityName : undefined}
          />
        </div>
      )}
    </div>
  );
}
