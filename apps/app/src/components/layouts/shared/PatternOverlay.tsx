import { memo } from "react";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { MetricPatternOverlay } from "@/components/layouts/shared/MetricPatternOverlay";
import type { LayoutConfig } from "@/domain/layout/types";

interface PatternOverlayProps {
  config: LayoutConfig;
}

function PatternOverlayComponent({
  config,
}: PatternOverlayProps) {
  // Grain texture is always enabled for gradient and solid backgrounds
  if (config.background?.type === "image") {
    return null;
  }

  return (
    <>
      <MetricPatternOverlay config={config} />
      <GrainOverlay enabled />
    </>
  );
}

export const PatternOverlay = memo(PatternOverlayComponent);
