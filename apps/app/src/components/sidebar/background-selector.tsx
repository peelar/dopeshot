"use client";

import { useAtomValue } from "jotai";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { userBackgroundsAtom, curatedBackgroundsAtom } from "@/hooks/atoms";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BackgroundAsset, CuratedBackground } from "@/domain/background/types";

interface BackgroundSelectorProps {
  onSelect: (background: BackgroundAsset | CuratedBackground, source: "user" | "curated") => void;
  onDelete?: (backgroundId: string) => void;
  selectedBackgroundId?: string;
}

export function BackgroundSelector({
  onSelect,
  onDelete,
  selectedBackgroundId,
}: BackgroundSelectorProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const userBackgrounds = useAtomValue(userBackgroundsAtom);
  const curatedBackgrounds = useAtomValue(curatedBackgroundsAtom);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);

  const handleDelete = (backgroundId: string) => {
    if (onDelete) {
      onDelete(backgroundId);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* User Backgrounds Section */}
      {isAuthenticated && userBackgrounds.length > 0 && (
        <div data-testid="user-backgrounds-section">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Your Backgrounds</h3>
          <div className="grid grid-cols-3 gap-2">
            {userBackgrounds.map((bg) => (
              <div
                key={bg.id}
                data-testid={`user-background-${bg.id}`}
                data-background-name={bg.name}
                className="relative group"
                onMouseEnter={() => setHoveredBg(bg.id)}
                onMouseLeave={() => setHoveredBg(null)}
              >
                <button
                  onClick={() => onSelect(bg, "user")}
                  className={`
                    relative w-full aspect-square rounded-md overflow-hidden border-2 transition-colors
                    ${
                      selectedBackgroundId === bg.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                  aria-selected={selectedBackgroundId === bg.id}
                  title={bg.name}
                >
                  <img
                    src={bg.signedUrl ?? ""}
                    alt={bg.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>

                {/* Delete button on hover */}
                {hoveredBg === bg.id && onDelete && (
                  <button
                    data-testid="delete-background-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(bg.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    aria-label={`Delete ${bg.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for user backgrounds */}
      {isAuthenticated && userBackgrounds.length === 0 && (
        <div data-testid="user-backgrounds-empty" className="text-sm text-muted-foreground text-center py-4">
          No backgrounds uploaded yet. Upload your first background to get started.
        </div>
      )}

      {/* Curated Backgrounds Section */}
      <div data-testid="curated-backgrounds-section">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Curated Backgrounds</h3>
        {curatedBackgrounds.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {curatedBackgrounds.map((bg) => (
              <button
                key={bg.id}
                data-testid={`curated-background-${bg.id}`}
                data-background-name={bg.name}
                onClick={() => onSelect(bg, "curated")}
                className={`
                  relative w-full aspect-square rounded-md overflow-hidden border-2 transition-colors
                  ${
                    selectedBackgroundId === bg.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }
                `}
                aria-selected={selectedBackgroundId === bg.id}
                title={bg.name}
              >
                <img
                  src={bg.publicUrl ?? ""}
                  alt={bg.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div data-testid="curated-backgrounds-empty" className="text-sm text-muted-foreground text-center py-4">
            No curated backgrounds available.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Background?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this background. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-button"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
