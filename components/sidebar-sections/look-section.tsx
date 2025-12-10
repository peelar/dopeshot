"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { configAtom } from "@/hooks/atoms";
import { lookCapabilitiesAtom } from "@/hooks/atoms/derived";
import { Label } from "@/components/ui/label";
import { FontSelector } from "@/components/font-selector";
import type { FontId, FontSize } from "@/domain/layout/types";

export function LookSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const lookCapabilities = useAtomValue(lookCapabilitiesAtom);

  const showHeadlineInput = (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const showSubtitleInput = (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTypographyControls = lookCapabilities?.typography !== false;

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

  const handleFontChange = useCallback(
    (fontId: FontId) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontId,
      }));
    },
    [setConfig],
  );

  const handleFontSizeChange = useCallback(
    (fontSize: FontSize) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontSize,
      }));
    },
    [setConfig],
  );

  if (!showHeadlineInput && !showSubtitleInput) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        This look doesn&apos;t support text content
      </div>
    );
  }

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
            placeholder="Bring the heat"
            maxLength={120}
            className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">
            {config.text.title?.length ?? 0}/120 characters
          </span>
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
          <span className="text-xs text-muted-foreground">
            {config.text.subtitle?.length ?? 0}/240 characters
          </span>
        </div>
      )}

      {showTypographyControls && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Typography</Label>
          <FontSelector
            fontId={config.fontId}
            fontSize={config.fontSize}
            onFontChangeAction={handleFontChange}
            onSizeChangeAction={handleFontSizeChange}
          />
        </div>
      )}
    </div>
  );
}
