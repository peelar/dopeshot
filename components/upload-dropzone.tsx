"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
}

export const UploadDropzone = ({ onUpload }: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`flex h-64 w-full max-w-md flex-col items-center justify-center rounded-lg border border-dashed transition-colors ${
        isDragging
          ? "border-primary bg-muted/50"
          : "border-border bg-background hover:bg-muted/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50 shadow-sm">
          <UploadCloud className="h-5 w-5 text-muted-foreground" />
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
        />
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
          Select File
        </Button>
      </div>
    </div>
  );
};
