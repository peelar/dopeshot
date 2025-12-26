"use client";

import { useState } from "react";
import { GlobalControls } from "./global-controls";
import { GradientSection } from "./gradient-section";
import {
  GRADIENT_TEMPLATES,
  getTemplatesBySection,
  TEST_PALETTES,
  getPaletteById,
  type GradientTemplate,
  type RejectionReason,
  type GradientSection as GradientSectionType,
} from "@/domain/gradient-curation";
import { track } from "@/lib/analytics";

const SECTION_ORDER: GradientSectionType[] = [
  "linear",
  "radial",
  "conic",
  "layered",
  "monochrome",
];

export function GradientCurationWall() {
  // State management
  const [templates, setTemplates] = useState<GradientTemplate[]>(GRADIENT_TEMPLATES);
  const [selectedPaletteId, setSelectedPaletteId] = useState(TEST_PALETTES[0].id);
  const [showUiOverlay, setShowUiOverlay] = useState(false);
  const [showStopMarkers, setShowStopMarkers] = useState(false);

  const currentPalette = getPaletteById(selectedPaletteId) ?? TEST_PALETTES[0];

  // Handlers
  const handleStatusChange = (index: number, status: GradientTemplate["status"]) => {
    setTemplates((prev) =>
      prev.map((t) => (t.index === index ? { ...t, status } : t)),
    );
    track("gradient_status_changed", { index, status });
  };

  const handleRejectReasonToggle = (index: number, reason: RejectionReason) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.index !== index) return t;
        const reasons = t.rejectionReasons ?? [];
        const hasReason = reasons.includes(reason);
        return {
          ...t,
          rejectionReasons: hasReason
            ? reasons.filter((r) => r !== reason)
            : [...reasons, reason],
        };
      }),
    );
    track("gradient_rejection_reason_toggled", { index, reason });
  };

  const handleNoteChange = (index: number, note: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.index === index ? { ...t, notes: note } : t)),
    );
  };

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPaletteId(paletteId);
    track("gradient_curation_palette_changed", { paletteId });
  };

  const handleToggleUiOverlay = (enabled: boolean) => {
    setShowUiOverlay(enabled);
    track("gradient_curation_ui_overlay_toggled", { enabled });
  };

  const handleToggleStopMarkers = (enabled: boolean) => {
    setShowStopMarkers(enabled);
    track("gradient_curation_stop_markers_toggled", { enabled });
  };

  // Calculate stats
  const stats = {
    total: templates.length,
    keep: templates.filter((t) => t.status === "keep").length,
    reject: templates.filter((t) => t.status === "reject").length,
    pending: templates.filter((t) => t.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <header className="mb-8 space-y-2 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Gradient Curation Wall</h1>
          <p className="text-muted-foreground">
            Structural gradient templates evaluated across controlled palettes and UI overlays.
          </p>
          <div className="flex gap-4 pt-2 text-sm">
            <span className="rounded-md bg-muted px-2 py-1">
              <span className="font-medium text-green-600 dark:text-green-400">
                {stats.keep} kept
              </span>
            </span>
            <span className="rounded-md bg-muted px-2 py-1">
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.reject} rejected
              </span>
            </span>
            <span className="rounded-md bg-muted px-2 py-1">
              <span className="font-medium text-muted-foreground">
                {stats.pending} pending
              </span>
            </span>
            <span className="rounded-md bg-muted px-2 py-1">
              <span className="font-medium">{stats.total} total</span>
            </span>
          </div>
        </header>

        {/* Global Controls */}
        <div className="mb-8">
          <GlobalControls
            selectedPaletteId={selectedPaletteId}
            onPaletteChange={handlePaletteChange}
            showUiOverlay={showUiOverlay}
            onToggleUiOverlay={handleToggleUiOverlay}
            showStopMarkers={showStopMarkers}
            onToggleStopMarkers={handleToggleStopMarkers}
          />
        </div>

        {/* Gradient Sections */}
        <div className="space-y-12">
          {SECTION_ORDER.map((section) => {
            const sectionTemplates = getTemplatesBySection(section).map((template) => {
              const updated = templates.find((t) => t.index === template.index);
              return updated ?? template;
            });

            return (
              <GradientSection
                key={section}
                section={section}
                templates={sectionTemplates}
                palette={currentPalette}
                showUiOverlay={showUiOverlay}
                showStopMarkers={showStopMarkers}
                onStatusChange={handleStatusChange}
                onRejectReasonToggle={handleRejectReasonToggle}
                onNoteChange={handleNoteChange}
              />
            );
          })}
        </div>

        {/* Export Section (Future Enhancement) */}
        <div className="mt-12 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <p>
            Curation complete? Export results as a curated gradient library for production use.
          </p>
          <p className="mt-1 text-xs">(Export functionality coming soon)</p>
        </div>
      </div>
    </div>
  );
}
