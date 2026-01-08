"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { MessageSquare, X, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Switch } from "@/components/ui/switch";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotDataUrl?: string | null;
}

export function FeedbackModal({
  open,
  onOpenChange,
  screenshotDataUrl,
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFeedback("");
      setEmail("");
      setIncludeScreenshot(!!screenshotDataUrl);
      setSubmitStatus("idle");
      setErrorMessage(null);
      track("feedback_modal_opened");
    }
  }, [open, screenshotDataUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setErrorMessage("Please provide your feedback");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: feedback,
          email: email.trim() || undefined,
          screenshot: includeScreenshot ? screenshotDataUrl : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      track("feedback_submitted", {
        hasEmail: !!email.trim(),
        hasScreenshot: includeScreenshot && !!screenshotDataUrl,
        messageLength: feedback.length,
      });

      setSubmitStatus("success");

      // Close modal after showing success
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render Dialog when open to ensure proper cleanup and test isolation
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[520px]">
        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Thank you for your feedback!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll review it shortly
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-3">
                <div className="rounded-full bg-muted p-2.5">
                  <MessageSquare className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Share Your Feedback
              </DialogTitle>
              <DialogDescription className="text-center text-sm mt-1.5">
                Help us improve dopeshot for you
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Feedback textarea */}
            <div className="space-y-2">
              <Label htmlFor="feedback-message" className="leading-relaxed">
                What are you trying to do, and what would make dopeshot better
                for you?
              </Label>
              <Textarea
                id="feedback-message"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, ideas, or issues..."
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Screenshot toggle */}
            {screenshotDataUrl && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="include-screenshot" className="text-sm font-medium cursor-pointer">
                    Include screenshot
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Attach a screenshot of your current canvas to help us understand your feedback better
                  </p>
                </div>
                <Switch
                  id="include-screenshot"
                  checked={includeScreenshot}
                  onCheckedChange={setIncludeScreenshot}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Optional email */}
            <div className="space-y-2">
              <Label htmlFor="feedback-email" className="text-sm">
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (optional, for follow-up)
                </span>
              </Label>
              <Input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
            </div>

            {/* Error message */}
            {submitStatus === "error" && errorMessage && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  "Send Feedback"
                )}
              </Button>
            </div>
          </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
