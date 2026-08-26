type SupabaseError = {
  code?: string | null;
  message?: string | null;
};

type SupabaseResult<T> = {
  data: T;
  error: SupabaseError | null;
};

function sanitizeMessage(message: string | null | undefined) {
  return (message ?? "Unknown Supabase error")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(/\b(?:sb_secret_|sb_publishable_|whsec_|sk_(?:test|live)_)[A-Za-z0-9_-]+/g, "[secret]")
    .replace(/\b(?:cus|cs_(?:test|live)|pi|sub|evt)_[A-Za-z0-9_-]+/g, "[stripe-id]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[jwt]")
    .slice(0, 240);
}

export class SupabaseOperationError extends Error {
  readonly diagnostic;

  constructor(stage: string, resource: string, error: SupabaseError) {
    const diagnostic = {
      stage,
      resource,
      code: error.code ?? "unknown",
      message: sanitizeMessage(error.message),
    };
    super(`Supabase operation failed at ${stage}.`);
    this.name = "SupabaseOperationError";
    this.diagnostic = diagnostic;
  }
}

export class CheckoutAmountMismatchError extends Error {
  constructor() {
    super("Stripe amount or currency does not match the merchant order.");
    this.name = "CheckoutAmountMismatchError";
  }
}

export function requireSupabaseData<T>(result: SupabaseResult<T>, stage: string, resource: string): T {
  if (result.error) throw new SupabaseOperationError(stage, resource, result.error);
  return result.data;
}

export function requireMatchingOrder(
  result: SupabaseResult<{ amount_minor: number; currency: string } | null>,
  amountTotal: number | null,
  currency: string | null,
) {
  const order = requireSupabaseData(result, "checkout_order_read", "orders");
  if (!order || amountTotal !== order.amount_minor || currency?.toUpperCase() !== order.currency) {
    throw new CheckoutAmountMismatchError();
  }
  return order;
}

export function safeWebhookDiagnostic(error: unknown) {
  if (error instanceof SupabaseOperationError) return error.diagnostic;
  if (error instanceof CheckoutAmountMismatchError) {
    return { stage: "checkout_amount_validation", resource: "stripe_checkout_session", code: "amount_mismatch", message: error.message };
  }
  return { stage: "webhook_processing", resource: "stripe_event", code: "unexpected_error", message: "Webhook processing failed." };
}
