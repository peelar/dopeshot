import { NextRequest, NextResponse } from "next/server";
import { getTweet } from "react-tweet/api";

export async function GET(request: NextRequest) {
  const tweetId = request.nextUrl.searchParams.get("id");

  if (!tweetId || typeof tweetId !== "string") {
    return NextResponse.json({ error: "Missing tweet ID" }, { status: 400 });
  }

  if (!/^\d+$/.test(tweetId)) {
    return NextResponse.json(
      { error: "Invalid tweet ID format" },
      { status: 400 },
    );
  }

  try {
    const tweet = await getTweet(tweetId);

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    const data = {
      text: tweet.text,
      authorName: tweet.user.name,
      authorHandle: tweet.user.screen_name,
      authorAvatarUrl: tweet.user.profile_image_url_https,
      createdAt: tweet.created_at,
      metrics: {
        likes: tweet.favorite_count,
        replies: tweet.conversation_count,
      },
    };

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch tweet:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch tweet",
      },
      { status: 500 },
    );
  }
}
