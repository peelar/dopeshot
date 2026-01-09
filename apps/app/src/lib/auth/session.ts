import "server-only";
import { cookies } from "next/headers";
import { auth } from "./auth-server";

// SECURITY: No caching - authentication must be verified per-request
// Caching would share first user's session with all subsequent requests
export async function verifySession() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("better-auth.session_token") || cookieStore.get("__Secure-better-auth.session_token");

  if (!sessionToken) {
    return { isAuth: false, userId: null };
  }

  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: cookieStore
          .getAll()
          .map((c) => `${c.name}=${c.value}`)
          .join("; "),
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
}
