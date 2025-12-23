"use client";

import { useAtomValue } from "jotai";
import { logoAssetAtom, layoutCapabilitiesAtom } from "@/hooks/atoms/derived";

interface LogoSectionProps {
  onUploadAsset?: (file: File, kind: "logo") => void;
}

export function LogoSection({ onUploadAsset }: LogoSectionProps) {
  void onUploadAsset;
  useAtomValue(logoAssetAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);

  // Hide section if look doesn't support logos
  if (lookCapabilities?.logo === "hidden") {
    return null;
  }

  return null;
}
