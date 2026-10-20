import { test, expect, type Page } from "@playwright/test";

// The lab index, one proto, an axis switch, the URL that carries it, three sizes.
const select = (page: Page, label: string) => page.locator("[data-lab-ui] label:visible", { hasText: label }).locator("select");

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

test("viewport: a preset writes the size in the URL and frames the clean page at that size; a gesture inside reports to the lab URL", async ({ page }) => {
  await page.goto("/lab/p/flow");
  await page.getByRole("tab", { name: "Viewport" }).click();
  await page.getByRole("button", { name: /^Phone/ }).click();
  await expect(page).toHaveURL(/v=390x844/);
  const frame = page.locator("iframe[data-lab-frame]");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", /lab=0/);
  await expect(frame).toHaveAttribute("src", /^((?!v=).)*$/);
  const box = await frame.boundingBox();
  expect(box?.width).toBe(390);
  expect(box?.height).toBe(844);
  await expect(page.locator("[data-lab-state]")).toContainText("Phone");
  // Inside the frame: the clean page, no panel; a click moves the lab URL to the detail screen.
  const inner = page.frameLocator("iframe[data-lab-frame]");
  await expect(inner.locator("[data-lab-ui]")).toHaveCount(0);
  await inner.getByRole("button", { name: /Invoice #1042/ }).click();
  await expect(page).toHaveURL(/screen=detail/);
  await expect(page).toHaveURL(/v=390x844/);
  await expect(inner.getByRole("heading", { name: "Invoice #1042" })).toBeVisible();
  // Free size removes the param and renders the proto in the page again.
  await page.getByRole("button", { name: "Free size" }).click();
  await expect(page).not.toHaveURL(/v=/);
  await expect(frame).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Invoice #1042" })).toBeVisible();
});

test("compare: a grid with one clean-page cell per value, the current one marked; Open leaves with that value", async ({ page }) => {
  await page.goto("/lab/p/flow?a.layout=cards");
  await page.getByRole("tab", { name: "Compare" }).click();
  await select(page, "Axis").selectOption("density");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page).toHaveURL(/compare=density/);
  const cells = page.locator("[data-lab-cell]");
  await expect(cells).toHaveCount(2);
  await expect(cells.nth(0)).toContainText("Comfortable");
  await expect(cells.nth(0)).toContainText("current");
  await expect(cells.nth(1)).toContainText("Compact");
  await expect(page.locator("[data-lab-cell='compact'] iframe")).toHaveAttribute("src", /a\.density=compact/);
  await expect(page.locator("[data-lab-cell='compact'] iframe")).toHaveAttribute("src", /a\.layout=cards/);
  await expect(page.locator("[data-lab-cell='compact'] iframe")).toHaveAttribute("src", /lab=0/);
  await expect(page.getByRole("tab", { name: "Compare" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Variants" }).click();
  await expect(select(page, "Density")).toBeDisabled();
  await page.locator("[data-lab-cell='compact']").getByRole("button", { name: "Open" }).click();
  await expect(page).toHaveURL(/a\.density=compact/);
  await expect(page).not.toHaveURL(/compare=/);
  await expect(cells).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/compare=density/);
  await expect(cells).toHaveCount(2);
});

test("clean page: no tool, the state kept, the link's size applied; Copy clean link adds lab=0 once", async ({ page }) => {
  await page.goto("/lab/p/hello?a.state=empty&lab=0");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await expect(page.locator("[data-lab-ui]")).toHaveCount(0);
  await page.goto("/lab/p/hello?lab=1&a.state=empty");
  await expect(page.locator("[data-lab-ui]")).toBeVisible();
  await page.getByRole("button", { name: "Copy clean link" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/lab=0/);
  expect(copied).not.toMatch(/lab=1/);
  expect(copied.match(/lab=/g)?.length).toBe(1);
  expect(copied).toMatch(/a\.state=empty/);
});

test("request: a new axis composes a prompt with the state and the intent, copied to the clipboard", async ({ page }) => {
  await page.goto("/lab/p/flow?a.density=compact&s.volume=500");
  await page.getByRole("tab", { name: "Request" }).click();
  await page.getByRole("button", { name: "Add an axis or a value" }).click();
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeDisabled();
  await page.locator("[data-lab-request] select").first().selectOption("__new__");
  await page.getByLabel(/Axis label/).fill("Theme");
  await page.getByLabel(/^Values/).fill("light, dark");
  await page.getByLabel(/^Intent/).fill("ajoute un thème sombre sur la liste");
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeEnabled();
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByText("Prompt copied")).toBeVisible();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("Protolab request: add an axis or a value");
  expect(prompt).toContain('Proto: Flow (slug "flow")');
  expect(prompt).toMatch(/State: http:\/\/localhost:3100\/lab\/p\/flow\?a\.density=compact&s\.volume=500/);
  expect(prompt).toContain("density: Compact (compact)");
  expect(prompt).toContain("layout: Table (table), structural");
  expect(prompt).toContain("scenario volume: 500 invoices (500)");
  expect(prompt).toContain('New axis: "Theme"');
  expect(prompt).toContain("  - light\n  - dark");
  expect(prompt).toContain("Intent: ajoute un thème sombre sur la liste");
  expect(prompt).toContain("npx protolab-check");
});

test("request: designating an element names it, a click does not trigger it, and the state change clears it", async ({ page }) => {
  await page.goto("/lab/p/flow");
  await page.getByRole("tab", { name: "Request" }).click();
  await page.getByRole("button", { name: "Change this component" }).click();
  await page.getByRole("button", { name: "Designate an element" }).click();
  await expect(page.getByText("Click an element in the prototype · Esc to cancel")).toBeVisible();
  await page.getByRole("button", { name: /Invoice #1042/ }).click();
  await expect(page).not.toHaveURL(/screen=detail/); // the click designated, it did not open the detail
  const named = page.locator("[data-lab-designated]");
  await expect(named).toContainText("<button>");
  await expect(named).toContainText("Invoice #1042");
  await expect(named).toContainText("button");
  await page.getByLabel(/^Intent/).fill("bouton secondaire");
  await page.getByRole("button", { name: "Copy prompt" }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("Protolab request: change this component");
  expect(prompt).toMatch(/Element: <button> "Invoice #1042/);
  expect(prompt).toMatch(/path: .*button/);
  await page.getByRole("tab", { name: "Variants" }).click();
  await select(page, "Density").selectOption("compact");
  await page.getByRole("tab", { name: "Request" }).click();
  await expect(page.getByText("Designation cleared: the state changed")).toBeVisible();
  await expect(named).toHaveCount(0);
});

test("request: designating inside the viewport frame goes through the frame bridge", async ({ page }) => {
  await page.goto("/lab/p/flow?v=390x844");
  await page.getByRole("tab", { name: "Request" }).click();
  await page.getByRole("button", { name: "Change this component" }).click();
  await page.getByRole("button", { name: "Designate an element" }).click();
  const inner = page.frameLocator("iframe[data-lab-frame]");
  await expect(inner.locator("body")).toHaveCSS("cursor", "crosshair");
  await inner.getByRole("heading", { name: "Invoices" }).click();
  await expect(page.locator("[data-lab-designated]")).toContainText("<h1>");
  await expect(page.locator("[data-lab-designated]")).toContainText("Invoices");
  await page.goto("/lab/p/flow?compare=density");
  await page.getByRole("tab", { name: "Request" }).click();
  await expect(page.getByRole("button", { name: /Change this component/ })).toBeDisabled();
  await expect(page.getByText("Open a cell to change a component")).toBeVisible();
});
