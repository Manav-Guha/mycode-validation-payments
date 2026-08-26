import { describe, expect, it } from "vitest";
import { hasSubscriptionAccess } from "./subscription";

describe("subscription access", () => {
  const now = new Date("2026-08-25T00:00:00Z");
  it("allows an active subscription", () => expect(hasSubscriptionAccess({ status: "active", current_period_end: null }, now)).toBe(true));
  it("honours an already-paid period while renewal is past due", () => expect(hasSubscriptionAccess({ status: "past_due", current_period_end: "2026-08-26T00:00:00Z" }, now)).toBe(true));
  it("denies terminal and expired states", () => {
    expect(hasSubscriptionAccess({ status: "canceled", current_period_end: "2026-09-01T00:00:00Z" }, now)).toBe(false);
    expect(hasSubscriptionAccess({ status: "past_due", current_period_end: "2026-08-24T00:00:00Z" }, now)).toBe(false);
  });
});
