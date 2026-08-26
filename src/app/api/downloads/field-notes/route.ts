import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { supabase, userId } = await requireUser();
  const { data: entitlement } = await supabase.from("digital_entitlements").select("id").eq("customer_id", userId).eq("product_id", "field-notes-digital").eq("status", "active").maybeSingle();
  if (!entitlement) return NextResponse.json({ error: "A confirmed purchase is required." }, { status: 403 });
  const { data, error } = await createAdminClient().storage.from("books").createSignedUrl("field-notes-for-deep-reading.pdf", 60, { download: "field-notes-for-deep-reading.pdf" });
  if (error || !data) return NextResponse.json({ error: "The download is temporarily unavailable. Your entitlement remains in your account." }, { status: 503 });
  return NextResponse.redirect(data.signedUrl);
}
