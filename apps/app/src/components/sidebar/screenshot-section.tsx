"use client";

interface ScreenshotSectionProps {
  onUploadAsset?: (file: File, kind: "screenshot") => void;
}

export function ScreenshotSection({ onUploadAsset }: ScreenshotSectionProps) {
  void onUploadAsset;
  return null;
}
