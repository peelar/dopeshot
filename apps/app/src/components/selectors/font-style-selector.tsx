"use client";

import { FontStyle } from "@/domain/layout/types";
import { BRAND_FONTS, FONT_STYLES, FREE_FONTS } from "@/domain/layout/fonts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2 } from "lucide-react";

interface FontStyleSelectorProps {
  fontStyle?: FontStyle;
  onFontStyleChange: (fontStyle: FontStyle) => void;
  isBrandUser?: boolean;
  /** The font style from the user's brand personality (if set) */
  brandFontStyle?: FontStyle;
  /** The user's brand personality name for display (e.g., "Tech", "Hipster") */
  brandPersonalityName?: string;
}

export function FontStyleSelector({
  fontStyle,
  onFontStyleChange,
  isBrandUser = false,
  brandFontStyle,
  brandPersonalityName,
}: FontStyleSelectorProps) {
  const availableStyles = isBrandUser ? BRAND_FONTS : FREE_FONTS;
  
  // Determine effective font style for display
  // If no explicit fontStyle, use brandFontStyle or default to "founder"
  const effectiveFontStyle = fontStyle ?? brandFontStyle ?? "founder";
  const currentStyle = FONT_STYLES.find((s) => s.id === effectiveFontStyle);
  
  // Check if we're showing the brand font (no explicit override)
  const isShowingBrandFont = !fontStyle && brandFontStyle;

  return (
    <div className="w-full">
      <Select
        value={effectiveFontStyle}
        onValueChange={(value) => {
          if (!value) return;
          onFontStyleChange(value as FontStyle);
        }}
      >
        <SelectTrigger>
          <SelectValue className={currentStyle ? undefined : "text-muted-foreground"}>
            <span className="flex items-center gap-1.5">
              {isShowingBrandFont && (
                <Link2 className="size-3.5 text-sky-500" />
              )}
              {currentStyle?.fontName ?? "Select font"}
              {isShowingBrandFont && brandPersonalityName && (
                <span className="text-muted-foreground">({brandPersonalityName})</span>
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-48">
          {availableStyles.map((style) => {
            const isBrandDefault = style.id === brandFontStyle;
            return (
              <SelectItem key={style.id} value={style.id} className="py-2">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-medium text-sm">
                    {isBrandDefault && (
                      <Link2 className="size-3 text-sky-500" />
                    )}
                    <span
                      style={{ fontFamily: `var(${style.cssVariable})` }}
                    >
                      {style.fontName}
                    </span>
                    {isBrandDefault && brandPersonalityName && (
                      <span className="text-xs text-muted-foreground">({brandPersonalityName})</span>
                    )}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
