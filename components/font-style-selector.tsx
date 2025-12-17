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
      <Select value={fontStyle} onValueChange={(v: string) => onFontStyleChange(v as FontStyle)}>
        <SelectTrigger>
          <SelectValue placeholder="Select font style">{currentStyle?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FONT_STYLES.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{style.name}</span>
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
