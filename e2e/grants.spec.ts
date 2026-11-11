import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const organization = { id: 3, name: "Havneforeningen" };

const grantVideo = (id: number, name: string, duration: string) => ({
  id,
  name,
  duration,
  organization,
  pendingUpload: false,
});

const grant = (overrides: Record<string, unknown> = {}) => ({
  id: 700,
  organization,
  starttime: "2030-01-14T17:00:00Z",
  endtime: "2030-01-14T18:00:00Z",
  state: "open",
  locksAt: "2030-01-06T23:00:00Z",
  lockExempt: false,
  fillRule: 12,
  originSlot: 5,
  items: [
    { position: 0, video: grantVideo(1, "Kaia i dag", "00:20:00"), liveTransmission: null },
    { position: 1, video: grantVideo(2, "Båtliv", "00:15:00"), liveTransmission: null },
  ],
  itemsDuration: "00:35:00",
  canEdit: true,
  ...overrides,
});

const libraryVideo = {
  id: 3,
  name: "Fjordglimt",
  files: {},
  creator: "editor@example.test",
  organization: { ...organization, description: "", fkmember: true },
  series: null,
  episodeNumber: null,
  duration: "00:30:00",
  durationSec: 1800,
  categories: [],
  framerate: 25,
  properImport: true,
  createdTime: "2026-08-21T10:00:00Z",
  updatedTime: "2026-08-21T10:00:00Z",
  uploadedTime: null,
};

const page_ = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
});

const editor = async (page: import("@playwright/test").Page, grantBody: object) => {
  await page.route("**/api/grants/700", (route) => route.fulfill({ status: 200, json: grantBody }));
  await page.route("**/api/videos?**", (route) =>
    route.fulfill({ status: 200, json: page_([libraryVideo]) }),
  );
  await page.goto("/organization/3/schedule/700");
  await waitForHydration(page);
};

const listRows = (page: import("@playwright/test").Page) =>
  page.getByRole("grid", { name: "Sendeliste" }).getByRole("row");

test.describe("airtime grants", () => {
  test("tells automatic and manual grants apart on the board", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([
          grant(),
          grant({
            id: 701,
            fillRule: null,
            starttime: "2030-01-15T17:00:00Z",
            endtime: "2030-01-15T18:00:00Z",
          }),
        ]),
      }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Sendetid", level: 1 })).toBeVisible();
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).getByText("Automatisk fylt")).toBeVisible();
    await expect(cards.nth(1).getByText("Satt opp manuelt")).toBeVisible();
    await expect(
      cards.nth(0).getByText(/Listen kan endres til mandag 7\. januar kl\. 00:00/),
    ).toBeVisible();
    await expect(cards.nth(0).getByText("35:00 av 1:00:00 brukt, 25:00 grafikk")).toBeVisible();
    await expect(cards.nth(0).getByRole("link", { name: "Sett opp programmet" })).toHaveAttribute(
      "href",
      "/organization/3/schedule/700",
    );
  });

  test("lays the list out in time, with graphics after it", async ({ page }) => {
    await editor(page, grant());

    await expect(listRows(page)).toHaveCount(2);
    await expect(listRows(page).nth(0)).toContainText("18:00–18:20");
    await expect(listRows(page).nth(1)).toContainText("18:20–18:35");
    await expect(page.getByText("18:35–19:00")).toBeVisible();
    await expect(page.getByText("Automatisk fylt")).toBeVisible();
  });

  test("drags a video in and reorders by dragging, then saves the whole list", async ({ page }) => {
    const puts: unknown[] = [];
    await page.route("**/api/grants/700/items", (route) => {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: grant({ fillRule: null }) });
    });
    await editor(page, grant({ endtime: "2030-01-14T18:30:00Z" }));

    // Driven from the keyboard, which react-aria's drag and drop supports the
    // same way as the pointer, and which every browser engine can replay
    // (WebKit can't replay a native pointer drag in Playwright).
    const focused = page.locator(":focus");

    // Fjordglimt between the two: 20 + 30 + 15 minutes fits the 90-minute window.
    await page.getByRole("button", { name: "Dra «Fjordglimt»" }).focus();
    await page.keyboard.press("Enter");
    // Wait for the drag to start before steering it.
    await expect(focused).toHaveAttribute("aria-roledescription", "drop indicator");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(focused).toHaveAttribute("aria-label", "Insert between Kaia i dag and Båtliv");
    await page.keyboard.press("Enter");
    await expect(listRows(page)).toHaveCount(3);
    await expect(listRows(page).nth(1)).toContainText("Fjordglimt");
    // A changed automatic list is a manual one from here on.
    await expect(page.getByText("Satt opp manuelt")).toBeVisible();

    await page.getByRole("button", { name: "Flytt «Båtliv»" }).focus();
    await page.keyboard.press("Enter");
    await expect(focused).toHaveAttribute("aria-label", "Insert between Fjordglimt and Båtliv");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(focused).toHaveAttribute("aria-label", "Insert before Kaia i dag");
    await page.keyboard.press("Enter");
    await expect(listRows(page).nth(0)).toContainText("Båtliv");

    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect.poll(() => puts).toEqual([{ items: [{ video: 2 }, { video: 1 }, { video: 3 }] }]);
    await expect(page.getByRole("status")).toHaveText("Listen er lagret.");
  });

  test("blocks a list that overruns the window", async ({ page }) => {
    await editor(page, grant());
    await page.getByRole("button", { name: "Legg til" }).click();

    await expect(page.getByText("1:05:00 av 1:00:00: 5:00 for mye")).toBeVisible();
    await expect(listRows(page).nth(2)).toContainText("går over sendetiden");
    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeDisabled();

    await page.getByRole("button", { name: "Fjern «Kaia i dag»" }).click();
    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeEnabled();
  });

  test("shows the server's reason when a save is refused", async ({ page }) => {
    await page.route("**/api/grants/700/items", (route) =>
      route.fulfill({
        status: 400,
        json: {
          type: "validation_error",
          errors: [{ code: "invalid", detail: "Sendetiden er låst.", attr: "items" }],
        },
      }),
    );
    await editor(page, grant());
    await page.getByRole("button", { name: "Fjern «Båtliv»" }).click();
    await page.getByRole("button", { name: "Lagre listen" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Sendetiden" })).toHaveText(
      "Sendetiden er låst.",
    );
  });

  test("offers no editing on a grant the user can't change", async ({ page }) => {
    await editor(page, grant({ state: "compiled", canEdit: false }));

    await expect(page.getByText("Klar for sending", { exact: false })).toBeVisible();
    await expect(page.getByText(/Listen ble låst/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Flytt/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lagre listen" })).toHaveCount(0);
    await expect(page.getByRole("grid", { name: "Videoer du kan legge til" })).toHaveCount(0);
  });

  test("switches an edited slot grant back to automatic", async ({ page }) => {
    let posted = 0;
    await page.route("**/api/grants/700/automatic", (route) => {
      posted += 1;
      return route.fulfill({ status: 200, json: grant() });
    });
    await editor(page, grant({ fillRule: null }));
    await expect(page.getByText("Satt opp manuelt")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Fyll automatisk igjen" }).click();

    await expect.poll(() => posted).toBe(1);
    await expect(page.getByText("Automatisk fylt").first()).toBeVisible();
  });
});
