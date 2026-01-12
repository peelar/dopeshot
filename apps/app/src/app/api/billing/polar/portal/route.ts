import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { enablePolarBillingFlag } from "@/lib/feature-flags";
import { getAppBaseUrlFromRequest, polarApiFetch } from "@/lib/billing/polar";

export const runtime = "nodejs";

function safeReturnPath(input: string | null): string {
  if (!input) return "/settings/billing";
  if (!input.startsWith("/")) return "/settings/billing";
  return input;
}

type PolarCustomerSessionResponse = {
  customer_portal_url: string;
};

export async function GET(request: Request) {
  const enabled = await enablePolarBillingFlag();
  if (!enabled) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const baseUrl = getAppBaseUrlFromRequest(request);
  const returnToPath = safeReturnPath(requestUrl.searchParams.get("returnTo"));
  const returnUrl = new URL(returnToPath, baseUrl);

  const customerSession = await polarApiFetch<PolarCustomerSessionResponse>(
    "/v1/customer-sessions/",
    {
      method: "POST",
      body: JSON.stringify({
        external_customer_id: session.userId,
        return_url: returnUrl.toString(),
      }),
    },
  );

  return NextResponse.redirect(customerSession.customer_portal_url, { status: 303 });
}

