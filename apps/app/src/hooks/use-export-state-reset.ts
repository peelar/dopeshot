"use client";

import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { currentDesignHashAtom } from "@/hooks/atoms/memory";
import { hasExportedAtom, currentExportBlobAtom } from "@/hooks/atoms";

/**
 * Hook to reset export/save button state when design changes
 */
export function useExportStateReset() {
  const designHash = useAtomValue(currentDesignHashAtom);
  const setHasExported = useSetAtom(hasExportedAtom);
  const setCurrentBlob = useSetAtom(currentExportBlobAtom);
  const previousHash = useRef<string>(designHash);

  useEffect(() => {
    // Only reset if hash actually changed (not on mount)
    if (previousHash.current !== designHash) {
      setHasExported(false);
      setCurrentBlob(null);
    }
    previousHash.current = designHash;
  }, [designHash, setHasExported, setCurrentBlob]);
}
