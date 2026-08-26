# Quiet Shelf Books

Quiet Shelf is a customer-facing books merchant for the mycode payments validation suite. It sells a physical paperback, a permanent-download digital workbook, and a recurring Reading Room membership. Real Stripe sandbox objects authorize payments; Supabase persists accounts, merchant records, entitlements, and private files.

The interface explicitly identifies itself as a sandbox. Never enter real card details.

## Customer journeys

- Create an email/password account with a UAE or UK market, confirm email, sign in, sign out, return later, and reset a password.
- Review exact merchant amounts and transaction currency before Stripe-hosted Checkout.
- Supply a supported delivery address only when buying the physical book.
- View persistent merchant references, amount, currency, payment state, and established fulfilment state.
- Recover the purchased PDF from the private library after a later sign-in.
- Subscribe for USD 7.00/month, read the members library, receive published monthly releases, and manage billing through Stripe's portal.
- See pending, failed, cancelled, past-due, and confirmed states without treating a browser redirect as proof of payment.

## Architecture

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS
- Vercel for the customer web application and Node.js route functions
- Supabase Auth, Postgres, Row Level Security, and private Storage
- Stripe Sandbox/Test Mode Checkout, Billing, Customer Portal, and signed webhooks
- Vitest for domain tests and Playwright for public browser journeys

No card number reaches this application. Stripe hosts payment collection. Webhook state, rather than the return URL, establishes payment and access.

## Prerequisites

- Node.js 20.9 or newer
- npm 11 or newer
- A Supabase project
- A Stripe account with a Sandbox or Test Mode environment
- Stripe CLI for local webhook forwarding
- Vercel account/project for deployment

## 1. Install and configure locally

```bash
npm ci
cp .env.example .env.local
```

Populate `.env.local`. Do not commit it.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Supabase publishable/anon key; RLS still applies |
| `SUPABASE_SECRET_KEY` | Server only | Administrative database and signed-download operations |
| `STRIPE_SECRET_KEY` | Server only | Must be an `sk_test_...` sandbox/test key |
| `STRIPE_WEBHOOK_SECRET` | Server only | Signing secret for this endpoint/environment |
| `STRIPE_PHYSICAL_PRICE_ID` | Server only | Exact GBP 24.00 one-time Stripe Price |
| `STRIPE_DIGITAL_PRICE_ID` | Server only | Exact GBP 9.00 one-time Stripe Price |
| `STRIPE_SUBSCRIPTION_PRICE_ID` | Server only | Exact USD 7.00 monthly recurring Stripe Price |
| `NEXT_PUBLIC_SITE_URL` | Browser-safe | Canonical origin, e.g. `http://localhost:3000` |
| `STAFF_USER_IDS` | Server only | Optional comma-separated Supabase user UUIDs allowed to update fulfilment |

The server retrieves each Stripe Price before creating Checkout and rejects configuration whose amount, currency, or interval differs from the reviewed merchant offer.

## 2. Configure Supabase

Apply the existing migrations in this order using the Supabase CLI or SQL editor:

1. [`supabase/migrations/202608250001_initial_schema.sql`](supabase/migrations/202608250001_initial_schema.sql)
2. [`supabase/migrations/202608250002_explicit_customer_grants.sql`](supabase/migrations/202608250002_explicit_customer_grants.sql)
3. [`supabase/migrations/202608260001_service_role_least_privilege.sql`](supabase/migrations/202608260001_service_role_least_privilege.sql)

Together they create and seed the catalogue and Reading Room, install the profile trigger, enable RLS on every customer/commercial table, and grant the customer and server roles the explicit least-privilege access required by the application.

Run [`supabase/storage.sql`](supabase/storage.sql) to create the private `books` bucket. Generate the original asset:

```bash
npm run generate:book
```

Upload `assets/digital/field-notes-for-deep-reading.pdf` to the private `books` bucket at exactly `field-notes-for-deep-reading.pdf`. Do not add a public Storage read policy. The download route checks the signed-in customer's active entitlement, then issues a 60-second signed URL using the server-only key.

In Supabase Auth URL Configuration, set:

