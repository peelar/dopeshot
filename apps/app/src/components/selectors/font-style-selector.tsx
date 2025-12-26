"use client";

import { FontStyle } from "@/domain/layout/types";
import { FONT_STYLES } from "@/domain/layout/fonts";
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
}

export function FontStyleSelector({ fontStyle, onFontStyleChange }: FontStyleSelectorProps) {
  const currentStyle = FONT_STYLES.find((s) => s.id === fontStyle);

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
          {FONT_STYLES.map((style) => (
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
