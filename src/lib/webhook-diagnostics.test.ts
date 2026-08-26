import { describe, expect, it } from "vitest";
import { CheckoutAmountMismatchError, SupabaseOperationError, requireMatchingOrder, safeWebhookDiagnostic } from "./webhook-diagnostics";

describe("checkout webhook diagnostics", () => {
  it("preserves an order-query failure instead of reporting an amount mismatch", () => {
    const action = () => requireMatchingOrder(
      { data: null, error: { code: "42501", message: "permission denied for table orders" } },
      2400,
      "gbp",
    );

    expect(action).toThrow(SupabaseOperationError);
    try {
      action();
    } catch (error) {
      expect(error).not.toBeInstanceOf(CheckoutAmountMismatchError);
      expect((error as SupabaseOperationError).diagnostic).toEqual({
        stage: "checkout_order_read",
        resource: "orders",
        code: "42501",
        message: "permission denied for table orders",
      });
    }
  });

  it("reports a genuine amount or currency mismatch separately", () => {
    const action = () => requireMatchingOrder(
      { data: { amount_minor: 2400, currency: "GBP" }, error: null },
      2500,
      "gbp",
    );

    expect(action).toThrow(CheckoutAmountMismatchError);
    expect(action).not.toThrow(SupabaseOperationError);
  });

  it("redacts sensitive values from Supabase messages", () => {
    const error = new SupabaseOperationError("checkout_order_read", "orders", {
      code: "42501",
      message: "user person@example.com id 123e4567-e89b-42d3-a456-426614174000 key sb_secret_example",
    });

    expect(safeWebhookDiagnostic(error)).toEqual({
      stage: "checkout_order_read",
      resource: "orders",
      code: "42501",
      message: "user [email] id [id] key [secret]",
    });
  });
});
