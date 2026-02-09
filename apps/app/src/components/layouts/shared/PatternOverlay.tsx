import { memo } from "react";
import { useAtomValue } from "jotai";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { DotsOverlay } from "@/components/layouts/shared/DotsOverlay";
import { ScanlinesOverlay } from "@/components/layouts/shared/ScanlinesOverlay";
import { OrganicBlobsOverlay } from "@/components/layouts/shared/OrganicBlobsOverlay";
import { personalityStyleAtom } from "@/hooks/atoms/derived";
import type { LayoutConfig } from "@/domain/layout/types";

interface PatternOverlayProps {
  config: LayoutConfig;
}

function PatternOverlayComponent({
  config,
}: PatternOverlayProps) {
  const personalityStyle = useAtomValue(personalityStyleAtom);

  // No texture for image backgrounds
  if (config.background?.type === "image") {
    return null;
  }

  const overlayEnabled = config.overlayEnabled !== false; // defaults to true

  // Personality texture overrides the default grain
  const texture = personalityStyle?.texture ?? "grain";
  const intensity = personalityStyle?.textureIntensity;

  return (
    <>
      {config.background?.patternId === "organic-blobs" ? (
        <OrganicBlobsOverlay config={config} />
      ) : null}
      {overlayEnabled ? (
        texture === "dots" ? (
          <DotsOverlay enabled intensity={intensity} />
        ) : texture === "scanlines" ? (
          <ScanlinesOverlay enabled intensity={intensity} />
        ) : (
          <GrainOverlay enabled />
        )
      ) : null}
    </>
  );
}

export const PatternOverlay = memo(PatternOverlayComponent);
