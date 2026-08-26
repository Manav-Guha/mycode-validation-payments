import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMatchingOrder, requireSupabaseData, safeWebhookDiagnostic } from "@/lib/webhook-diagnostics";

export const runtime = "nodejs";

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const customerId = session.metadata?.customer_id;
  const productId = session.metadata?.product_id;
  const kind = session.metadata?.product_kind;
  if (!orderId || !customerId || !productId || !kind) throw new Error("Checkout metadata is incomplete.");
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;
  const admin = createAdminClient();
  const orderResult = await admin.from("orders").select("amount_minor,currency").eq("id", orderId).eq("customer_id", customerId).single();
  const order = requireMatchingOrder(orderResult, session.amount_total, session.currency);
  const orderUpdateResult = await admin.from("orders").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", orderId);
  requireSupabaseData(orderUpdateResult, "checkout_order_mark_paid", "orders");
  const paymentResult = await admin.from("payments").upsert({ order_id: orderId, provider_payment_reference: String(session.payment_intent ?? session.subscription), amount_minor: order.amount_minor, currency: order.currency, status: "paid", established_at: new Date().toISOString() }, { onConflict: "order_id" });
  requireSupabaseData(paymentResult, "checkout_payment_upsert", "payments");
  if (kind === "digital") {
    const entitlementResult = await admin.from("digital_entitlements").upsert({ customer_id: customerId, product_id: productId, source_order_id: orderId, status: "active", revoked_at: null }, { onConflict: "customer_id,product_id" });
    requireSupabaseData(entitlementResult, "checkout_entitlement_upsert", "digital_entitlements");
  }
  if (kind === "subscription" && session.subscription) {
    const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const subscriptionResult = await admin.from("subscriptions").upsert({ customer_id: customerId, source_order_id: orderId, stripe_subscription_id: subscription.id, stripe_customer_id: String(subscription.customer), status: subscription.status, current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null, cancel_at_period_end: subscription.cancel_at_period_end }, { onConflict: "stripe_subscription_id" });
    requireSupabaseData(subscriptionResult, "checkout_subscription_upsert", "subscriptions");
    const profileResult = await admin.from("profiles").update({ stripe_customer_id: String(subscription.customer) }).eq("id", customerId);
    requireSupabaseData(profileResult, "checkout_profile_billing_link_update", "profiles");
  }
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  await createAdminClient().from("subscriptions").update({ status: subscription.status, current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null, cancel_at_period_end: subscription.cancel_at_period_end, updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscription.id);
}

async function updateSubscriptionFromInvoice(invoice: Stripe.Invoice) {
  const reference = invoice.parent?.subscription_details?.subscription;
  if (!reference) return;
  const subscription = typeof reference === "string" ? await getStripe().subscriptions.retrieve(reference) : reference;
  await updateSubscription(subscription);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret); }
  catch { return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 }); }
  const admin = createAdminClient();
  try {
    const existingResult = await admin.from("webhook_events").select("stripe_event_id").eq("stripe_event_id", event.id).maybeSingle();
    const existing = requireSupabaseData(existingResult, "webhook_deduplication_read", "webhook_events");
    if (existing) return NextResponse.json({ received: true, duplicate: true });
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") await fulfillCheckout(event.data.object);
    if (event.type === "checkout.session.async_payment_failed") {
      const orderId = event.data.object.metadata?.order_id;
      if (orderId) await admin.from("orders").update({ status: "payment_failed", updated_at: new Date().toISOString() }).eq("id", orderId).neq("status", "paid");
    }
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") await updateSubscription(event.data.object);
    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") await updateSubscriptionFromInvoice(event.data.object);
    const processedEventResult = await admin.from("webhook_events").insert({ stripe_event_id: event.id, event_type: event.type, result: "processed" });
    requireSupabaseData(processedEventResult, "webhook_processed_event_insert", "webhook_events");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failure", safeWebhookDiagnostic(error));
    return NextResponse.json({ error: "Webhook processing failed and may be retried" }, { status: 500 });
  }
}
