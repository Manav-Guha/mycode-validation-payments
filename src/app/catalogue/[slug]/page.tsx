import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney, getProduct, products } from "@/lib/catalogue";

export function generateStaticParams() { return products.map(({ slug }) => ({ slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug); if (!product) notFound();
  return <div className="shell grid gap-12 py-16 md:grid-cols-[.8fr_1.2fr]"><div className="card flex aspect-[4/5] items-center justify-center bg-[var(--forest)] p-10 text-center text-white"><div><p className="text-sm uppercase tracking-[.2em]">Quiet Shelf</p><h1 className="display mt-12 text-5xl">{product.title}</h1><p className="mt-8 text-white/75">{product.subtitle}</p></div></div><div className="self-center"><p className="eyebrow">{product.kind === "subscription" ? "Recurring membership" : product.kind}</p><h1 className="display mt-3 text-5xl">{product.title}</h1><p className="muted mt-5 text-lg">{product.description}</p><ul className="mt-6 grid gap-2">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><div className="mt-8 border-y border-[var(--line)] py-5"><p className="text-2xl font-bold">{formatMoney(product.amountMinor, product.currency)}{product.interval && ` per ${product.interval}`}</p><p className="muted">Merchant transaction currency: {product.currency}</p>{product.interval && <p className="mt-2 text-sm font-bold">Automatically renews monthly until cancelled.</p>}</div><Link className="button mt-7" href={`/checkout/${product.slug}`}>Review purchase</Link></div></div>;
}
