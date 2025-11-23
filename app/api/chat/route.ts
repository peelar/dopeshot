import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = {
  moodBoard: tool({
    description: "Suggest a quick palette and type pairing for a mood.",
    parameters: z.object({
      mood: z.string().describe("The vibe to design for"),
    }),
    execute: async ({ mood }) => ({
      palette: mood.toLowerCase().includes("dark")
        ? ["#0f172a", "#1e293b", "#e2e8f0"]
        : ["#0ea5e9", "#e0f2fe", "#0b1d51"],
      typography: mood.toLowerCase().includes("modern") ? "Sleek sans" : "Warm serif",
    }),
  }),
};

export async function POST(request: Request) {
  const { messages = [] } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      messages: [
        ...messages,
        {
          role: "assistant",
          content: "Set OPENAI_API_KEY to enable live AI chat. Tool calling is wired via the Vercel AI SDK.",
        },
      ],
    });
  }

  try {
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        messages: [
          ...messages,
          {
            role: "assistant",
            content: "The AI endpoint failed to respond. Double-check your provider keys.",
          },
        ],
      },
      { status: 500 },
    );
  }
}
