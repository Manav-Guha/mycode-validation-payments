import { z } from "zod";
import type { CatalogueProduct, Market } from "./catalogue";

const addressSchema = z.object({
  recipient_name: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postal_code: z.string().trim().max(20).optional(),
  country_code: z.enum(["AE", "GB"]),
  phone: z.string().trim().min(7).max(30),
});

export type DeliveryAddress = z.infer<typeof addressSchema>;

export function parseDeliveryAddress(formData: FormData, market: Market): DeliveryAddress {
  const result = addressSchema.parse({
    recipient_name: formData.get("recipient_name"), line1: formData.get("line1"), line2: formData.get("line2") || undefined,
    city: formData.get("city"), region: formData.get("region"), postal_code: formData.get("postal_code") || undefined,
    country_code: formData.get("country_code"), phone: formData.get("phone"),
  });
  if (result.country_code !== market) throw new Error("Delivery country must match the account market.");
  return result;
}

export function assertStripePrice(product: CatalogueProduct, price: { unit_amount: number | null; currency: string; recurring: { interval: string } | null }) {
  if (price.unit_amount !== product.amountMinor || price.currency.toUpperCase() !== product.currency) throw new Error("Configured Stripe price does not match the merchant amount.");
  if ((product.interval ?? null) !== (price.recurring?.interval ?? null)) throw new Error("Configured Stripe billing interval does not match the product.");
}
