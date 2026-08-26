import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { marketName, resolveAccountProfile } from "@/lib/account-profile";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireUser();
  const [profileResult, ordersResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name, market").eq("id", userId).maybeSingle(),
    supabase.from("orders").select("id, merchant_reference, status, amount_minor, currency, created_at").eq("customer_id", userId).order("created_at", { ascending: false }),
  ]);
  const profileState = resolveAccountProfile(userId, profileResult);
  const orders = ordersResult.error ? null : ordersResult.data;
  if (profileState.status === "unavailable") {
    console.error("Account profile read unavailable", {
      reason: profileState.reason,
      queryCode: profileState.error?.code,
      queryMessage: profileState.error?.message,
    });
  }
  const { message } = await searchParams;
  return <div className="shell py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Your account</p>{profileState.status === "ready" ? <><h1 className="display mt-2 text-5xl">Welcome, {profileState.profile.display_name}.</h1><p className="muted mt-3">Market: {marketName(profileState.profile.market)}</p></> : <><h1 className="display mt-2 text-5xl">Account details unavailable</h1><p className="muted mt-3">We could not establish your saved name or market. No customer details have been assumed. Please reload; if this continues, contact support.</p></>}</div><form action={signOut}><button className="button secondary">Sign out</button></form></div>{message && <p className="notice mt-8">{message}</p>}{profileState.status === "unavailable" && <p className="notice mt-8" role="alert">Your authenticated session is active, but the saved profile could not be read. Purchases should not be started until this is resolved.</p>}<div className="mt-10 grid gap-5 md:grid-cols-3"><Link href="/account/orders" className="card p-6 no-underline"><p className="eyebrow">Purchases</p><p className="display mt-2 text-3xl">{orders === null ? "Unavailable" : `${orders.length} orders`}</p></Link><Link href="/library" className="card p-6 no-underline"><p className="eyebrow">Digital shelf</p><p className="display mt-2 text-3xl">Open library</p></Link><Link href="/account/subscription" className="card p-6 no-underline"><p className="eyebrow">Reading Room</p><p className="display mt-2 text-3xl">Membership</p></Link></div></div>;
}
