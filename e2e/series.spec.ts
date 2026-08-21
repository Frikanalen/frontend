import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe("public series page", () => {
  test("renders the series and its episodes in editorial order", async ({ page }) => {
    const response = await page.goto("/series/9001");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Havna vår" })).toBeVisible();
    await expect(page.getByText("Historier fra kaia.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "Første episode",
      "Tredje episode",
      "Uten nummer",
    ]);
  });

  test("uses the same outer bounds as the navigation header", async ({ page }) => {
    await page.goto("/series/9001");

    const header = await page.locator("body header").first().boundingBox();
    const main = await page.locator("main").boundingBox();

    expect(header).not.toBeNull();
    expect(main).not.toBeNull();
    expect(main?.x).toBe(header?.x);
    expect(main?.width).toBe(header?.width);
  });
});
