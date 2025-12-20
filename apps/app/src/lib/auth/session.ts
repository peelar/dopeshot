import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "./auth-server";

// Memoized session verification (per-request cache)
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("better-auth.session_token");

  if (!sessionCookie) {
    return { isAuth: false, userId: null };
  }

  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${sessionCookie.value}`,
      },
    });

    if (!session) {
      return { isAuth: false, userId: null };
    }

    return {
      isAuth: true,
      userId: session.user.id,
      session,
    };
  } catch {
    return { isAuth: false, userId: null };
  }
});
