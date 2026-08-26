import { describe, expect, it } from "vitest";
import { products } from "./catalogue";
import { assertStripePrice, parseDeliveryAddress } from "./checkout";

describe("checkout invariants", () => {
  it("rejects a provider price that differs from the reviewed merchant amount", () => {
    expect(() => assertStripePrice(products[0], { unit_amount: 2500, currency: "gbp", recurring: null })).toThrow(/does not match/);
  });

  it("requires physical delivery to match the account market", () => {
    const form = new FormData();
    Object.entries({ recipient_name: "Reader", line1: "1 High St", city: "London", region: "London", country_code: "GB", phone: "12345678" }).forEach(([key, value]) => form.set(key, value));
    expect(() => parseDeliveryAddress(form, "AE")).toThrow(/account market/);
  });
});
