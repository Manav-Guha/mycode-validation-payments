import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSubscriptionAccess } from "@/lib/subscription";

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, userId } = await requireUser();
  const { data: subscription } = await supabase.from("subscriptions").select("status,current_period_end").eq("customer_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!hasSubscriptionAccess(subscription)) redirect("/library");
  const { data: item } = await createAdminClient().from("content_items").select("title,summary,body_markdown,published_at").eq("id", (await params).id).lte("published_at", new Date().toISOString()).maybeSingle();
  if (!item) notFound();
  const paragraphs: string[] = String(item.body_markdown).split("\n").filter(Boolean);
  return <article className="shell max-w-3xl py-14"><Link href="/library">← Library</Link><p className="eyebrow mt-9">Reading Room</p><h1 className="display mt-2 text-5xl">{item.title}</h1><p className="muted mt-4 text-lg">{item.summary}</p><div className="mt-10 grid gap-5 text-lg">{paragraphs.map((paragraph, index) => paragraph.startsWith("# ") ? null : paragraph.startsWith("## ") ? <h2 className="display mt-4 text-3xl" key={index}>{paragraph.slice(3)}</h2> : <p key={index}>{paragraph}</p>)}</div></article>;
}
