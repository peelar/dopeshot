"use client";

import { useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
      setMessage("Check your email for a magic link to continue.");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Unable to send magic link. Double-check the email and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send magic link"}
      </Button>
      {message ? (
        <p className="text-center text-sm text-slate-600" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
};
