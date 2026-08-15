"use client";

import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { configAtom, hasExportedAtom, currentExportBlobAtom } from "@/hooks/atoms";

export function useExportStateReset() {
  const config = useAtomValue(configAtom);
  const setHasExported = useSetAtom(hasExportedAtom);
  const setCurrentBlob = useSetAtom(currentExportBlobAtom);
  const previousSignature = useRef<string | null>(null);
  const signature = JSON.stringify({
    layoutId: config.layoutId,
    background: config.background,
    assets: config.assets,
    text: config.text,
  });

  useEffect(() => {
    if (previousSignature.current && previousSignature.current !== signature) {
      setHasExported(false);
      setCurrentBlob(null);
    }
    previousSignature.current = signature;
  }, [signature, setHasExported, setCurrentBlob]);
}
