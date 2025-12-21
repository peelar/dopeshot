import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { userBackgroundsAtom, curatedBackgroundsAtom } from "@/hooks/atoms";
import type { BackgroundListResponse } from "@/domain/background/types";
import { track } from "@/lib/analytics";

export function useBackgrounds() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUserBackgrounds = useSetAtom(userBackgroundsAtom);
  const setCuratedBackgrounds = useSetAtom(curatedBackgroundsAtom);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/background/list");
        if (!response.ok) {
          throw new Error("Failed to load backgrounds");
        }

        const data: BackgroundListResponse = await response.json();

        setUserBackgrounds(data.user);
        setCuratedBackgrounds(data.curated);

        track("curated_backgrounds_loaded", {
          count: data.curated.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load backgrounds";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackgrounds();
  }, [setUserBackgrounds, setCuratedBackgrounds]);

  return { isLoading, error };
}
