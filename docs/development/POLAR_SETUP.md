# Polar setup (Brand tier) — deferred behind feature flag

This repo contains a *complete* Polar checkout + webhook integration, but it’s intentionally **disabled** behind a static feature flag until all brand features are ready.

## 1) Create the product in Polar

1. Create / select your Polar organization.
2. Create a new product:
   - Name: `dopeshot brand`
   - Type: **Subscription**
3. Add at least one price (monthly and/or yearly).
4. Copy the **Product ID** (UUID) from the product page.

You’ll use it as `POLAR_PRODUCT_ID`.

## 2) Create an access token

Create an **Organization Access Token** (recommended) or a **Personal Access Token**.

Required scopes for this code:
- `checkouts:write` (create checkout sessions)
- `customer_sessions:write` (create customer portal sessions)

Set it as:
- `POLAR_ACCESS_TOKEN`

## 3) Create the webhook endpoint

In Polar, create a webhook endpoint with:
- **URL**: `https://<your-domain>/api/webhooks/polar`
  - For local development, use `ngrok` (or similar) and point Polar to the tunneled URL.
  - If you see 404s in deliveries, try adding a trailing `/` to the URL in Polar.
- **Format**: `raw`
- **Events**:
  - `subscription.active`
  - `subscription.canceled`
  - `subscription.past_due`
  - `subscription.revoked`
  - (optional) `subscription.uncanceled`
  - (optional) `subscription.updated`

Copy the **Webhook Secret** from the endpoint and set:
- `POLAR_WEBHOOK_SECRET`

This integration validates signatures using the Standard Webhooks headers Polar sends:
`webhook-id`, `webhook-timestamp`, `webhook-signature`.

## 4) Configure app environment variables

Add these to your app environment (e.g. `apps/app/.env.local`):

```bash
# Polar
POLAR_ACCESS_TOKEN=...
POLAR_PRODUCT_ID=...
POLAR_WEBHOOK_SECRET=...

# Optional: use sandbox (default is production)
# POLAR_ENV=sandbox
# POLAR_API_BASE_URL=https://sandbox-api.polar.sh

# Used for checkout success/return URLs (falls back to BETTER_AUTH_URL)
NEXT_PUBLIC_SITE_URL=https://app.dopeshot.io
```

## 5) Apply the database migration

This integration stores subscription state on `user_metadata`.

Run:
- `pnpm --filter dopeshot-app db:deploy`

## 6) Enable the feature flag (when you’re ready)

Everything is hidden behind `enablePolarBillingFlag`, which is intentionally static and defaults to **off**.

To enable billing:
- Edit `apps/app/src/lib/feature-flags.ts` and flip `enablePolarBillingFlag` to `decide: () => true`
- Deploy

## 7) Test the flow

1. Visit `/settings/billing`
2. Click **Upgrade to Brand** (redirects to Polar checkout)
3. Complete checkout and return to `/settings/billing?checkout=success`
4. Confirm Polar delivered `subscription.*` webhooks successfully
5. Refresh `/settings/billing` and confirm plan updates

## Notes

- Checkout creation sets `external_customer_id` to the app `userId`, so webhook events can map customers back to users reliably.
- `subscription.past_due` is treated as still having `brand` tier (but the status is recorded as `past_due` so you can gate/notify as desired).
