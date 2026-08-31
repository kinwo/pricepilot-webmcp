import { expect, test } from "@playwright/test";

test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for the persisted demo flow.");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const registered: Array<{ name: string; execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown> }> = [];
    Object.defineProperty(window, "__pricePilotTools", { value: registered, configurable: true });
    Object.defineProperty(Document.prototype, "modelContext", {
      configurable: true,
      get() {
        return {
          registerTool: async (tool: (typeof registered)[number], options?: { signal?: AbortSignal }) => {
            registered.push(tool);
            options?.signal?.addEventListener("abort", () => {
              const index = registered.indexOf(tool);
              if (index >= 0) registered.splice(index, 1);
            });
          },
          getTools: async () => registered
        };
      }
    });
  });
});

test("shopper and merchant complete the seeded bargain journey", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create a demo room" }).click();
  await expect(page).toHaveURL(/\/room\/[A-HJ-NP-Z2-9]{6}\/shopper/);
  await expect(page.getByRole("heading", { name: /Your buying intent/ })).toBeVisible();

  const shopperTools = await page.evaluate(() => (window as unknown as Window & { __pricePilotTools: Array<{ name: string }> }).__pricePilotTools.map((tool) => tool.name));
  expect(shopperTools).toContain("request_offer");
  expect(shopperTools).not.toContain("publish_bargain");

  await page.getByRole("button", { name: /Join group/ }).click();
  await page.getByRole("button", { name: "Join the group" }).click();
  await expect(page.getByText(/5 buyers unlocked 8% off/)).toBeVisible();

  await page.getByRole("button", { name: /Watch price/ }).click();
  await page.getByRole("button", { name: "Save subscription" }).click();

  await page.getByRole("link", { name: /Merchant/ }).first().click();
  await expect(page.getByRole("heading", { name: /Turn demand signals/ })).toBeVisible();
  const merchantTools = await page.evaluate(() => (window as unknown as Window & { __pricePilotTools: Array<{ name: string }> }).__pricePilotTools.map((tool) => tool.name));
  expect(merchantTools).toContain("publish_bargain");
  expect(merchantTools).not.toContain("request_offer");

  const priceInput = page.getByLabel("Price (USD)");
  await priceInput.fill("790");
  await page.getByRole("button", { name: /Review and publish/ }).click();
  await page.getByRole("button", { name: "Publish bargain" }).click();
  await expect(page.getByText(/subscriber\(s\) notified/)).toBeVisible();

  await page.getByRole("link", { name: /Shopper/ }).first().click();
  await expect(page.getByText(/hit your target/)).toBeVisible();
  await page.getByRole("button", { name: "Negotiate" }).click();
  await expect(page.getByText(/offer accepted|counteroffer ready/i)).toBeVisible();
  await page.getByRole("button", { name: /Mock checkout/ }).first().click();
  await page.getByRole("button", { name: "Place mock order" }).click();
  await expect(page.getByText(/Mock order .* placed/)).toBeVisible();
});
