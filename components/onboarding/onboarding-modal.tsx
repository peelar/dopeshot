"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/auth/auth-client";
import { supabaseDb } from "@/lib/supabase-db";
import { Upload, Check, Sparkles } from "lucide-react";
import { cn } from "@/utils";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { data: session } = useSession();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({});
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (open && uploadButtonRef.current) {
      uploadButtonRef.current.focus();
    }
  }, [open]);

  const handleUpload = async (file: File) => {
    if (!session?.user) return;

    setUploadStatus("idle");
    setErrorMessage(null);

    try {
      await handleFileProcess(file, "logo");

      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${session.user.id}/logo-${timestamp}.${extension}`;

      const { error: uploadError } = await supabaseDb.storage
        .from("brand-logos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: profileError } = await supabaseDb
        .from("brand_profiles")
        .upsert(
          { user_id: session.user.id, logo_path: path },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      const { error: metadataError } = await supabaseDb
        .from("user_metadata")
        .upsert(
          {
            user_id: session.user.id,
            onboarding_progress: ["logo_onboarding_completed"],
            subscription_tier: "free",
            subscription_status: "active",
          },
          { onConflict: "user_id" }
        );

      if (metadataError) throw metadataError;

      track("onboarding_logo_uploaded", { file_size_kb: file.size / 1024 });
      track("onboarding_completed", { uploaded_logo: true });

      setUploadStatus("success");

      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Upload failed:", error);
      }
      setUploadStatus("error");
      setErrorMessage(
        "Brand features are not yet configured. You can still use dopeshot!"
      );
    }
  };

  const handleSkip = async () => {
    if (!session?.user) return;

    try {
      const { error } = await supabaseDb
        .from("user_metadata")
        .upsert(
          {
            user_id: session.user.id,
            onboarding_progress: ["logo_onboarding_skipped"],
            subscription_tier: "free",
            subscription_status: "active",
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      track("onboarding_skipped");
      track("onboarding_completed", { uploaded_logo: false });

      onOpenChange(false);
    } catch (error) {
      console.error("Skip failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {/* Progress indicator - designed for future steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-8 rounded-full bg-foreground" />
            <div className="h-1.5 w-8 rounded-full bg-muted" />
            <div className="h-1.5 w-8 rounded-full bg-muted" />
          </div>
        </div>

        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <Sparkles className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to dopeshot!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Let's personalize your experience. Add your logo to automatically match your brand in generated assets.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {uploadStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Logo saved successfully!
              </p>
            </div>
          ) : (
            <>
              {/* Upload area */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleUpload(e.target.files[0])
                  }
                  className="hidden"
                  id="onboarding-logo-upload"
                  aria-label="Upload logo file"
                />
                <label htmlFor="onboarding-logo-upload">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                      "hover:border-foreground/50 hover:bg-muted/50",
                      "border-border bg-muted/20"
                    )}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG or WebP (max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  ref={uploadButtonRef}
                  onClick={() => document.getElementById("onboarding-logo-upload")?.click()}
                  disabled={isProcessingUpload}
                  size="lg"
                  className="w-full"
                >
                  {isProcessingUpload ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Logo"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isProcessingUpload}
                  size="lg"
                  className="w-full"
                >
                  Skip for now
                </Button>
              </div>
            </>
          )}

          {uploadStatus === "error" && errorMessage && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 mt-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {uploadStatus !== "success" && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              You can always add or change your logo later in settings
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
