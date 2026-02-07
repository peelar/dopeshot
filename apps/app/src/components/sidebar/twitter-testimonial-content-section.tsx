"use client";

import { useCallback, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { configAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { useTweetFetch } from "@/hooks/use-tweet-fetch";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";

export function TwitterTestimonialContentSection() {
  const config = useAtomValue(configAtom);
  const { fetchTweet } = useTweetFetch();

  const twitterSettings = config.layoutSpecificSettings?.twitterTestimonial;
  const tweetUrl = twitterSettings?.tweetUrl ?? "";
  const fetchStatus = twitterSettings?.fetchStatus ?? "idle";
  const fetchError = twitterSettings?.fetchError;
  const cachedTweet = twitterSettings?.cachedTweet;

  const [localUrl, setLocalUrl] = useState(tweetUrl);
  const lastFetchedRef = useRef(tweetUrl);

  const handleFetch = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed || trimmed === lastFetchedRef.current) return;
      lastFetchedRef.current = trimmed;
      track("twitter_testimonial_url_pasted", {});
      fetchTweet(trimmed);
    },
    [fetchTweet],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text");
      if (pastedText) {
        setLocalUrl(pastedText);
        // Defer fetch to let React update the input
        requestAnimationFrame(() => handleFetch(pastedText));
      }
    },
    [handleFetch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleFetch(localUrl);
      }
    },
    [handleFetch, localUrl],
  );

  const handleBlur = useCallback(() => {
    handleFetch(localUrl);
  }, [handleFetch, localUrl]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="tweet-url" className="text-xs font-medium text-muted-foreground">
          Tweet URL
        </Label>
        <div className="relative">
          <input
            id="tweet-url"
            type="url"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="https://x.com/user/status/..."
            className={cn(
              "w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              fetchStatus === "error" && "border-destructive/50",
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {fetchStatus === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {fetchStatus === "success" && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {fetchStatus === "error" && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {fetchStatus === "error" && fetchError && (
          <p className="text-xs text-destructive">{fetchError}</p>
        )}
      </div>

      {/* Mini preview of fetched tweet */}
      {fetchStatus === "success" && cachedTweet && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            {cachedTweet.authorAvatarUrl && (
              <img
                src={cachedTweet.authorAvatarUrl}
                alt=""
                className="h-6 w-6 rounded-full"
                crossOrigin="anonymous"
              />
            )}
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">
                {cachedTweet.authorName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                @{cachedTweet.authorHandle}
              </span>
            </div>
          </div>
          <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
            {cachedTweet.text}
          </p>
        </div>
      )}
    </div>
  );
}
