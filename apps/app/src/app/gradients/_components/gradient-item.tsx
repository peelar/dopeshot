"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { customGradientToCss } from "@/domain/layout/gradients";
import type {
  GradientTemplate,
  RejectionReason,
  TestPalette,
} from "@/domain/gradient-curation";
import { track } from "@/lib/analytics";

interface GradientItemProps {
  template: GradientTemplate;
  palette: TestPalette;
  showUiOverlay: boolean;
  showStopMarkers: boolean;
  onStatusChange: (index: number, status: GradientTemplate["status"]) => void;
  onRejectReasonToggle: (index: number, reason: RejectionReason) => void;
  onNoteChange: (index: number, note: string) => void;
}

export function GradientItem({
  template,
  palette,
  showUiOverlay,
  showStopMarkers,
  onStatusChange,
  onRejectReasonToggle,
  onNoteChange,
}: GradientItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Apply test palette colors to gradient
  const gradientWithPalette = applyPaletteToGradient(template.gradient, palette);
  const gradientCss = customGradientToCss(gradientWithPalette);

  const handleKeep = () => {
    track("gradient_curation_status_changed", {
      index: template.index,
      status: "keep",
      section: template.section,
    });
    onStatusChange(template.index, "keep");
  };

  const handleReject = () => {
    track("gradient_curation_status_changed", {
      index: template.index,
      status: "reject",
      section: template.section,
    });
    onStatusChange(template.index, "reject");
    setIsExpanded(true);
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all",
        template.status === "keep" && "border-green-500/50 bg-green-500/5",
        template.status === "reject" && "border-red-500/50 bg-red-500/5",
        template.status === "pending" && "border-border",
      )}
    >
      {/* Index Badge */}
      <div className="absolute left-3 top-3 z-10 rounded-md bg-black/60 px-2 py-1 font-mono text-xs font-semibold text-white backdrop-blur-sm">
        #{String(template.index).padStart(3, "0")}
      </div>

      {/* Gradient Preview */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
        <div className="absolute inset-0" style={{ background: gradientCss }} />

        {/* Stop Markers Overlay */}
        {showStopMarkers && (
          <div className="absolute inset-0 flex items-end px-4 pb-4">
            <div className="flex w-full items-center justify-between">
              {template.gradient.stops.map((stop, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1"
                  style={{ marginLeft: `${stop.position ?? 0}%` }}
                >
                  <div className="h-2 w-2 rounded-full bg-white shadow-lg ring-2 ring-black/20" />
                  <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                    {stop.position ?? 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UI Overlay */}
        {showUiOverlay && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-sm space-y-3 rounded-lg bg-white/90 p-6 text-center shadow-xl backdrop-blur-sm dark:bg-black/90">
              <h3 className="text-lg font-bold text-foreground">UI Legibility Test</h3>
              <p className="text-sm text-muted-foreground">
                This overlay tests if UI content remains readable against the gradient.
              </p>
              <Button size="sm">Call to Action</Button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">{template.label}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={template.status === "keep" ? "default" : "outline"}
            onClick={handleKeep}
            className={cn(template.status === "keep" && "bg-green-600 hover:bg-green-700")}
          >
            Keep
          </Button>
          <Button
            size="sm"
            variant={template.status === "reject" ? "destructive" : "outline"}
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? "Hide" : "Note"}
          </Button>
        </div>

        {/* Expanded Notes Section */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-3">
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add notes about this gradient..."
              value={template.notes ?? ""}
              onChange={(e) => onNoteChange(template.index, e.target.value)}
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Apply test palette colors to a gradient template
 * Replaces black/white placeholder colors with palette colors
 */
function applyPaletteToGradient(
  gradient: GradientTemplate["gradient"],
  palette: TestPalette,
): GradientTemplate["gradient"] {
  const stops = gradient.stops.map((stop) => {
    let color = stop.color;

    // Map placeholder colors to palette
    if (color === "#000000" || color.toLowerCase() === "#0a0a0a") {
      color = palette.colors.primary;
    } else if (color === "#ffffff" || color.toLowerCase() === "#f5f5f5") {
      color = palette.colors.secondary;
    } else if (
      color.toLowerCase() === "#666666" ||
      color.toLowerCase() === "#cccccc" ||
      color.toLowerCase() === "#333333"
    ) {
      color = palette.colors.neutral;
    }

    return { ...stop, color };
  });

  return { ...gradient, stops };
}
