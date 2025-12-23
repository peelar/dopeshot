"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession, $Infer } = authClient;
