import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./support/api";

/**
 * The narrow-screen menu used to be HeroUI's `NavbarMenu`: a fixed,
 * full-viewport drawer positioned at `top: var(--navbar-height)`, which
 * assumes the bar it belongs to is itself at the top of the viewport. Here it
 * is not - the logo above it is as wide as the window and scales its own
 * height to match - so the drawer opened that much too high, slid under the
 * bar, and the bar's own end-content row (full width, `h-full`, and a z-layer
 * above the drawer) swallowed every tap landing in the overlap.
 *
 * Which rows died moved with the window width, so the bug arrived as
 * "Sendeplan does not work" from one window and "Om oss does not work" from
 * the next. Nothing in the DOM was wrong, which is why it survived review:
 * the links were present, correct and, to any test that called click() on the
 * element directly, working.
 *
 * Playwright refuses to click an element that another one covers, so walking
 * the menu and clicking every row is exactly the test this needed.
 */
const PHONE = { width: 390, height: 844 };

const SECTIONS = [
  { label: "Direkte", url: /\/$/ },
  { label: "Arkiv", url: /\/video$/ },
  // /schedule is a route handler that redirects to the current day.
  { label: "Sendeplan", url: /\/schedule\/\d{4}\/\d{2}\/\d{2}/ },
  { label: "Om oss", url: /\/about$/ },
  { label: "Bli med", url: /\/about\/join$/ },
];

const menuOf = (page: Page) => page.getByRole("navigation", { name: "Hovedmeny" });

test.describe("the narrow-screen main menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(PHONE);
    await stubApi(page);
  });

  for (const { label, url } of SECTIONS) {
    test(`goes to ${label}`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Åpne menyen" }).click();

      await menuOf(page).getByRole("link", { name: label, exact: true }).click();

      // Only the address is asserted here. The suite's backend deliberately
      // serves no schedule, so the day page behind "Sendeplan" answers with an
      // error - which says nothing about whether the row could be tapped, and
      // that is the whole question.
      await page.waitForURL(url);
    });
  }

  test("closes itself once it has taken you somewhere", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Åpne menyen" }).click();

    await menuOf(page).getByRole("link", { name: "Om oss", exact: true }).click();
    await page.waitForURL(/\/about$/);

    // It is a disclosure in the page rather than an overlay: having taken you
    // somewhere it is gone, and the toggle offers to open it again.
    await expect(page.getByRole("button", { name: "Åpne menyen" })).toBeVisible();
  });

  test("marks one row as current, the most specific that matches", async ({ page }) => {
    // /about/join is inside /about, so both "Bli med" and "Om oss" answer to
    // this path and both used to be marked.
    await page.goto("/about/join");
    await page.getByRole("button", { name: "Åpne menyen" }).click();

    // `:visible` because the wide-screen bar is still in the document at this
    // width, merely display:none, and it marks the same section.
    await expect(menuOf(page).locator('a[aria-current="page"]:visible')).toHaveText("Bli med");
  });
});
