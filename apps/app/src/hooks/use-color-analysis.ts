import { useCallback } from "react";

/**
 * Stub for color analysis - no longer extracts colors from images.
 *
 * TODO: This will be re-implemented when we build the palette-based gradient system.
 * See thoughts/plans/09-palette-based-gradient-system.md
 */
export function useColorAnalysis() {
  // No-op: color analysis is disabled until palette system is built
  const processColorAnalysis = useCallback(
    async (_dataUrl: string, _assetId: string, _autoLayoutMessage: string | null) => {
      // Intentionally empty - static gradients are used instead
    },
    [],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors: false,
  };
}
