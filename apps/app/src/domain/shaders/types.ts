/**
 * Paper Shaders Integration Types
 *
 * This module defines types for integrating @paper-design/shaders-react
 * as dynamic background options in dopeshot.
 */

// Available shader types that work well as backgrounds
export type ShaderType =
  | "mesh-gradient"
  | "static-mesh-gradient"
  | "grain-gradient"
  | "simplex-noise"
  | "waves"
  | "neuro-noise"
  | "metaballs"
  | "voronoi"
  | "perlin-noise"
  | "swirl"
  | "god-rays"
  | "dot-orbit"
  | "smoke-ring";

// Grain gradient shapes
export type GrainGradientShape =
  | "wave"
  | "dots"
  | "truchet"
  | "corners"
  | "ripple"
  | "blob"
  | "sphere";

// Base shader params shared across most shaders
export interface BaseShaderParams {
  speed?: number;
  scale?: number;
  colors?: string[];
}

// Mesh Gradient specific params
export interface MeshGradientParams extends BaseShaderParams {
  distortion?: number;
  swirl?: number;
  grainMixer?: number;
  grainOverlay?: number;
}

// Static Mesh Gradient params (non-animated)
export interface StaticMeshGradientParams extends BaseShaderParams {
  softness?: number;
  warpX?: number;
  warpY?: number;
  noise?: number;
}

// Grain Gradient params
export interface GrainGradientParams extends BaseShaderParams {
  colorBack?: string;
  softness?: number;
  intensity?: number;
  noise?: number;
  shape?: GrainGradientShape;
}

// Simplex Noise params
export interface SimplexNoiseParams extends BaseShaderParams {
  stepsPerColor?: number;
  softness?: number;
}

// Waves params
export interface WavesParams extends BaseShaderParams {
  colorBack?: string;
  amplitude?: number;
  frequency?: number;
  spacing?: number;
  strokeWidth?: number;
}

// Neuro Noise params
export interface NeuroNoiseParams extends BaseShaderParams {
  colorBack?: string;
  brightness?: number;
  contrast?: number;
}

// Metaballs params
export interface MetaballsParams extends BaseShaderParams {
  colorBack?: string;
  ballSize?: number;
  softness?: number;
}

// Voronoi params
export interface VoronoiParams extends BaseShaderParams {
  colorBack?: string;
  cellSize?: number;
  edgeWidth?: number;
  softness?: number;
}

// Perlin Noise params
export interface PerlinNoiseParams extends BaseShaderParams {
  colorBack?: string;
  zoom?: number;
  octaves?: number;
}

// Swirl params
export interface SwirlParams extends BaseShaderParams {
  arms?: number;
  softness?: number;
  twist?: number;
}

// God Rays params
export interface GodRaysParams extends BaseShaderParams {
  rayCount?: number;
  brightness?: number;
  centerGlow?: number;
}

// Dot Orbit params
export interface DotOrbitParams extends BaseShaderParams {
  colorBack?: string;
  dotSize?: number;
  spacing?: number;
}

// Smoke Ring params
export interface SmokeRingParams extends BaseShaderParams {
  colorBack?: string;
  softness?: number;
  noiseStrength?: number;
}

// Union type for all shader params (without type discriminant for use in config)
export type AnyShaderParams =
  | MeshGradientParams
  | StaticMeshGradientParams
  | GrainGradientParams
  | SimplexNoiseParams
  | WavesParams
  | NeuroNoiseParams
  | MetaballsParams
  | VoronoiParams
  | PerlinNoiseParams
  | SwirlParams
  | GodRaysParams
  | DotOrbitParams
  | SmokeRingParams;

// Complete shader configuration - uses flexible params type
export interface ShaderConfig {
  type: ShaderType;
  params: AnyShaderParams;
  // Optional preset name for quick selection
  presetId?: string;
}

// Preset definition
export interface ShaderPreset {
  id: string;
  name: string;
  category: ShaderCategory;
  config: ShaderConfig;
  preview?: string; // Optional static preview image URL
}

// Categories for organizing shaders in the picker
export type ShaderCategory =
  | "gradients"
  | "abstract"
  | "patterns"
  | "organic";

// Shader metadata for UI
export interface ShaderMeta {
  type: ShaderType;
  name: string;
  description: string;
  category: ShaderCategory;
  supportsColors: boolean;
  maxColors: number;
  animated: boolean;
}

// Export shader metadata registry
export const SHADER_META: Record<ShaderType, ShaderMeta> = {
  "mesh-gradient": {
    type: "mesh-gradient",
    name: "Mesh Gradient",
    description: "Flowing color spots with organic distortion",
    category: "gradients",
    supportsColors: true,
    maxColors: 10,
    animated: true,
  },
  "static-mesh-gradient": {
    type: "static-mesh-gradient",
    name: "Static Mesh",
    description: "Multi-point mesh gradient with warping",
    category: "gradients",
    supportsColors: true,
    maxColors: 10,
    animated: false,
  },
  "grain-gradient": {
    type: "grain-gradient",
    name: "Grain Gradient",
    description: "Grainy noise-textured gradient",
    category: "gradients",
    supportsColors: true,
    maxColors: 7,
    animated: true,
  },
  "simplex-noise": {
    type: "simplex-noise",
    name: "Simplex Noise",
    description: "Smooth animated color curves",
    category: "abstract",
    supportsColors: true,
    maxColors: 10,
    animated: true,
  },
  waves: {
    type: "waves",
    name: "Waves",
    description: "Static line patterns",
    category: "patterns",
    supportsColors: true,
    maxColors: 5,
    animated: false,
  },
  "neuro-noise": {
    type: "neuro-noise",
    name: "Neuro Noise",
    description: "Web-like fluid lines",
    category: "organic",
    supportsColors: true,
    maxColors: 5,
    animated: true,
  },
  metaballs: {
    type: "metaballs",
    name: "Metaballs",
    description: "Gooey merging blobs",
    category: "organic",
    supportsColors: true,
    maxColors: 20,
    animated: true,
  },
  voronoi: {
    type: "voronoi",
    name: "Voronoi",
    description: "Anti-aliased cell pattern",
    category: "patterns",
    supportsColors: true,
    maxColors: 5,
    animated: true,
  },
  "perlin-noise": {
    type: "perlin-noise",
    name: "Perlin Noise",
    description: "3D Perlin noise texture",
    category: "abstract",
    supportsColors: true,
    maxColors: 3,
    animated: true,
  },
  swirl: {
    type: "swirl",
    name: "Swirl",
    description: "Twisting color bands",
    category: "abstract",
    supportsColors: true,
    maxColors: 10,
    animated: true,
  },
  "god-rays": {
    type: "god-rays",
    name: "God Rays",
    description: "Radiating light rays",
    category: "abstract",
    supportsColors: true,
    maxColors: 5,
    animated: true,
  },
  "dot-orbit": {
    type: "dot-orbit",
    name: "Dot Orbit",
    description: "Orbiting dot pattern",
    category: "patterns",
    supportsColors: true,
    maxColors: 40,
    animated: true,
  },
  "smoke-ring": {
    type: "smoke-ring",
    name: "Smoke Ring",
    description: "Radial smoky gradient",
    category: "organic",
    supportsColors: true,
    maxColors: 5,
    animated: true,
  },
};
