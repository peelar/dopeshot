import { useCallback, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { cn } from "@/utils";
import { Asset } from "@/domain/asset/types";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface LogoBadgeProps {
  logo?: Asset | null;
  onUploadLogo?: (file: File) => void;
  mutedBg?: string;
  label?: string;
  replaceLabel?: string;
  className?: string;
}

export function LogoBadge({
  logo,
  onUploadLogo,
  mutedBg,
  label = "Drop your logo",
  replaceLabel = "Replace logo",
  className,
}: LogoBadgeProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Use PNG, JPG, or WebP.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Max size is 10MB.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUploadLogo) return;
      if (!validateFile(file)) return;
      onUploadLogo(file);
    },
    [onUploadLogo, validateFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile, onUploadLogo],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      event.preventDefault();
      setIsDragging(true);
    },
    [onUploadLogo],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [onUploadLogo],
  );

  const handleClick = useCallback(() => {
    if (!onUploadLogo) return;
    inputRef.current?.click();
  }, [onUploadLogo]);

  const bgStyle = isDragging ? "rgba(255,255,255,0.2)" : (mutedBg ?? "rgba(255,255,255,0.12)");

  return (
    <div className="space-y-1 text-left">
      <div
        role={onUploadLogo ? "button" : undefined}
        tabIndex={onUploadLogo ? 0 : -1}
        aria-label={
          onUploadLogo
            ? `${logo ? "Replace" : "Upload"} logo. Drag and drop or press Enter to browse files`
            : "Logo placeholder"
        }
        aria-disabled={!onUploadLogo}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex min-w-[140px] items-center gap-3 rounded-full border border-white/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] shadow-sm backdrop-blur transition",
          onUploadLogo ? "cursor-pointer hover:border-white/80" : "cursor-default",
          isDragging && onUploadLogo && "border-white/80",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: bgStyle, isolation: "isolate" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          {logo ? (
            <img
              src={logo.url}
              alt="Logo"
              className="h-7 w-7 rounded-full object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70" />
          )}
          <span className="text-white mix-blend-difference">{logo ? replaceLabel : label}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
          tabIndex={-1}
          aria-hidden="true"
          disabled={!onUploadLogo}
        />
      </div>
      {error ? <p className="text-[11px] text-white/90 mix-blend-difference">{error}</p> : null}
    </div>
  );
}
