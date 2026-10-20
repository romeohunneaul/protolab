import { test, expect, type Page } from "@playwright/test";

// The lab index, one proto, an axis switch, the URL that carries it, three sizes.
const select = (page: Page, label: string) => page.locator("[data-lab-ui] label", { hasText: label }).locator("select");

test("/lab lists the example protos", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { name: "Lab" })).toBeVisible();
  await expect(page.locator('a[href="/lab/p/hello"]')).toBeVisible();
  await expect(page.locator('a[href="/lab/p/flow"]')).toBeVisible();
});

test("an axis switch from the panel writes the URL, and the URL restores the state", async ({ page }) => {
  await page.goto("/lab/p/hello");
  await expect(page.locator("[data-lab-ui]")).toBeVisible();
  await expect(page.getByText("Switch the state from the panel")).toBeVisible();
  await select(page, "State").selectOption("empty");
  await expect(page).toHaveURL(/a\.state=empty/);
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await expect(select(page, "State")).toHaveValue("empty");
});

test("a screen change from the proto pushes its own URL, and Back walks the flow", async ({ page }) => {
  await page.goto("/lab/p/flow");
  await page.getByRole("button", { name: "Invoice #1042" }).click();
  await expect(page).toHaveURL(/screen=detail/);
  await expect(page.getByRole("heading", { name: "Invoice #1042" })).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/screen=detail/);
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
});

for (const width of [390, 768, 1280]) {
  test(`the proto page renders at ${width}px wide with the panel`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/lab/p/hello?a.state=empty");
    await expect(page.getByRole("heading", { name: "Hello" })).toBeVisible();
    await expect(page.locator("[data-lab-ui]")).toBeVisible();
    await expect(page.getByText("Nothing here yet.")).toBeVisible();
  });
}

test("steps: the panel and the proto push one URL per step, a structural axis swaps the block, a scenario switch writes the URL", async ({ page }) => {
  await page.goto("/lab/p/flow");
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Invoice #1042/ })).toBeVisible(); // 12 invoices by default, as a table
  await select(page, "List layout").selectOption("cards");
  await expect(page).toHaveURL(/a\.layout=cards/);
  await expect(page.locator("ul.grid")).toBeVisible();
  await select(page, "Volume").selectOption("0");
  await expect(page).toHaveURL(/s\.volume=0/);
  await expect(page.getByText("No invoice yet.")).toBeVisible();
  await select(page, "Screen").selectOption("checkout");
  await expect(page).toHaveURL(/screen=checkout/);
  await expect(page).not.toHaveURL(/step=/);
  await expect(page.getByRole("heading", { name: "Address" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=2/);
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await expect(select(page, "Step")).toHaveValue("2");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Address" })).toBeVisible();
  await page.goto("/lab/p/flow?screen=checkout&step=7");
  await expect(page.getByRole("heading", { name: "Address" })).toBeVisible(); // out of range falls back to 1
});
