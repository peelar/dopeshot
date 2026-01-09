import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth-server";

// SECURITY: No caching - authentication must be verified per-request
// Caching would share first user's session with all subsequent requests
export async function verifySession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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
