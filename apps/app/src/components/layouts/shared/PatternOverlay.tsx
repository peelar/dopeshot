import { memo } from "react";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { OrganicBlobsOverlay } from "@/components/layouts/shared/OrganicBlobsOverlay";
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
      {config.background?.patternId === "organic-blobs" ? (
        <OrganicBlobsOverlay config={config} />
      ) : null}
      <GrainOverlay enabled />
    </>
  );
}

export const PatternOverlay = memo(PatternOverlayComponent);