- Site URL to `NEXT_PUBLIC_SITE_URL`
- Local redirect URL to `http://localhost:3000/auth/callback`
- Local recovery redirect to `http://localhost:3000/auth/update-password`
- Equivalent HTTPS production URLs after Vercel deployment

Email confirmation should remain enabled. Configure SMTP or use the Supabase project's supported development email facility.

## 3. Configure Stripe Sandbox/Test Mode

Create these Products/Prices in one testing environment:

| Application product | Stripe price |
| --- | --- |
| Notes on Attention paperback | GBP 24.00, one time |
| Field Notes for Deep Reading | GBP 9.00, one time |
| Reading Room | USD 7.00, recurring monthly |

Copy their `price_...` IDs into `.env.local`. Enable Stripe Customer Portal cancellation and payment-method management.

Start the app and webhook forwarding in separate terminals:

```bash
npm run dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI's `whsec_...` into `STRIPE_WEBHOOK_SECRET`, then restart the app. Register these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Use only Stripe test cards. Useful cases are successful `4242 4242 4242 4242`, UAE Visa `4000 0078 4000 0001`, and decline `4000 0000 0000 0002`. Use any future expiry and test CVC. Never use a real card.

## 4. Run checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Public Playwright tests need no service credentials. Full account/payment tests require configured Supabase and Stripe sandbox projects because there is deliberately no local payment simulator.

## Commercial state and access

- A local order starts `pending_payment` before Checkout.
- Checkout creation failure becomes `payment_failed`; cancellation is not presented as success.
- Only a verified Stripe webhook with matching amount/currency marks an order `paid`.
- Digital entitlement and initial subscription state are granted only during confirmed fulfilment.
- Physical orders begin `awaiting_fulfilment`. Staff can record `preparing`, `dispatched`, or `cancelled`; dispatch gets an actual timestamp.
- Subscription access is available for `active`/`trialing`, and through a future paid-through date while `past_due`. Terminal or expired states cannot read member content.

Webhook operations are repeat-safe: payments are unique per order, digital entitlements per customer/product, subscriptions by Stripe ID, and processed event IDs are recorded.

## Security and privacy

- Secrets are excluded by `.gitignore`; `.env.example` contains placeholders only.
- Supabase secret and Stripe credentials are imported only by server modules.
- Customer reads require authentication and database RLS ownership policies.
- Customers cannot mutate merchant, payment, fulfilment, entitlement, subscription, audit, or Stripe-customer records through the Data API.
- Purchased titles/prices and delivery addresses are snapshotted.
- Staff routes return not-found to non-allowlisted users and record fulfilment audit events.
- Pages do not expose credentials, card information, or full delivery-address snapshots.

## Vercel deployment

1. Import this repository into Vercel and retain the detected Next.js settings.
2. Add every `.env.example` variable to Production using sandbox/project values. Never paste them into source.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin and deploy.
4. Add production Auth callback/recovery URLs to Supabase.
5. Create a Stripe testing webhook at `https://YOUR_DOMAIN/api/stripe/webhook`, select the documented events, and add that endpoint's signing secret to Vercel.
6. Redeploy after environment changes.
7. Run the checklist below against the deployed origin.

Preview deployments need correctly scoped Auth allowlists and webhook endpoints if payment journeys must work there. Production must not reuse the Stripe CLI webhook secret.

## Deployment validation checklist

- Create and confirm distinct UAE customer A and customer B accounts; verify neither sees the other's orders or library.
- Buy both one-time products with a UAE Stripe test card and verify the GBP amount before authorization.
- Confirm a successful redirect remains non-final until its webhook arrives.
- Sign out/in and redownload the private PDF.
- Subscribe, sign out/in, read published member guides, and open Stripe's portal.
- Exercise a decline and cancellation; verify neither grants access.
- Update the physical order at `/staff/fulfilment`; verify the customer sees only the established state.
- Verify order detail includes product, merchant reference, amount/currency, payment state, and appropriate access/fulfilment state.

## Content maintenance

Reading Room releases are `content_items` rows with a current or future `published_at`; only published rows are returned. This proportionate workflow avoids a CMS or background worker.

After editing `scripts/generate-digital-book.mjs`, run `npm run generate:book` and replace the same private Storage object.
