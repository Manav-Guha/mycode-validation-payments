import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_test_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PHYSICAL_PRICE_ID: z.string().startsWith("price_"),
  STRIPE_DIGITAL_PRICE_ID: z.string().startsWith("price_"),
  STRIPE_SUBSCRIPTION_PRICE_ID: z.string().startsWith("price_"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return publicSchema.parse(source);
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverSchema.parse(source);
}
