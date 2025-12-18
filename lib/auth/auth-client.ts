"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
if (!baseURL) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL");
}

export const authClient = createAuthClient({
  baseURL,
  plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession, $Infer } = authClient;
