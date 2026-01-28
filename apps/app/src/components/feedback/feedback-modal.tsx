"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { Calendar } from "lucide-react";
import { AdrianAvatar } from "@/components/ui/adrian-avatar";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotDataUrl?: string | null;
}

export function FeedbackModal({ open, onOpenChange, screenshotDataUrl }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFeedback("");
      setEmail("");
      setSubmitStatus("idle");
      setErrorMessage(null);
      track("feedback_modal_opened");
    }
  }, [open]);

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
          screenshot: screenshotDataUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      track("feedback_submitted", {
        hasEmail: !!email.trim(),
        hasScreenshot: !!screenshotDataUrl,
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
        error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render Dialog when open to ensure proper cleanup and test isolation
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[440px] gap-0">
        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-semibold">Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">
              I&apos;ll review your feedback shortly
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Share your feedback</DialogTitle>
            </DialogHeader>

            {/* Personal intro section */}
            <div className="mt-4 flex gap-3 border-l-2 border-primary bg-muted/50 py-3 pl-3 pr-4">
              <AdrianAvatar size="md" className="shrink-0" />
              <p className="text-sm text-muted-foreground">
                I&apos;m{" "}
                <a
                  href="https://twitter.com/gaba6ool"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary"
                >
                  Adrian
                </a>
                , building dopeshot for builders like you. Help me decide what to ship next.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Feedback textarea */}
              <div className="space-y-2">
                <Label htmlFor="feedback-message" className="text-sm">
                  What would make dopeshot better for you?
                </Label>
                <Textarea
                  id="feedback-message"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, ideas, or issues..."
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

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
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {/* Action row */}
              <div className="flex flex-col items-end gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="w-24"
                  disabled={isSubmitting || !feedback.trim()}
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  or{" "}
                  <a
                    href="https://cal.com/adrian-pilarczyk-cs0y69/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 border-b border-current hover:text-foreground"
                  >
                    let&apos;s chat
                    <Calendar className="h-3 w-3" />
                  </a>{" "}
                  instead?
                </p>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
