import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth/auth-client";
import type { PresetBackground, BrandBackground } from "@/domain/backgrounds/types";

interface UseBackgroundsReturn {
  presets: PresetBackground[];
  brandBackgrounds: BrandBackground[];
  isLoadingPresets: boolean;
  isLoadingBrand: boolean;
  uploadBrandBackground: (file: File, name?: string) => Promise<BrandBackground | null>;
  deleteBrandBackground: (id: string) => Promise<boolean>;
  refetchBrandBackgrounds: () => Promise<void>;
}

export function useBackgrounds(): UseBackgroundsReturn {
  const { data: session } = useSession();
  const [presets, setPresets] = useState<PresetBackground[]>([]);
  const [brandBackgrounds, setBrandBackgrounds] = useState<BrandBackground[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);

  // Fetch preset backgrounds (public, always available)
  useEffect(() => {
    async function fetchPresets() {
      setIsLoadingPresets(true);
      try {
        const response = await fetch("/api/backgrounds/presets");
        const data = await response.json();

        if (response.ok && data.presets) {
          setPresets(data.presets);
        }
      } catch (error) {
        console.error("Failed to fetch preset backgrounds:", error);
      } finally {
        setIsLoadingPresets(false);
      }
    }

    fetchPresets();
  }, []);

  // Fetch brand backgrounds (user-specific, authenticated only)
  const fetchBrandBackgrounds = useCallback(async () => {
    if (!session?.user) {
      setBrandBackgrounds([]);
      return;
    }

    setIsLoadingBrand(true);
    try {
      const response = await fetch("/api/backgrounds/brand", {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && data.backgrounds) {
        setBrandBackgrounds(data.backgrounds);
      }
    } catch (error) {
      console.error("Failed to fetch brand backgrounds:", error);
    } finally {
      setIsLoadingBrand(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchBrandBackgrounds();
  }, [fetchBrandBackgrounds]);

  // Upload brand background
  const uploadBrandBackground = useCallback(
    async (file: File, name?: string): Promise<BrandBackground | null> => {
      if (!session?.user) {
        console.error("User must be authenticated to upload brand backgrounds");
        return null;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (name) {
          formData.append("name", name);
        }

        const response = await fetch("/api/backgrounds/brand", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        if (data.background) {
          setBrandBackgrounds((prev) => [data.background, ...prev]);
          return data.background;
        }

        return null;
      } catch (error) {
        console.error("Failed to upload brand background:", error);
        throw error;
      }
    },
    [session?.user]
  );

  // Delete brand background
  const deleteBrandBackground = useCallback(
    async (id: string): Promise<boolean> => {
      if (!session?.user) {
        console.error("User must be authenticated to delete brand backgrounds");
        return false;
      }

      try {
        const response = await fetch(`/api/backgrounds/brand?id=${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Delete failed");
        }

        setBrandBackgrounds((prev) => prev.filter((bg) => bg.id !== id));
        return true;
      } catch (error) {
        console.error("Failed to delete brand background:", error);
        return false;
      }
    },
    [session?.user]
  );

  return {
    presets,
    brandBackgrounds,
    isLoadingPresets,
    isLoadingBrand,
    uploadBrandBackground,
    deleteBrandBackground,
    refetchBrandBackgrounds: fetchBrandBackgrounds,
  };
}
