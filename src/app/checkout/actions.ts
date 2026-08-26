"use server";

import { redirect } from "next/navigation";
import { getProduct, type Market } from "@/lib/catalogue";
import { parseDeliveryAddress, assertStripePrice } from "@/lib/checkout";
import { requireUser } from "@/lib/auth";
import { getStripe, stripePriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function beginCheckout(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const product = getProduct(slug);
  if (!product) redirect("/catalogue?message=That+product+is+not+available");
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("market").eq("id", userId).single();
  if (!profile) redirect(`/checkout/${slug}?message=Your+account+profile+could+not+be+loaded`);

  let address: ReturnType<typeof parseDeliveryAddress> | null = null;
  try { if (product.kind === "physical") address = parseDeliveryAddress(formData, profile.market as Market); }
  catch { redirect(`/checkout/${slug}?message=Check+the+required+delivery+details`); }

  const { data: pending, error } = await supabase.rpc("create_pending_order", { p_product_id: product.id, p_address: address });
  if (error || !pending) redirect(`/checkout/${slug}?message=We+could+not+prepare+this+order.+Please+try+again`);

  const order = pending as { id: string; merchant_reference: string };
  try {
    const stripe = getStripe();
    const priceId = stripePriceId(product.id);
    const price = await stripe.prices.retrieve(priceId);
    assertStripePrice(product, price);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: product.kind === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: undefined,
      client_reference_id: order.merchant_reference,
      metadata: { order_id: order.id, customer_id: userId, product_id: product.id, product_kind: product.kind },
      subscription_data: product.kind === "subscription" ? { metadata: { order_id: order.id, customer_id: userId, product_id: product.id } } : undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${slug}?message=Payment+was+not+completed.+Your+card+has+not+been+confirmed+as+charged`,
    });
    await createAdminClient().from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    redirect(session.url);
  } catch (checkoutError) {
    if (checkoutError && typeof checkoutError === "object" && "digest" in checkoutError) throw checkoutError;
    await createAdminClient().from("orders").update({ status: "payment_failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    redirect(`/checkout/${slug}?message=Payment+could+not+be+started.+No+charge+was+made`);
  }
}
