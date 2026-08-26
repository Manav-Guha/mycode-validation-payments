import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney, products } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage() {
  return <div className="shell py-14"><p className="eyebrow">The whole shelf</p><h1 className="display mt-2 text-5xl">Choose how you want to read.</h1><p className="muted mt-4 max-w-2xl">All prices are fixed merchant amounts. UAE cards are welcome; your bank may separately apply its own conversion.</p>
    <div className="mt-10 grid gap-6 lg:grid-cols-3">{products.map((product) => <article className="card flex flex-col p-7" key={product.id}><p className="eyebrow">{product.kind === "subscription" ? "Monthly membership" : product.kind}</p><h2 className="display mt-3 text-3xl">{product.title}</h2><p className="mt-2 font-bold">{product.subtitle}</p><p className="muted mt-4 flex-1">{product.description}</p><p className="mt-6 text-xl font-bold">{formatMoney(product.amountMinor, product.currency)}{product.interval && ` / ${product.interval}`}</p><p className="muted text-sm">Charged in {product.currency}</p><Link className="button mt-5" href={`/catalogue/${product.slug}`}>View details</Link></article>)}</div>
  </div>;
}
