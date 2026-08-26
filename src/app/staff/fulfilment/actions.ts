"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateFulfilment(formData: FormData) {
  const { userId } = await requireStaff();
  const parsed = z.object({ orderId: z.string().uuid(), status: z.enum(["preparing", "dispatched", "cancelled"]), carrier: z.string().trim().max(80), tracking: z.string().trim().max(100) }).parse({ orderId: formData.get("orderId"), status: formData.get("status"), carrier: formData.get("carrier") ?? "", tracking: formData.get("tracking") ?? "" });
  const admin = createAdminClient();
  await admin.from("fulfilments").update({ status: parsed.status, carrier: parsed.carrier || null, tracking_reference: parsed.tracking || null, dispatched_at: parsed.status === "dispatched" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("order_id", parsed.orderId);
  await admin.from("audit_events").insert({ entity_type: "fulfilment", entity_id: parsed.orderId, action: `status_${parsed.status}`, actor_id: userId });
  revalidatePath("/staff/fulfilment"); revalidatePath(`/account/orders/${parsed.orderId}`);
}
