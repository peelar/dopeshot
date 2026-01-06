"use client";

import { memo, Suspense, lazy, type ComponentType } from "react";
import type { ShaderConfig, ShaderType } from "@/domain/shaders/types";

// Lazy load shader components to reduce initial bundle
const MeshGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.MeshGradient }))
);
const StaticMeshGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.StaticMeshGradient }))
);
const GrainGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.GrainGradient }))
);
const SimplexNoise = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.SimplexNoise }))
);
const Waves = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Waves }))
);
const NeuroNoise = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.NeuroNoise }))
);
const Metaballs = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Metaballs }))
);
const Voronoi = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Voronoi }))
);
const PerlinNoise = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.PerlinNoise }))
);
const Swirl = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Swirl }))
);
const GodRays = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.GodRays }))
);
const DotOrbit = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.DotOrbit }))
);
const SmokeRing = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.SmokeRing }))
);

// Map shader types to their lazy-loaded components
const SHADER_COMPONENTS: Record<ShaderType, ComponentType<Record<string, unknown>>> = {
  "mesh-gradient": MeshGradient as ComponentType<Record<string, unknown>>,
  "static-mesh-gradient": StaticMeshGradient as ComponentType<Record<string, unknown>>,
  "grain-gradient": GrainGradient as ComponentType<Record<string, unknown>>,
  "simplex-noise": SimplexNoise as ComponentType<Record<string, unknown>>,
  waves: Waves as ComponentType<Record<string, unknown>>,
  "neuro-noise": NeuroNoise as ComponentType<Record<string, unknown>>,
  metaballs: Metaballs as ComponentType<Record<string, unknown>>,
  voronoi: Voronoi as ComponentType<Record<string, unknown>>,
  "perlin-noise": PerlinNoise as ComponentType<Record<string, unknown>>,
  swirl: Swirl as ComponentType<Record<string, unknown>>,
  "god-rays": GodRays as ComponentType<Record<string, unknown>>,
  "dot-orbit": DotOrbit as ComponentType<Record<string, unknown>>,
  "smoke-ring": SmokeRing as ComponentType<Record<string, unknown>>,
};

interface ShaderBackgroundProps {
  config: ShaderConfig;
  className?: string;
  style?: React.CSSProperties;
}

// Fallback while shader loads
function ShaderFallback({ color }: { color?: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: color || "#1e1b4b",
      }}
    />
  );
}

// Inner component that renders the actual shader
function ShaderRenderer({ config, className, style }: ShaderBackgroundProps) {
  const ShaderComponent = SHADER_COMPONENTS[config.type];

  if (!ShaderComponent) {
    console.warn(`Unknown shader type: ${config.type}`);
    return <ShaderFallback color={config.params.colors?.[0]} />;
  }

  // Build props from config params
  const shaderProps: Record<string, unknown> = {
    ...config.params,
    style: {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      ...style,
    },
    className,
  };

  return <ShaderComponent {...shaderProps} />;
}

/**
 * ShaderBackground - Renders paper-design shaders as backgrounds
 *
 * This component lazy-loads the appropriate shader based on the config type
 * and renders it with the specified parameters.
 */
export const ShaderBackground = memo(function ShaderBackground(props: ShaderBackgroundProps) {
  const fallbackColor = props.config.params.colors?.[0] || "#1e1b4b";

  return (
    <Suspense fallback={<ShaderFallback color={fallbackColor} />}>
      <ShaderRenderer {...props} />
    </Suspense>
  );
});

/**
 * ShaderPreview - Smaller preview version for picker swatches
 */
interface ShaderPreviewProps {
  config: ShaderConfig;
  size?: number;
}

export const ShaderPreview = memo(function ShaderPreview({
  config,
  size = 48,
}: ShaderPreviewProps) {
  // For preview, we want a static/slower version
  const previewConfig: ShaderConfig = {
    ...config,
    params: {
      ...config.params,
      speed: 0.05, // Slow down for preview
    },
  };

  return (
    <div
      className="relative overflow-hidden rounded-md"
      style={{ width: size, height: size }}
    >
      <ShaderBackground config={previewConfig} />
    </div>
  );
});
