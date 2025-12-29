"use client";

import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { configAtom, screenshotGradientAtom } from "@/hooks/atoms";
import { backgroundSelectionAtom } from "@/hooks/atoms/backgrounds";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import { clearBackgroundSelection } from "@/domain/backgrounds/background-service";

export function BackgroundSection() {
  const { data: session } = useSession();
  const setConfig = useSetAtom(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);

  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelection(null);
    }
  }, [isAuthenticated, setSelection]);

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;

        const newBackground = {
          ...currentBackground,
          ...background,
          grainEnabled,
          patternId: background.patternId ?? currentBackground.patternId,
          patternMode: background.patternMode ?? currentBackground.patternMode,
        };

        // Store screenshot gradient for persistence across layout changes
        if (background.gradientSource === "screenshot") {
          setScreenshotGradient(newBackground);
        }

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: newBackground,
        };
      });

      if (selection) {
        setSelection(null);
        void clearBackgroundSelection().catch(() => null);
      }
    },
    [selection, setConfig, setScreenshotGradient, setSelection],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <GradientPicker onChangeAction={handleGradientChange} />
    </div>
  );
}
