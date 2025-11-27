"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
}

export const UploadDropzone = ({ onUpload }: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  }, [onUpload]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  }, [openFilePicker]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload screenshot. Drag and drop or press Enter to browse files"
      className={`flex h-64 w-full max-w-md flex-col items-center justify-center rounded-lg border border-dashed transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        isDragging
          ? "border-primary bg-muted/50"
          : "border-border bg-background hover:bg-muted/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50 shadow-sm">
          <UploadCloud className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1 px-4">
          <h3 className="text-sm font-medium text-foreground">Upload screenshot</h3>
          <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          aria-hidden="true"
          tabIndex={-1}
        />
        <Button
          variant="secondary"
          size="sm"
          className="mt-2 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
        >
          Select File
        </Button>
      </div>
    </div>
  );
};
