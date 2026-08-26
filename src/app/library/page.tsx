import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSubscriptionAccess } from "@/lib/subscription";

export default async function LibraryPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: entitlement }, { data: subscription }] = await Promise.all([
    supabase.from("digital_entitlements").select("status,granted_at").eq("customer_id", userId).eq("product_id", "field-notes-digital").eq("status", "active").maybeSingle(),
    supabase.from("subscriptions").select("status,current_period_end").eq("customer_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const member = hasSubscriptionAccess(subscription);
  const { data: content } = member ? await createAdminClient().from("content_items").select("id,title,summary,published_at").lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }) : { data: null };
  return <div className="shell py-14"><p className="eyebrow">Your digital shelf</p><h1 className="display mt-2 text-5xl">Library</h1><section className="mt-10"><h2 className="display text-3xl">Books you keep</h2>{entitlement ? <div className="card mt-5 flex flex-wrap items-center justify-between gap-5 p-7"><div><p className="font-bold">Field Notes for Deep Reading</p><p className="muted">Permanent digital access · PDF workbook</p></div><a className="button" href="/api/downloads/field-notes">Download PDF</a></div> : <div className="card mt-5 p-7"><p className="muted">You do not yet have a confirmed digital-book purchase.</p><Link className="button mt-5" href="/catalogue/field-notes-for-deep-reading">View the digital book</Link></div>}</section><section className="mt-12"><h2 className="display text-3xl">The Reading Room</h2>{member ? <><p className="muted mt-2">Your active membership unlocks every published essay and reading guide below.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{content?.map((item) => <Link className="card p-6 no-underline" href={`/library/reading-room/${item.id}`} key={item.id}><p className="eyebrow">Member guide</p><h3 className="display mt-2 text-2xl">{item.title}</h3><p className="muted mt-2">{item.summary}</p></Link>)}</div></> : <div className="card mt-5 p-7"><p className="muted">Reading Room content requires an active membership or an unexpired paid-through period.</p><Link className="button mt-5" href="/catalogue/reading-room-membership">Explore membership</Link></div>}</section></div>;
}
