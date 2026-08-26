"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function openBillingPortal() {
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", userId).single();
  if (!profile?.stripe_customer_id) redirect("/account/subscription?message=No+Stripe+billing+account+is+available");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const portal = await getStripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${origin}/account/subscription` });
  redirect(portal.url);
}
