import { expect, test } from "@playwright/test";

test("landing page explains the WebMCP demo without requiring a database", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page).toHaveTitle(/PricePilot/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /\/icon\.svg/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", /\/apple-icon/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /\/manifest\.webmanifest/);
  await expect(page.getByRole("heading", { name: /Find a fair price/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create a demo room" })).toBeVisible();
  await expect(page.getByText("No real payment")).toBeVisible();
  await expect(page.getByLabel("Room code")).toBeVisible();
  await page.screenshot({ path: "output/playwright/landing-page.png", animations: "disabled", fullPage: true });

  expect(consoleErrors).toEqual([]);
});
