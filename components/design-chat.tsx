"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const DesignChat = () => {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Design chat</h3>
        {isLoading ? <span className="text-xs text-slate-500">Thinking...</span> : null}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        {messages.length === 0 ? (
          <p className="text-slate-500">Ask for a color palette or layout suggestion.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <p className="text-[11px] uppercase text-slate-500">{message.role}</p>
              <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                {typeof message.content === "string"
                  ? message.content
                  : message.content
                      .map((part) => (typeof part === "string" ? part : "text" in part ? part.text : ""))
                      .join(" ")}
              </div>
            </div>
          ))
        )}
        {error ? <p className="text-xs text-rose-500">{error.message}</p> : null}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          name="prompt"
          placeholder="Ask the AI to riff on a cover concept"
          value={input}
          onChange={handleInputChange}
          required
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
};
