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

test.describe("airtime grants", () => {
  test("shows a grant with its deadline and how full it is", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({ status: 200, json: page_([grant()]) }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Sendetid", level: 1 })).toBeVisible();
    await expect(page.getByText("Automatisk", { exact: true })).toBeVisible();
    await expect(
      page.getByText(/Listen kan endres til mandag 7\. januar kl\. 00:00/),
    ).toBeVisible();
    await expect(page.getByText("35:00 av 1:00:00 brukt, 25:00 grafikk")).toBeVisible();
    await expect(page.getByText("Kaia i dag")).toBeVisible();
  });

  test("reorders, adds and saves the whole list", async ({ page }) => {
    const puts: unknown[] = [];
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({ status: 200, json: page_([grant()]) }),
    );
    await page.route("**/api/grants/700/items", (route) => {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: grant({ fillRule: null }) });
    });
    await page.route("**/api/videos?**", (route) =>
      route.fulfill({ status: 200, json: page_([libraryVideo]) }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Endre listen" }).click();
    await page.getByRole("button", { name: "Flytt «Båtliv» opp" }).click();
    await page.getByRole("button", { name: "Legg til" }).click();

    // 20 + 15 + 30 minutes overruns the hour, so saving is refused until fixed.
    await expect(page.getByText("1:05:00 av 1:00:00: 5:00 for mye")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeDisabled();

    await page.getByRole("button", { name: "Fjern «Kaia i dag»" }).click();
    await page.getByRole("button", { name: "Lagre listen" }).click();

    await expect.poll(() => puts).toEqual([{ items: [{ video: 2 }, { video: 3 }] }]);
  });

  test("shows the server's reason when a save is refused", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({ status: 200, json: page_([grant()]) }),
    );
    await page.route("**/api/grants/700/items", (route) =>
      route.fulfill({
        status: 400,
        json: {
          type: "validation_error",
          errors: [{ code: "invalid", detail: "Sendetiden er låst.", attr: "items" }],
        },
      }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Endre listen" }).click();
    await page.getByRole("button", { name: "Lagre listen" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Sendetiden" })).toHaveText(
      "Sendetiden er låst.",
    );
  });

  test("offers no editing on a grant the user can't change", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([grant({ state: "compiled", canEdit: false })]),
      }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);

    await expect(page.getByText("Klar for sending")).toBeVisible();
    await expect(page.getByText(/Listen ble låst/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Endre listen" })).toHaveCount(0);
  });

  test("switches an edited slot grant back to automatic", async ({ page }) => {
    let posted = 0;
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({ status: 200, json: page_([grant({ fillRule: null })]) }),
    );
    await page.route("**/api/grants/700/automatic", (route) => {
      posted += 1;
      return route.fulfill({ status: 200, json: grant() });
    });

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Fyll automatisk igjen" }).click();

    await expect.poll(() => posted).toBe(1);
  });
});
