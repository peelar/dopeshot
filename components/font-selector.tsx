"use client";

import { FontId, FontSize } from "@/domain/layout/types";
import { FONTS, FONT_SIZES, getFontSizeById } from "@/domain/layout/fonts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus } from "lucide-react";

interface FontSelectorProps {
  fontId: FontId;
  fontSize: FontSize;
  onFontChangeAction: (fontId: FontId) => void;
  onSizeChangeAction: (fontSize: FontSize) => void;
}

export function FontSelector({
  fontId,
  fontSize,
  onFontChangeAction,
  onSizeChangeAction,
}: FontSelectorProps) {
  const currentSizeIndex = FONT_SIZES.findIndex((s) => s.id === fontSize);
  const currentSize = getFontSizeById(fontSize);

  const handleSizeDecrease = () => {
    if (currentSizeIndex > 0) {
      onSizeChangeAction(FONT_SIZES[currentSizeIndex - 1].id);
    }
  };

  const handleSizeIncrease = () => {
    if (currentSizeIndex < FONT_SIZES.length - 1) {
      onSizeChangeAction(FONT_SIZES[currentSizeIndex + 1].id);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Font Select - 3/4 width */}
        <div className="flex-[3]">
          <Select value={fontId} onValueChange={(v) => onFontChangeAction(v as FontId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{font.alias}</span>
                    <span
                      style={{ fontFamily: `var(${font.cssVariable})` }}
                      className="text-xs text-muted-foreground"
                    >
                      {font.fontName}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size Controls - 1/4 width */}
        <div className="flex flex-1 items-center">
          <div className="flex h-9 w-full items-center rounded-md border border-border">
            <button
              type="button"
              onClick={handleSizeDecrease}
              disabled={currentSizeIndex === 0}
              aria-label="Decrease font size"
              className="flex h-full w-7 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:text-foreground hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex-1 text-center text-xs font-medium">{currentSize.label}</span>
            <button
              type="button"
              onClick={handleSizeIncrease}
              disabled={currentSizeIndex === FONT_SIZES.length - 1}
              aria-label="Increase font size"
              className="flex h-full w-7 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
