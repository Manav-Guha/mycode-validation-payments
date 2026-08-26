import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/catalogue";

export default async function OrdersPage() {
  const { supabase, userId } = await requireUser();
  const { data: orders } = await supabase.from("orders").select("id,merchant_reference,status,amount_minor,currency,created_at,order_items(title_snapshot,product_type)").eq("customer_id", userId).order("created_at", { ascending: false });
  return <div className="shell py-14"><p className="eyebrow">Your account</p><h1 className="display mt-2 text-5xl">Purchase history</h1><div className="mt-9 grid gap-4">{orders?.length ? orders.map((order) => { const item = Array.isArray(order.order_items) ? order.order_items[0] : order.order_items; return <Link className="card grid gap-3 p-6 no-underline md:grid-cols-[1fr_auto]" href={`/account/orders/${order.id}`} key={order.id}><div><p className="font-bold">{item?.title_snapshot ?? "Purchase"}</p><p className="muted text-sm">{order.merchant_reference} · {new Date(order.created_at).toLocaleDateString("en-GB")}</p></div><div className="md:text-right"><p className="font-bold">{formatMoney(order.amount_minor, order.currency)}</p><p className="muted capitalize">{order.status.replaceAll("_", " ")}</p></div></Link>; }) : <div className="card p-7"><p>No purchases yet.</p><Link className="button mt-5" href="/catalogue">Browse the shelf</Link></div>}</div></div>;
}
