import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id;
  const { supabase, userId } = await requireUser();
  const { data: order } = sessionId ? await supabase.from("orders").select("id, merchant_reference, status").eq("customer_id", userId).eq("stripe_checkout_session_id", sessionId).maybeSingle() : { data: null };
  const confirmed = order?.status === "paid";
  return <div className="shell py-20"><div className="card mx-auto max-w-xl p-8 text-center"><p className="eyebrow">{confirmed ? "Payment confirmed" : "Confirmation in progress"}</p><h1 className="display mt-3 text-5xl">{confirmed ? "Your purchase is ready." : "We’re confirming with Stripe."}</h1><p className="muted mt-5">{confirmed ? `Merchant reference: ${order.merchant_reference}` : "Returning from checkout does not by itself prove payment. Your account will update after Stripe securely confirms the result."}</p><div className="mt-7 flex flex-wrap justify-center gap-3">{order && <Link className="button" href={`/account/orders/${order.id}`}>View purchase</Link>}<Link className="button secondary" href="/account/orders">Purchase history</Link></div></div></div>;
}
