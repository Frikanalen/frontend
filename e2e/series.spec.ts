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

  test("tells the episodes apart by number, date and running time", async ({ page }) => {
    await page.goto("/series/9001");

    const first = page.getByRole("listitem").filter({ hasText: "Første episode" });
    await expect(first).toContainText("Episode 1");
    await expect(first).toContainText("5:00");
    await expect(first).toContainText("21. aug. 2026");

    // Neither is drawn: the header names the organization, and every episode
    // of a series carries the same category, so both would repeat what the
    // page has already said.
    await expect(first).not.toContainText("Kultur");
    await expect(first).not.toContainText("Havneforeningen");
  });

  test("leaves the episode number off a video that has none", async ({ page }) => {
    await page.goto("/series/9001");

    const unnumbered = page.getByRole("listitem").filter({ hasText: "Uten nummer" });
    await expect(unnumbered).not.toContainText("Episode");
    await expect(unnumbered).toContainText("21. aug. 2026");
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
