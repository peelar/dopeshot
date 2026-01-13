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

interface FontStyleSelectorProps {
  fontStyle: FontStyle;
  onFontStyleChange: (fontStyle: FontStyle) => void;
  isBrandUser?: boolean;
}

export function FontStyleSelector({
  fontStyle,
  onFontStyleChange,
  isBrandUser = false,
}: FontStyleSelectorProps) {
  const currentStyle = FONT_STYLES.find((s) => s.id === fontStyle);
  const availableStyles = isBrandUser ? BRAND_FONTS : FREE_FONTS;

  return (
    <div className="w-full">
      <Select
        value={fontStyle}
        onValueChange={(value) => {
          if (!value) return;
          onFontStyleChange(value as FontStyle);
        }}
      >
        <SelectTrigger>
          <SelectValue className={currentStyle ? undefined : "text-muted-foreground"}>
            {currentStyle?.name ?? "Select font style"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-48">
          {availableStyles.map((style) => (
            <SelectItem key={style.id} value={style.id} className="py-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{style.name}</span>
                <span
                  style={{ fontFamily: `var(${style.cssVariable})` }}
                  className="text-xs text-muted-foreground"
                >
                  {style.fontName}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
