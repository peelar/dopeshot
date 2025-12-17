const SESSION_PATH = "/api/auth/get-session";

function buildSessionUrl(request: Request) {
  const url = new URL(request.url);
  url.pathname = SESSION_PATH;
  url.search = "";
  return url.toString();
}

export async function getServerSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] getServerSession cookies:", cookieHeader);
  }

  const response = await fetch(buildSessionUrl(request), {
    headers: {
      cookie: cookieHeader,
    },
    method: "GET",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] getServerSession proxy status:", response.status);
  }

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();

  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] getServerSession result:", payload?.session?.user?.id ?? "no session");
  }

  return payload;
}
