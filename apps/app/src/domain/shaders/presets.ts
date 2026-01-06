/**
 * Curated shader presets for dopeshot backgrounds
 *
 * These presets are designed to work beautifully as screenshot backgrounds,
 * with colors that complement typical UI content.
 */

import type { ShaderPreset } from "./types";

// Mesh Gradient Presets
const meshGradientPresets: ShaderPreset[] = [
  {
    id: "mesh-aurora",
    name: "Aurora",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#0f172a", "#312e81", "#1e1b4b", "#0ea5e9", "#0d9488"],
        speed: 0.15,
        distortion: 0.6,
        swirl: 0.4,
        grainOverlay: 0.05,
      },
    },
  },
  {
    id: "mesh-sunset",
    name: "Sunset",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#fbbf24", "#f97316", "#ef4444", "#ec4899", "#8b5cf6"],
        speed: 0.12,
        distortion: 0.5,
        swirl: 0.3,
        grainOverlay: 0.02,
      },
    },
  },
  {
    id: "mesh-ocean",
    name: "Ocean",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#0c4a6e", "#0284c7", "#06b6d4", "#22d3ee", "#99f6e4"],
        speed: 0.1,
        distortion: 0.7,
        swirl: 0.5,
        grainOverlay: 0.03,
      },
    },
  },
  {
    id: "mesh-violet",
    name: "Violet Dream",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#1e1b4b", "#4c1d95", "#7c3aed", "#a78bfa", "#c4b5fd"],
        speed: 0.08,
        distortion: 0.4,
        swirl: 0.6,
        grainOverlay: 0.04,
      },
    },
  },
  {
    id: "mesh-forest",
    name: "Forest",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#052e16", "#14532d", "#15803d", "#22c55e", "#86efac"],
        speed: 0.1,
        distortion: 0.5,
        swirl: 0.35,
        grainOverlay: 0.03,
      },
    },
  },
  {
    id: "mesh-monochrome",
    name: "Monochrome",
    category: "gradients",
    config: {
      type: "mesh-gradient",
      params: {
        colors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
        speed: 0.06,
        distortion: 0.3,
        swirl: 0.2,
        grainOverlay: 0.06,
      },
    },
  },
];

// Grain Gradient Presets
const grainGradientPresets: ShaderPreset[] = [
  {
    id: "grain-ember",
    name: "Ember",
    category: "gradients",
    config: {
      type: "grain-gradient",
      params: {
        colors: ["#dc2626", "#ea580c", "#f59e0b", "#fbbf24"],
        colorBack: "#0c0a09",
        shape: "blob",
        softness: 0.7,
        intensity: 0.5,
        noise: 0.15,
        speed: 0.08,
      },
    },
  },
  {
    id: "grain-cosmic",
    name: "Cosmic",
    category: "gradients",
    config: {
      type: "grain-gradient",
      params: {
        colors: ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"],
        colorBack: "#020617",
        shape: "sphere",
        softness: 0.8,
        intensity: 0.6,
        noise: 0.12,
        speed: 0.1,
      },
    },
  },
  {
    id: "grain-mint",
    name: "Mint",
    category: "gradients",
    config: {
      type: "grain-gradient",
      params: {
        colors: ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"],
        colorBack: "#022c22",
        shape: "wave",
        softness: 0.6,
        intensity: 0.4,
        noise: 0.1,
        speed: 0.12,
      },
    },
  },
];

// Simplex Noise Presets
const simplexNoisePresets: ShaderPreset[] = [
  {
    id: "simplex-neon",
    name: "Neon Flow",
    category: "abstract",
    config: {
      type: "simplex-noise",
      params: {
        colors: ["#7c3aed", "#ec4899", "#06b6d4", "#10b981"],
        stepsPerColor: 2,
        softness: 0.7,
        speed: 0.15,
        scale: 1.0,
      },
    },
  },
  {
    id: "simplex-earth",
    name: "Earth Tones",
    category: "abstract",
    config: {
      type: "simplex-noise",
      params: {
        colors: ["#78350f", "#92400e", "#a16207", "#84cc16", "#22c55e"],
        stepsPerColor: 3,
        softness: 0.8,
        speed: 0.1,
        scale: 1.2,
      },
    },
  },
];

