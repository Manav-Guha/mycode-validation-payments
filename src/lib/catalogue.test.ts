import { describe, expect, it } from "vitest";
import { formatMoney, products } from "./catalogue";

describe("catalogue", () => {
  it("contains exactly one approved representative product of each kind", () => {
    expect(products.map((item) => item.kind).sort()).toEqual(["digital", "physical", "subscription"]);
  });

  it("makes a foreign-currency purchase available to a UAE customer", () => {
    expect(products.some((item) => item.currency === "GBP" || item.currency === "USD")).toBe(true);
  });

  it("formats merchant currency explicitly", () => {
    expect(formatMoney(2400, "GBP")).toContain("24.00");
  });
});
