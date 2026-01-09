import { memo, useMemo } from "react";
import type { LayoutConfig } from "@/domain/layout/types";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";
import {
  createMetricPatternSvgDataUrl,
  METRIC_PATTERN_MASK,
  parseMetricSeed,
} from "@/components/layouts/shared/metric-patterns";

interface MetricPatternOverlayProps {
  config: LayoutConfig;
}

const DEFAULT_VIEWBOX = { width: 1200, height: 630 };

function MetricPatternOverlayComponent({ config }: MetricPatternOverlayProps) {
  const isMetric = config.background?.type === "metric";
  const seed = parseMetricSeed(isMetric ? config.background.value : undefined);
  const primary = tokenToCssColor(config.colors.accent);

  const patternUrl = useMemo(() => {
    if (!isMetric) return null;
    return createMetricPatternSvgDataUrl({
      seed,
      width: DEFAULT_VIEWBOX.width,
      height: DEFAULT_VIEWBOX.height,
      primaryColor: primary,
      stepPx: 20,
    });
  }, [isMetric, seed, primary]);

  if (!isMetric || !patternUrl) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${patternUrl}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          opacity: 0.55,
          maskImage: METRIC_PATTERN_MASK,
          WebkitMaskImage: METRIC_PATTERN_MASK,
        }}
      />
    </div>
  );
}

export const MetricPatternOverlay = memo(MetricPatternOverlayComponent);
