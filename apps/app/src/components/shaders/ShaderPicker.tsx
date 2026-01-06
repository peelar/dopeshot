"use client";

import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import {
  SHADER_PRESETS,
  FEATURED_SHADER_PRESETS,
  type ShaderPreset,
  type ShaderCategory,
  SHADER_META,
} from "@/domain/shaders";
import { ShaderPreview } from "./ShaderBackground";

interface ShaderPickerProps {
  selectedPresetId?: string;
  onSelectPreset: (preset: ShaderPreset) => void;
  variant?: "default" | "compact";
}

const CATEGORY_LABELS: Record<ShaderCategory, string> = {
  gradients: "Gradients",
  abstract: "Abstract",
  patterns: "Patterns",
  organic: "Organic",
};

const CATEGORY_ORDER: ShaderCategory[] = ["gradients", "abstract", "patterns", "organic"];

/**
 * ShaderPicker - UI for selecting shader backgrounds
 *
 * Shows featured presets in a grid with hover previews.
 * Compact variant shows a horizontal scroll of swatches.
 */
export const ShaderPicker = memo(function ShaderPicker({
  selectedPresetId,
  onSelectPreset,
  variant = "default",
}: ShaderPickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleSelect = useCallback(
    (preset: ShaderPreset) => {
      track("shader_background_selected", {
        preset_id: preset.id,
        shader_type: preset.config.type,
        category: preset.category,
      });
      onSelectPreset(preset);
    },
    [onSelectPreset]
  );

  const displayPresets = showAll ? SHADER_PRESETS : FEATURED_SHADER_PRESETS;

  if (variant === "compact") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FEATURED_SHADER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelect(preset)}
            className={cn(
              "relative flex-shrink-0 rounded-lg overflow-hidden transition-all",
              "ring-2 ring-offset-2 ring-offset-slate-900",
              selectedPresetId === preset.id
                ? "ring-indigo-500"
                : "ring-transparent hover:ring-slate-600"
            )}
            title={preset.name}
          >
            <ShaderPreview config={preset.config} size={40} />
          </button>
        ))}
      </div>
    );
  }

  // Group presets by category when showing all
  const presetsByCategory = showAll
    ? CATEGORY_ORDER.reduce(
        (acc, category) => {
          acc[category] = SHADER_PRESETS.filter((p) => p.category === category);
          return acc;
        },
        {} as Record<ShaderCategory, ShaderPreset[]>
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Featured / All toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          {showAll ? "All Shaders" : "Featured"}
        </span>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {showAll ? "Show Less" : "Show All"}
        </button>
      </div>

      {/* Featured grid */}
      {!showAll && (
        <div className="grid grid-cols-3 gap-2">
          {displayPresets.map((preset) => (
            <ShaderSwatchButton
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id}
              isHovered={hoveredId === preset.id}
              onSelect={handleSelect}
              onHover={setHoveredId}
            />
          ))}
        </div>
      )}

      {/* Categorized view */}
      {showAll && presetsByCategory && (
        <div className="flex flex-col gap-4">
          {CATEGORY_ORDER.map((category) => {
            const presets = presetsByCategory[category];
            if (presets.length === 0) return null;

            return (
              <div key={category} className="flex flex-col gap-2">
                <span className="text-xs text-slate-500">{CATEGORY_LABELS[category]}</span>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <ShaderSwatchButton
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresetId === preset.id}
                      isHovered={hoveredId === preset.id}
                      onSelect={handleSelect}
                      onHover={setHoveredId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hovered preset info */}
      {hoveredId && (
        <HoveredPresetInfo
          preset={SHADER_PRESETS.find((p) => p.id === hoveredId)}
        />
      )}
    </div>
  );
});

interface ShaderSwatchButtonProps {
  preset: ShaderPreset;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (preset: ShaderPreset) => void;
  onHover: (id: string | null) => void;
}

const ShaderSwatchButton = memo(function ShaderSwatchButton({
  preset,
  isSelected,
  onSelect,
  onHover,
}: ShaderSwatchButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      onMouseEnter={() => onHover(preset.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden transition-all",
        "ring-2 ring-offset-1 ring-offset-slate-900",
        isSelected ? "ring-indigo-500 scale-105" : "ring-transparent hover:ring-slate-600"
      )}
      title={preset.name}
    >
      <ShaderPreview config={preset.config} size={64} />
      {/* Subtle gradient overlay for better visual */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </button>
  );
});

function HoveredPresetInfo({ preset }: { preset?: ShaderPreset }) {
  if (!preset) return null;

  const meta = SHADER_META[preset.config.type];

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-md px-2 py-1.5">
      <span className="font-medium text-slate-200">{preset.name}</span>
      <span className="text-slate-500">|</span>
      <span>{meta.name}</span>
      {meta.animated && (
        <>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">Animated</span>
        </>
      )}
    </div>
  );
}

/**
 * ShaderPickerInline - Minimal inline picker for quick access
 */
interface ShaderPickerInlineProps {
  selectedPresetId?: string;
  onSelectPreset: (preset: ShaderPreset) => void;
}

export const ShaderPickerInline = memo(function ShaderPickerInline({
  selectedPresetId,
  onSelectPreset,
}: ShaderPickerInlineProps) {
  const handleSelect = useCallback(
    (preset: ShaderPreset) => {
      track("shader_background_selected_inline", {
        preset_id: preset.id,
        shader_type: preset.config.type,
      });
      onSelectPreset(preset);
    },
    [onSelectPreset]
  );

  return (
    <div className="flex gap-1.5 flex-wrap">
      {FEATURED_SHADER_PRESETS.slice(0, 4).map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => handleSelect(preset)}
          className={cn(
            "relative w-8 h-8 rounded-md overflow-hidden transition-all",
            "ring-1 ring-offset-1 ring-offset-slate-900",
            selectedPresetId === preset.id
              ? "ring-indigo-500"
              : "ring-slate-700 hover:ring-slate-500"
          )}
          title={preset.name}
        >
          <ShaderPreview config={preset.config} size={32} />
        </button>
      ))}
    </div>
  );
});
