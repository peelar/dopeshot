"use client";

import { useRef } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

interface ScreenshotZoomSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function ScreenshotZoomSlider({ value, onChange, className }: ScreenshotZoomSliderProps) {
  const startValueRef = useRef(value);

  const handleZoomEnd = () => {
    if (Math.abs(value - startValueRef.current) > 0.05) {
      track("screenshot_zoom_changed", {
        zoom_level: value,
      });
      startValueRef.current = value;
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <input
        type="range"
        min={0.5}
        max={1.5}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={handleZoomEnd}
        onTouchEnd={handleZoomEnd}
        className={cn(
          "h-1.5 w-32 cursor-pointer appearance-none rounded-full",
          "bg-border transition-colors",
          "hover:bg-muted-foreground/30",
          "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-foreground/70 [&::-webkit-slider-thumb]:transition-colors",
          "[&::-webkit-slider-thumb]:hover:bg-foreground",
          "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5",
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground/70",
          "[&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-foreground",
        )}
        aria-label="Screenshot zoom"
      />
    </div>
  );
}
