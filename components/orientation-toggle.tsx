"use client";

import { useAtom } from "jotai";
import { canvasOrientationAtom } from "@/hooks/atoms";
import { cn } from "@/utils";

/**
 * OrientationToggle
 *
 * A small toggle button that switches between landscape and portrait canvas orientations.
 * Displays above the canvas preview.
 */
export function OrientationToggle() {
  const [orientation, setOrientation] = useAtom(canvasOrientationAtom);

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "landscape" ? "portrait" : "landscape"));
  };

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={toggleOrientation}
        aria-label={`Switch to ${orientation === "landscape" ? "portrait" : "landscape"} orientation`}
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {/* Orientation Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200"
          style={{
            transform: orientation === "portrait" ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          {/* Landscape rectangle icon */}
          <rect
            x="2"
            y="4"
            width="12"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Corner decorations for emphasis */}
          <path
            d="M4 6L4 6.01M12 6L12 6.01M4 10L4 10.01M12 10L12 10.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="capitalize">{orientation}</span>
      </button>
    </div>
  );
}
