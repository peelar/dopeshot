"use client";

import type {
  GradientTemplate,
  RejectionReason,
  TestPalette,
} from "@/domain/gradient-curation";
import { SECTION_METADATA } from "@/domain/gradient-curation";
import { GradientItem } from "./gradient-item";

interface GradientSectionProps {
  section: GradientTemplate["section"];
  templates: GradientTemplate[];
  palette: TestPalette;
  showUiOverlay: boolean;
  showStopMarkers: boolean;
  onStatusChange: (index: number, status: GradientTemplate["status"]) => void;
  onRejectReasonToggle: (index: number, reason: RejectionReason) => void;
  onNoteChange: (index: number, note: string) => void;
}

export function GradientSection({
  section,
  templates,
  palette,
  showUiOverlay,
  showStopMarkers,
  onStatusChange,
  onRejectReasonToggle,
  onNoteChange,
}: GradientSectionProps) {
  const metadata = SECTION_METADATA[section];

  if (templates.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="space-y-1 border-b pb-3">
        <h2 className="text-xl font-bold">{metadata.title}</h2>
        <p className="text-sm text-muted-foreground">{metadata.description}</p>
      </div>

      {/* Gradient Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <GradientItem
            key={template.index}
            template={template}
            palette={palette}
            showUiOverlay={showUiOverlay}
            showStopMarkers={showStopMarkers}
            onStatusChange={onStatusChange}
            onRejectReasonToggle={onRejectReasonToggle}
            onNoteChange={onNoteChange}
          />
        ))}
      </div>
    </section>
  );
}
