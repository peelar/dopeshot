import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { verifySession } from "@/lib/auth/session";
import { enablePolarBillingFlag } from "@/lib/feature-flags";
import {
  getAppBaseUrlFromRequest,
  polarApiFetch,
  requirePolarProductId,
} from "@/lib/billing/polar";

function safeReturnPath(input: string | null): string {
  if (!input) return "/settings/billing";
  if (!input.startsWith("/")) return "/settings/billing";
  return input;
}

type PolarCheckoutResponse = {
  url: string;
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

  const email = session.session?.user?.email;
  invariant(email, "Authenticated session must include user email for billing");

  const requestUrl = new URL(request.url);
  const baseUrl = getAppBaseUrlFromRequest(request);
  const returnToPath = safeReturnPath(requestUrl.searchParams.get("returnTo"));

  const returnUrl = new URL(returnToPath, baseUrl);
  const successUrl = new URL(returnToPath, baseUrl);
  successUrl.searchParams.set("checkout", "success");

  const productId = requirePolarProductId();

  const checkout = await polarApiFetch<PolarCheckoutResponse>("/v1/checkouts/", {
    method: "POST",
    body: JSON.stringify({
      products: [productId],
      customer_email: email,
      external_customer_id: session.userId,
      success_url: successUrl.toString(),
      return_url: returnUrl.toString(),
      metadata: { user_id: session.userId },
    }),
  });

  return NextResponse.redirect(checkout.url, { status: 303 });
}

