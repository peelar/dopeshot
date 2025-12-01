import { useEffect, useRef, useState } from "react";
import { TemplateFocusMode } from "@/domain/layout/templates";

export function useFocusHint(
  isScreenshotFocusedMode: boolean,
  focusMode: TemplateFocusMode | undefined,
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
