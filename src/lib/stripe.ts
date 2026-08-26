import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("Stripe sandbox credentials are not configured.");
  client ??= new Stripe(key);
  return client;
}

export function stripePriceId(productId: string) {
  const key = productId === "notes-on-attention-print" ? "STRIPE_PHYSICAL_PRICE_ID"
    : productId === "field-notes-digital" ? "STRIPE_DIGITAL_PRICE_ID"
      : "STRIPE_SUBSCRIPTION_PRICE_ID";
  const value = process.env[key];
  if (!value?.startsWith("price_")) throw new Error(`Stripe price configuration is missing for ${productId}.`);
  return value;
}
