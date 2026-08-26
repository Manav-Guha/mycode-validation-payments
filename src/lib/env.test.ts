import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  STRIPE_PHYSICAL_PRICE_ID: "price_physical",
  STRIPE_DIGITAL_PRICE_ID: "price_digital",
  STRIPE_SUBSCRIPTION_PRICE_ID: "price_subscription",
};

describe("environment validation", () => {
  it("accepts documented public settings", () => {
    expect(parsePublicEnv(valid).NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("requires Stripe test credentials on the server", () => {
    expect(() => parseServerEnv({ ...valid, STRIPE_SECRET_KEY: "sk_live_forbidden" })).toThrow();
  });
});
