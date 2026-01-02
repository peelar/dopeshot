"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare } from "lucide-react";
import { track } from "@/lib/analytics";

interface SidebarFooterProps {
  onFeedbackClick?: () => void;
}

export function SidebarFooter({ onFeedbackClick }: SidebarFooterProps) {
  return (
    <TooltipProvider>
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onFeedbackClick) {
                onFeedbackClick();
                track("feedback_button_clicked");
              }
            }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Open feedback modal"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>Feedback</span>
          </Button>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    href="https://cal.com/adrian-pilarczyk-cs0y69/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("cal_link_clicked")}
                    className="inline-flex h-9 items-center justify-center rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Book a call"
                  />
                }
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                </svg>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Book a 30-min call</p>
              </TooltipContent>
            </Tooltip>
            <a
              href="https://twitter.com/gaba6ool"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("twitter_link_clicked")}
              className="inline-flex h-9 items-center justify-center rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Follow on Twitter"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
