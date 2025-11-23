"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverPreview } from "@/components/cover-preview";
import {
  getAllCompositions,
  createNewProjectWithComposition,
  getAllAssets,
} from "@/app/(app)/project/[id]/editor/actions";
import { Composition } from "@/domain/composition/types";
import { Asset } from "@/domain/asset/types";
import { hasScreenshot } from "@/domain/asset/utils";
import { cn } from "@/utils";

interface CompositionSidebarProps {
  currentCompositionId: string;
  currentProjectId: string;
  assets: Asset[];
  allAssets?: Asset[];
}

export function CompositionSidebar({
  currentCompositionId,
  currentProjectId,
  assets,
  allAssets,
}: CompositionSidebarProps) {
  const router = useRouter();
  const [compositions, setCompositions] = useState<
    Array<Composition & { projectId: string; projectName: string }>
  >([]);
  const [allAssetsState, setAllAssetsState] = useState<Asset[]>(allAssets || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompositions() {
      try {
        const allCompositions = await getAllCompositions();
        setCompositions(allCompositions);

        // Fetch all assets for all projects
        const fetchedAssets = await getAllAssets();
        setAllAssetsState(fetchedAssets);
      } catch (error) {
        console.error("Failed to load compositions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCompositions();
  }, []);

  const handleNewCover = async () => {
    try {
      const { projectId, compositionId } = await createNewProjectWithComposition();
      router.push(`/project/${projectId}/editor?compositionId=${compositionId}`);
    } catch (error) {
      console.error("Failed to create new cover:", error);
      // Fallback: redirect to dashboard which will create project
      router.push("/dashboard");
    }
  };

  const handleCompositionClick = (composition: Composition & { projectId: string }) => {
    router.push(`/project/${composition.projectId}/editor?compositionId=${composition.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-4">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <Button
          onClick={handleNewCover}
          className="w-full gap-2"
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New cover
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {compositions.map((composition) => {
            const hasScreenshotAsset = hasScreenshot(composition, allAssetsState);
            const isActive = composition.id === currentCompositionId;

            return (
              <button
                key={composition.id}
                onClick={() => handleCompositionClick(composition)}
                className={cn(
                  "mb-2 w-full rounded-lg border p-2 text-left transition-colors",
                  isActive
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {hasScreenshotAsset ? (
                  <div className="h-32 w-full overflow-hidden rounded">
                    <CoverPreview
                      config={composition.layoutConfig}
                      className="h-full w-full"
                      assets={allAssetsState}
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded bg-slate-100 text-slate-400">
                    <span className="text-xs">No screenshot yet</span>
                  </div>
                )}
                <p className="mt-2 truncate text-xs font-medium text-slate-700">
                  {composition.name}
                </p>
              </button>
            );
          })}
          {compositions.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              No compositions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

