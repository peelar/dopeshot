import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { configAtom } from "@/hooks/atoms";
import { parseTweetUrl } from "@/domain/layout/twitter-utils";
import { track } from "@/lib/analytics";

export function useTweetFetch() {
  const setConfig = useSetAtom(configAtom);

  const fetchTweet = useCallback(
    async (input: string) => {
      const tweetId = parseTweetUrl(input);
      if (!tweetId) {
        setConfig((prev) => ({
          ...prev,
          layoutSpecificSettings: {
            ...prev.layoutSpecificSettings,
            twitterTestimonial: {
              ...prev.layoutSpecificSettings?.twitterTestimonial,
              tweetUrl: input,
              fetchStatus: "error" as const,
              fetchError: "Invalid tweet URL. Use a twitter.com or x.com link.",
            },
          },
        }));
        return;
      }

      setConfig((prev) => ({
        ...prev,
        layoutSpecificSettings: {
          ...prev.layoutSpecificSettings,
          twitterTestimonial: {
            ...prev.layoutSpecificSettings?.twitterTestimonial,
            tweetUrl: input,
            tweetId,
            fetchStatus: "loading" as const,
            fetchError: undefined,
          },
        },
      }));

      try {
        const response = await fetch(`/api/tweet?id=${tweetId}`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch tweet (${response.status})`);
        }

        const { data } = await response.json();

        setConfig((prev) => ({
          ...prev,
          text: { ...prev.text, title: data.text },
          layoutSpecificSettings: {
            ...prev.layoutSpecificSettings,
            twitterTestimonial: {
              ...prev.layoutSpecificSettings?.twitterTestimonial,
              tweetUrl: input,
              tweetId,
              cachedTweet: data,
              fetchStatus: "success" as const,
              fetchError: undefined,
            },
          },
        }));

        track("twitter_testimonial_fetched", { tweet_id: tweetId });
      } catch (error) {
        setConfig((prev) => ({
          ...prev,
          layoutSpecificSettings: {
            ...prev.layoutSpecificSettings,
            twitterTestimonial: {
              ...prev.layoutSpecificSettings?.twitterTestimonial,
              fetchStatus: "error" as const,
              fetchError: error instanceof Error ? error.message : "Failed to fetch tweet",
            },
          },
        }));
        track("twitter_testimonial_fetch_failed", { tweet_id: tweetId });
      }
    },
    [setConfig],
  );

  return { fetchTweet };
}
