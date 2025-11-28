"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/utils";

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void> | void;
  onTryExample?: () => void;
  isUploading?: boolean;
}

export const UploadDropzone = ({
  onUpload,
  onTryExample,
  isUploading = false,
}: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = isUploading || internalLoading;

  const validateFile = useCallback((file: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported format. Use PNG, JPG, WebP, or SVG.");
      return false;
    }

    if (file.size > maxSize) {
      setError("File is too large. Max size is 10MB.");
      return false;
    }

    setError(null);
    return true;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;
      setInternalLoading(true);
      try {
        await Promise.resolve(onUpload(file));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Upload failed. Please try again with a different file.",
        );
      } finally {
        setInternalLoading(false);
      }
    },
    [onUpload, validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile],
  );

  const openFilePicker = useCallback(() => {
    if (isBusy) return;
    fileInputRef.current?.click();
  }, [isBusy]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFilePicker();
      }
    },
    [openFilePicker],
  );

  return (
    <div className="space-y-3" aria-live="polite">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload screenshot. Drag and drop or press Enter to browse files"
        aria-busy={isBusy}
        className={cn(
          "group relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-b from-background/80 via-background to-background/80 px-6 text-center shadow-[0_20px_80px_-50px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-[0_30px_120px_-80px_rgba(0,0,0,0.5)]",
          isBusy && "pointer-events-none opacity-80",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.08),transparent_25%)]" />
        <div className="relative flex max-w-md flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted/40 shadow-sm">
            {isBusy ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-1 px-2">
            <h3 className="text-lg font-semibold text-foreground">Drop your screenshot here</h3>
            <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              size="lg"
              className="pointer-events-auto shadow-md transition-transform duration-200 hover:scale-[1.02]"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              Select File
            </Button>
            {onTryExample ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="pointer-events-auto border-dashed transition-transform duration-200 hover:-translate-y-0.5"
                disabled={isBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  onTryExample();
                }}
              >
                ✨ Try with example
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Supports PNG, JPG, WebP, SVG • Max 10MB</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
};
