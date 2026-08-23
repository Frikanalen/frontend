import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";

/**
 * The local test backend deliberately has no schedule fixture, so the front
 * page's server-side schedule fetch receives an error. That is the case this
 * page used to answer with a 500, taking the live stream down with the listing
 * beside it.
 *
 * The listing is now drawn over the player's still frame rather than in an
 * accordion beneath it, and it unmounts once playback starts - so everything
 * asserted here is the pre-playback state, which is what a visitor arriving
 * on the page sees while autoplay is off.
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

  test("says nothing is scheduled rather than leaving the slot blank", async ({ page }) => {
    await page.goto("/");

    // The "Nå" row holds its place and says the schedule is empty. Dropping the
    // row instead would leave the badge sitting over an otherwise bare frame,
    // which reads as a page that failed to load rather than as an empty listing.
    await expect(page.getByText("Ingen registrert sending")).toBeVisible();
  });

  test("still marks the stream as live", async ({ page }) => {
    await page.goto("/");

    // Scoped to the player: "Direkte" is also the name of the first item in the
    // main nav, and an unscoped match would pass on that alone.
    await expect(
      page.locator("[data-media-player]").getByText("Direkte", { exact: true }),
    ).toBeVisible();
  });

  test("draws no half-empty program rows", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('a[href="/organization/undefined"]')).toHaveCount(0);
    await expect(page.locator('a[href="/video/undefined"]')).toHaveCount(0);
    await expect(page.getByText("Uten programnavn")).toHaveCount(0);
  });
});
