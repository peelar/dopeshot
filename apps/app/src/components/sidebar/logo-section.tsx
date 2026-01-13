"use client";

interface LogoSectionProps {
  onUploadAsset?: (file: File, kind: "logo") => void;
}

export function LogoSection({ onUploadAsset }: LogoSectionProps) {
  void onUploadAsset;
  // Logo section content is now handled in the header button
  return null;
}
