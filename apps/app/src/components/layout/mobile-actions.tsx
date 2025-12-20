"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent,
} from "react";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ImageUp, Palette } from "lucide-react";

interface MobileActionsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
  isProcessingUpload: boolean;
  showUploadButton: boolean;
  onUploadAsset: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

const CLOSE_DRAG_DISTANCE = 120;
const CLOSE_VELOCITY = 0.65;

export function MobileActions({
  isOpen,
  onOpenChange,
  onUploadClick,
  isProcessingUpload,
  showUploadButton,
  onUploadAsset,
}: MobileActionsProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    startY: 0,
    lastY: 0,
    lastTime: 0,
    offset: 0,
    velocity: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const setDragOffset = useCallback((offset: number) => {
    const clampedOffset = Math.max(0, offset);
    dragStateRef.current.offset = clampedOffset;
    if (sheetRef.current) {
      sheetRef.current.style.setProperty("--drag-offset", `${clampedOffset}px`);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setIsSettling(false);
      setDragOffset(0);
    }
  }, [isOpen, setDragOffset]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isOpen) return;
      setIsSettling(false);
      setIsDragging(true);
      dragStateRef.current.startY = event.clientY;
      dragStateRef.current.lastY = event.clientY;
      dragStateRef.current.lastTime = performance.now();
      dragStateRef.current.velocity = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isOpen],
  );

  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const currentY = event.clientY;
      const delta = currentY - dragStateRef.current.startY;
      const now = performance.now();
      const dy = currentY - dragStateRef.current.lastY;
      const dt = Math.max(1, now - dragStateRef.current.lastTime);

      dragStateRef.current.velocity = dy / dt;
      dragStateRef.current.lastY = currentY;
      dragStateRef.current.lastTime = now;

      const dampedDelta = delta < 0 ? delta * 0.35 : delta;
      setDragOffset(dampedDelta);
    },
    [isDragging, setDragOffset],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    const { offset, velocity } = dragStateRef.current;
    setIsDragging(false);

    const shouldClose = offset > CLOSE_DRAG_DISTANCE || velocity > CLOSE_VELOCITY;

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    if (shouldClose) {
      // Keep the current offset so the panel continues moving down when closing.
      onOpenChange(false);
    } else {
      setIsSettling(true);
      setDragOffset(0);
      settleTimerRef.current = window.setTimeout(() => {
        setIsSettling(false);
      }, 220);
    }
  }, [isDragging, onOpenChange, setDragOffset]);

  const handleTransitionEnd = useCallback((event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName === "transform") {
      setIsSettling(false);
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:hidden">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2">
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-12 items-center gap-3 rounded-md bg-gradient-to-r from-foreground to-foreground/90 px-4 text-left text-sm font-semibold text-background transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0",
                showUploadButton ? "basis-2/3" : "flex-1",
              )}
            >
              <Palette className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Design</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            ref={sheetRef}
            data-dragging={isDragging ? "true" : "false"}
            data-settling={isSettling ? "true" : "false"}
            onTransitionEnd={handleTransitionEnd}
            onPointerDown={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              if (event.clientY - bounds.top <= 120) {
                handleDragStart(event);
              }
            }}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="group h-[82vh] w-full max-w-none rounded-t-3xl border border-border bg-background px-5 pb-10 pt-3 sm:hidden will-change-transform data-[dragging=true]:transition-none data-[settling=true]:duration-200 data-[settling=true]:ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <div className="relative mx-auto flex h-1.5 w-14 items-center justify-center">
              <div
                className="absolute inset-x-[-24px] top-[-20px] bottom-[-12px] touch-none select-none"
                aria-hidden="true"
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                data-dragging={isDragging ? "true" : "false"}
              />
              <div
                className="h-1.5 w-14 rounded-full bg-muted-foreground/40 transition-colors data-[dragging=true]:bg-muted-foreground/60"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 h-[calc(100%-48px)] overflow-y-auto">
              <LayoutConfigPanel onUploadAsset={onUploadAsset} useAccordions={false} />
            </div>
          </SheetContent>
        </Sheet>

        {showUploadButton ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUploadClick}
            disabled={isProcessingUpload}
            className="flex h-12 basis-1/3 items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/80 px-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:opacity-60"
          >
            <ImageUp className={cn("h-4 w-4", isProcessingUpload && "animate-spin")} aria-hidden="true" />
            <span className="text-sm font-semibold">{isProcessingUpload ? "Uploading..." : "Upload"}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
