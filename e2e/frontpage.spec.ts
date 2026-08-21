import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";

/**
 * The suite runs with DJANGO_URL pointed at a dead port, so the front page's
 * server-side schedule fetch fails for real here - no stubbing required. That
 * is the case this page used to answer with a 500, taking the live stream down
 * with the listing beside it.
 */
test.describe("the front page without a backend", () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test("serves the page rather than an error", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
  });

  test("still offers the live stream", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Medlemmet er selv ansvarlig")).toBeVisible();
  });

  test("says it has no program information, and links to the schedule", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Vi har ingen programinformasjon/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Se sendeplanen/ })).toHaveAttribute(
      "href",
      "/schedule",
    );
  });

  test("draws no half-empty program rows", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('a[href="/organization/undefined"]')).toHaveCount(0);
    await expect(page.getByText("Nå:")).toHaveCount(0);
  });
});
