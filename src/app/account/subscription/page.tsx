import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { hasSubscriptionAccess, subscriptionMessage } from "@/lib/subscription";
import { openBillingPortal } from "./actions";

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireUser();
  const { data: subscription } = await supabase.from("subscriptions").select("status,current_period_end,cancel_at_period_end,stripe_subscription_id").eq("customer_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { message } = await searchParams; const access = hasSubscriptionAccess(subscription);
  return <div className="shell py-14"><p className="eyebrow">Your account</p><h1 className="display mt-2 text-5xl">Reading Room membership</h1>{message && <p className="notice mt-6">{message}</p>}<div className="card mt-8 p-7"><p className="text-xl font-bold">{subscriptionMessage(subscription)}</p>{subscription?.current_period_end && <p className="muted mt-2">Current paid-through date: {new Date(subscription.current_period_end).toLocaleDateString("en-GB")}</p>}<p className="muted mt-2">Content access: {access ? "Available" : "Not available"}</p>{subscription ? <div className="mt-7 flex flex-wrap gap-3"><Link className="button" href="/library">Open library</Link><form action={openBillingPortal}><button className="button secondary">Manage billing with Stripe</button></form></div> : <Link className="button mt-7" href="/catalogue/reading-room-membership">View membership</Link>}</div></div>;
}