// Neuro Noise Presets
const neuroNoisePresets: ShaderPreset[] = [
  {
    id: "neuro-matrix",
    name: "Matrix",
    category: "organic",
    config: {
      type: "neuro-noise",
      params: {
        colors: ["#22c55e", "#4ade80", "#86efac"],
        colorBack: "#020617",
        brightness: 0.8,
        contrast: 0.6,
        speed: 0.2,
      },
    },
  },
  {
    id: "neuro-blood",
    name: "Bloodstream",
    category: "organic",
    config: {
      type: "neuro-noise",
      params: {
        colors: ["#b91c1c", "#dc2626", "#ef4444", "#f87171"],
        colorBack: "#0c0a09",
        brightness: 0.7,
        contrast: 0.5,
        speed: 0.15,
      },
    },
  },
];

// Metaballs Presets
const metaballsPresets: ShaderPreset[] = [
  {
    id: "metaballs-lava",
    name: "Lava Lamp",
    category: "organic",
    config: {
      type: "metaballs",
      params: {
        colors: ["#f97316", "#fb923c", "#fdba74", "#fed7aa"],
        colorBack: "#1c1917",
        ballSize: 0.15,
        softness: 0.6,
        speed: 0.08,
      },
    },
  },
  {
    id: "metaballs-bubble",
    name: "Bubbles",
    category: "organic",
    config: {
      type: "metaballs",
      params: {
        colors: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"],
        colorBack: "#082f49",
        ballSize: 0.12,
        softness: 0.5,
        speed: 0.1,
      },
    },
  },
];

// Voronoi Presets
const voronoiPresets: ShaderPreset[] = [
  {
    id: "voronoi-crystal",
    name: "Crystal",
    category: "patterns",
    config: {
      type: "voronoi",
      params: {
        colors: ["#06b6d4", "#22d3ee", "#a5f3fc"],
        colorBack: "#0c4a6e",
        cellSize: 0.08,
        edgeWidth: 0.02,
        softness: 0.3,
        speed: 0.05,
      },
    },
  },
];

// Swirl Presets
const swirlPresets: ShaderPreset[] = [
  {
    id: "swirl-candy",
    name: "Candy",
    category: "abstract",
    config: {
      type: "swirl",
      params: {
        colors: ["#f472b6", "#fb7185", "#fdba74", "#fde047", "#a3e635"],
        arms: 6,
        softness: 0.6,
        twist: 0.4,
        speed: 0.1,
      },
    },
  },
];

// God Rays Presets
const godRaysPresets: ShaderPreset[] = [
  {
    id: "godrays-divine",
    name: "Divine",
    category: "abstract",
    config: {
      type: "god-rays",
      params: {
        colors: ["#fef3c7", "#fcd34d", "#f59e0b"],
        rayCount: 12,
        brightness: 0.7,
        centerGlow: 0.5,
        speed: 0.08,
      },
    },
  },
];

// Dot Orbit Presets
const dotOrbitPresets: ShaderPreset[] = [
  {
    id: "dotorbit-disco",
    name: "Disco",
    category: "patterns",
    config: {
      type: "dot-orbit",
      params: {
        colors: [
          "#f43f5e",
          "#ec4899",
          "#d946ef",
          "#a855f7",
          "#8b5cf6",
          "#6366f1",
          "#3b82f6",
          "#0ea5e9",
        ],
        colorBack: "#020617",
        dotSize: 0.04,
        spacing: 0.08,
        speed: 0.2,
      },
    },
  },
];

// Smoke Ring Presets
const smokeRingPresets: ShaderPreset[] = [
  {
    id: "smoke-mystic",
    name: "Mystic",
    category: "organic",
    config: {
      type: "smoke-ring",
      params: {
        colors: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"],
        colorBack: "#0f0d1a",
        softness: 0.7,
        noiseStrength: 0.4,
        speed: 0.1,
      },
    },
  },
];

// Combine all presets
export const SHADER_PRESETS: ShaderPreset[] = [
  ...meshGradientPresets,
  ...grainGradientPresets,
  ...simplexNoisePresets,
  ...neuroNoisePresets,
  ...metaballsPresets,
  ...voronoiPresets,
  ...swirlPresets,
  ...godRaysPresets,
  ...dotOrbitPresets,
  ...smokeRingPresets,
];

// Helper to get preset by ID
export function getShaderPresetById(id: string): ShaderPreset | undefined {
  return SHADER_PRESETS.find((preset) => preset.id === id);
}

// Helper to get presets by category
export function getShaderPresetsByCategory(
  category: ShaderPreset["category"]
): ShaderPreset[] {
  return SHADER_PRESETS.filter((preset) => preset.category === category);
}

// Featured presets for quick access (top 6)
export const FEATURED_SHADER_PRESETS = [
  "mesh-aurora",
  "mesh-sunset",
  "grain-cosmic",
  "simplex-neon",
  "neuro-matrix",
  "metaballs-lava",
].map((id) => getShaderPresetById(id)!);
