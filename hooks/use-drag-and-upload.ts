"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { isDraggingAtom } from "@/hooks/atoms";

interface UseDragAndUploadOptions {
  onFileUpload: (file?: File) => Promise<void>;
  isProcessingUpload: boolean;
  enabled?: boolean;
}

export function useDragAndUpload({
  onFileUpload,
  isProcessingUpload,
  enabled = true,
}: UseDragAndUploadOptions) {
  const [isDragging, setIsDragging] = useAtom(isDraggingAtom);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, [enabled, setIsDragging]);

  const openFilePicker = useCallback(() => {
    if (!enabled) return;
    if (isProcessingUpload) return;
    uploadInputRef.current?.click();
  }, [enabled, isProcessingUpload]);

  const handleFilePickerChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!enabled) {
        event.target.value = "";
        return;
      }
      const file = event.target.files?.[0];
      if (file) {
        await onFileUpload(file);
      }
      event.target.value = "";
    },
    [enabled, onFileUpload],
  );

  const isFileDrag = useCallback((event: React.DragEvent<HTMLElement>) => {
    return Array.from(event.dataTransfer?.types ?? []).includes("Files");
  }, []);

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [enabled, isFileDrag, setIsDragging],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [enabled, isFileDrag],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [enabled, isFileDrag, setIsDragging],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        await onFileUpload(file);
      }
    },
    [enabled, isFileDrag, onFileUpload, setIsDragging],
  );

  return {
    isDragging,
    uploadInputRef,
    openFilePicker,
    handleFilePickerChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
