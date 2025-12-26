"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TEST_PALETTES } from "@/domain/gradient-curation";

interface GlobalControlsProps {
  selectedPaletteId: string;
  onPaletteChange: (paletteId: string) => void;
  showUiOverlay: boolean;
  onToggleUiOverlay: (enabled: boolean) => void;
  showStopMarkers: boolean;
  onToggleStopMarkers: (enabled: boolean) => void;
}

export function GlobalControls({
  selectedPaletteId,
  onPaletteChange,
  showUiOverlay,
  onToggleUiOverlay,
  showStopMarkers,
  onToggleStopMarkers,
}: GlobalControlsProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {/* Palette Selector */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="palette-select" className="text-sm font-medium">
            Test Palette
          </Label>
          <Select
            value={selectedPaletteId}
            onValueChange={(value) => value && onPaletteChange(value)}
          >
            <SelectTrigger id="palette-select" className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_PALETTES.map((palette) => (
                <SelectItem key={palette.id} value={palette.id}>
                  {palette.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Test gradients across different color profiles
          </p>
        </div>

        {/* Overlay Toggles */}
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ui-overlay"
              checked={showUiOverlay}
              onCheckedChange={onToggleUiOverlay}
            />
            <Label
              htmlFor="ui-overlay"
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              UI Overlay
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="stop-markers"
              checked={showStopMarkers}
              onCheckedChange={onToggleStopMarkers}
            />
            <Label
              htmlFor="stop-markers"
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Stop Markers
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
