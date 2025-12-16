import { useEffect, useRef, useState } from "react";
import type { LayoutFocusMode } from "@/domain/layout-def/definitions";

export function useFocusHint(
  isScreenshotFocusedMode: boolean,
  focusMode: LayoutFocusMode | undefined,
) {
  const [showFocusHint, setShowFocusHint] = useState(false);
  const focusHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (focusMode !== "auto") {
      setShowFocusHint(false);
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
      return () => undefined;
    }

    if (isScreenshotFocusedMode) {
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
      }
      setShowFocusHint(true);
      focusHintTimeoutRef.current = setTimeout(() => {
        setShowFocusHint(false);
        focusHintTimeoutRef.current = null;
      }, 2000);
    } else {
      setShowFocusHint(false);
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
    }

    return () => {
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
    };
  }, [isScreenshotFocusedMode, focusMode]);

  return showFocusHint;
}


