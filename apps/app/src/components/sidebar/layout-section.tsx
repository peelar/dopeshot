"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { track } from "@/lib/analytics";
import { configAtom, orientationAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
import { Label } from "@/components/ui/label";
import { FontStyleSelector } from "@/components/selectors/font-style-selector";
import type { FontStyle } from "@/domain/layout/types";

export function LayoutSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const orientation = useAtomValue(orientationAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const headlineTrackedRef = useRef(false);
  const subtitleTrackedRef = useRef(false);

  // Hide text inputs for Peak Left/Right on mobile orientation
  const isPeakLeftOrRight = config.layoutId === "popup-gradient-left" || config.layoutId === "popup-gradient-right";
  const hideTextOnMobile = orientation === "mobile" && isPeakLeftOrRight;

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
      track("font_style_changed", {
        style_name: fontStyle,
        previous_style: config.fontStyle,
      });
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontStyle,
      }));
    },
    [setConfig, config.fontStyle],
  );

  const handleHeadlineBlur = useCallback(() => {
    const text = config.text.title?.trim();
    if (text && text.length > 0 && !headlineTrackedRef.current) {
      track("headline_modified", {
        length: text.length,
      });
      headlineTrackedRef.current = true;
    }
  }, [config.text.title]);

  const handleSubtitleBlur = useCallback(() => {
    const text = config.text.subtitle?.trim();
    if (text && text.length > 0 && !subtitleTrackedRef.current) {
      track("subtitle_modified", {
        length: text.length,
      });
      subtitleTrackedRef.current = true;
    }
  }, [config.text.subtitle]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {showHeadlineInput && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="look-headline" className="text-xs font-medium text-muted-foreground">
            Headline
          </Label>
          <input
            id="look-headline"
            value={config.text.title ?? ""}
            onChange={(event) => handleTextInputChange("title", event.target.value)}
            onBlur={handleHeadlineBlur}
            placeholder="Bring the heat"
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
            onBlur={handleSubtitleBlur}
            placeholder="Keep the heat going"
            rows={2}
            maxLength={240}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      )}

      {showTypographyControls && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Font Style</Label>
          <FontStyleSelector
            fontStyle={config.fontStyle}
            onFontStyleChange={handleFontStyleChange}
          />
        </div>
      )}
    </div>
  );
}
