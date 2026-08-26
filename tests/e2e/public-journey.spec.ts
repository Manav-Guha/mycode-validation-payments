import { expect, test } from "@playwright/test";

test("catalogue communicates the three commercial product types", async ({ page }) => {
  await page.goto("/catalogue");
  await expect(page.getByRole("heading", { name: "Choose how you want to read." })).toBeVisible();
  await expect(page.getByText("Notes on Attention", { exact: true })).toBeVisible();
  await expect(page.getByText("Field Notes for Deep Reading", { exact: true })).toBeVisible();
  await expect(page.getByText("The Reading Room", { exact: true })).toBeVisible();
  await expect(page.getByText("Charged in GBP").first()).toBeVisible();
  await expect(page.getByText("Charged in USD")).toBeVisible();
});

test("subscription discloses recurrence before authentication or payment", async ({ page }) => {
  await page.goto("/catalogue/reading-room-membership");
  await expect(page.getByText("Automatically renews monthly until cancelled.")).toBeVisible();
  await expect(page.getByText("Merchant transaction currency: USD")).toBeVisible();
  await expect(page.getByText("$7.00 per month")).toBeVisible();
});

test("account creation supports UAE without collecting shipping", async ({ page }) => {
  await page.goto("/auth/sign-up");
  await expect(page.getByLabel("Customer market")).toHaveValue("AE");
  await page.getByLabel("Customer market").selectOption({ label: "United Kingdom" });
  await page.getByLabel("Customer market").selectOption({ label: "United Arab Emirates" });
  await expect(page.getByLabel("Customer market")).toHaveValue("AE");
  await expect(page.getByLabel("Address line 1")).toHaveCount(0);
});
