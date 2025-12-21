import { useState, useCallback } from "react";
import { useSetAtom } from "jotai";
import { userBackgroundsAtom, statusMessageAtom } from "@/hooks/atoms";
import { validateBackgroundFile } from "@/app/api/background/utils";
import type { BackgroundAsset } from "@/domain/background/types";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UseBackgroundUploadReturn {
  upload: (file: File) => Promise<void>;
  status: UploadStatus;
  error: string | null;
  progress: number | null;
  uploadedBackground: BackgroundAsset | null;
  reset: () => void;
}

export function useBackgroundUpload(): UseBackgroundUploadReturn {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadedBackground, setUploadedBackground] = useState<BackgroundAsset | null>(null);
  const setUserBackgrounds = useSetAtom(userBackgroundsAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  const upload = useCallback(
    async (file: File) => {
      try {
        setStatus("uploading");
        setError(null);
        setProgress(0);
        setUploadedBackground(null);

        // Validate file before upload
        const validation = validateBackgroundFile(file);
        if (!validation.valid) {
          setError(validation.error!);
          setStatus("error");
          return;
        }

        // Create form data
        const formData = new FormData();
        formData.append("file", file);

        // Upload to API
        const response = await fetch("/api/background/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          const message = data.error || "Upload failed";
          if (response.status === 409) {
            setStatusMessage(`Background upload failed: ${message}`);
          }
          throw new Error(message);
        }

        // Update state with uploaded background
        const newBackground: BackgroundAsset = {
          ...data.background,
          signedUrl: data.signedUrl,
        };

        setUploadedBackground(newBackground);
        setProgress(100);
        setStatus("success");
        setStatusMessage("Background uploaded successfully.");

        // Optimistically update backgrounds atom
        setUserBackgrounds((prev) => [newBackground, ...prev]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setStatus("error");
        setProgress(null);
      }
    },
    [setUserBackgrounds, setStatusMessage]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setProgress(null);
    setUploadedBackground(null);
  }, []);

  return {
    upload,
    status,
    error,
    progress,
    uploadedBackground,
    reset,
  };
}
