export type Market = "AE" | "GB";
export type ProductKind = "physical" | "digital" | "subscription";

export type CatalogueProduct = {
  id: string;
  slug: string;
  kind: ProductKind;
  title: string;
  subtitle: string;
  description: string;
  amountMinor: number;
  currency: "GBP" | "USD";
  interval?: "month";
  features: string[];
};

export const products: CatalogueProduct[] = [
  {
    id: "notes-on-attention-print",
    slug: "notes-on-attention-paperback",
    kind: "physical",
    title: "Notes on Attention",
    subtitle: "A field guide for reading deeply in a noisy world",
    description: "A beautifully made paperback about creating the conditions for patient, memorable reading. Delivery is included to supported UAE and UK addresses.",
    amountMinor: 2400,
    currency: "GBP",
    features: ["Paperback edition", "Delivery included", "Account-level fulfilment updates"],
  },
  {
    id: "field-notes-digital",
    slug: "field-notes-for-deep-reading",
    kind: "digital",
    title: "Field Notes for Deep Reading",
    subtitle: "A practical digital workbook to keep",
    description: "An original downloadable PDF with reflective prompts, reading rituals, and a reusable reading log. Permanent access through your account after confirmed payment.",
    amountMinor: 900,
    currency: "GBP",
    features: ["Original PDF workbook", "Permanent account access", "Download again whenever needed"],
  },
  {
    id: "reading-room",
    slug: "reading-room-membership",
    kind: "subscription",
    title: "The Reading Room",
    subtitle: "New essays and reading guides every month",
    description: "A continuing members library with thoughtful essays, practical reading guides, and scheduled monthly releases. Renews automatically each month until cancelled.",
    amountMinor: 700,
    currency: "USD",
    interval: "month",
    features: ["Immediate members-library access", "New content every month", "Manage renewal with Stripe"],
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}
