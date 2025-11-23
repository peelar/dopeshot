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
      className={`flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
        isDragging ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="rounded-full bg-slate-100 p-4">
          <UploadCloud className="h-8 w-8 text-slate-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Upload your screenshot</h3>
          <p className="text-sm text-slate-500">Drag and drop or click to browse</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <Button onClick={() => fileInputRef.current?.click()}>Select File</Button>
      </div>
    </div>
  );
};

