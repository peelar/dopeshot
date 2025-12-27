"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { configAtom } from "@/hooks/atoms";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import { useDynamicBackgrounds } from "@/hooks/use-dynamic-backgrounds";

export function BackgroundSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);

  const { backgrounds, isLoading } = useDynamicBackgrounds();

  // Get currently selected background ID from config
  const selectedBackgroundId = config.background?.value ?? null;

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            ...currentBackground,
            ...background,
          },
        };
      });
    },
    [setConfig],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <GradientPicker
        onChangeAction={handleGradientChange}
        dynamicBackgrounds={backgrounds}
        selectedBackgroundId={selectedBackgroundId}
        isLoading={isLoading}
      />
    </div>
  );
}
