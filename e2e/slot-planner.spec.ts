import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const page_ = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const slot = (fields: object = {}) => ({
  id: 40,
  organization: 3,
  organizationName: "Havneforeningen",
  frequency: "weekly",
  interval: 1,
  weekdays: [2],
  monthWeeks: [],
  startTime: "18:00:00",
  duration: "01:00:00",
  startsOn: "2026-01-01",
  endsOn: null,
  recipe: { id: 12, kind: "uploads", description: "", series: null, seriesName: null },
  description: "Weekly Wed",
  ...fields,
});

const jukebox = slot({
  id: 41,
  organization: null,
  organizationName: null,
  weekdays: [4],
  startTime: "22:00:00",
  duration: "02:00:00",
  recipe: {
    id: 20,
    kind: "jukebox",
    description: "Jukebox",
    series: null,
    seriesName: null,
    name: "",
    categories: [],
    shortest: null,
    longest: null,
    newerThanDays: null,
    olderThanDays: null,
  },
});

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.route("**/api/recurring-slots?**", (route) =>
    route.fulfill({ status: 200, json: page_([slot(), jukebox]) }),
  );
  await page.route("**/api/series?**", (route) =>
    route.fulfill({ status: 200, json: page_([{ id: 8, name: "Ukens program" }]) }),
  );
  await page.route("**/api/categories**", (route) =>
    route.fulfill({
      status: 200,
      json: page_([
        { id: 1, name: "Kultur" },
        { id: 2, name: "Samfunn" },
      ]),
    }),
  );
});

test.describe("fixed slots", () => {
  test("points a member's slot at one of their series", async ({ page }) => {
    const patches: unknown[] = [];
    await page.route("**/api/recurring-slots/40", (route) => {
      patches.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: slot() });
    });
    await page.goto("/schedule/plan/slots");
    await waitForHydration(page);

    await page.getByRole("button", { name: /Havneforeningen, onsdag/i }).press("Enter");
    const source = page.getByLabel("Fylles fra");
    await expect(source).toHaveValue("uploads");
    await source.selectOption({ label: "Serien «Ukens program»" });
    await page.getByRole("button", { name: "Lagre" }).click();

    await expect
      .poll(() => patches.at(-1))
      .toMatchObject({ organization: 3, recipe: { kind: "series", series: 8 } });
  });

  test("gives a jukebox slot a theme, and sends it only when it changed", async ({ page }) => {
    const patches: unknown[] = [];
    let stored = jukebox;
    await page.route("**/api/recurring-slots?**", (route) =>
      route.fulfill({ status: 200, json: page_([slot(), stored]) }),
    );
    await page.route("**/api/recurring-slots/41", (route) => {
      const body = route.request().postDataJSON();
      patches.push(body);
      if (body.recipe) stored = { ...stored, recipe: { ...stored.recipe, ...body.recipe } };
      return route.fulfill({ status: 200, json: stored });
    });
    await page.goto("/schedule/plan/slots");
    await waitForHydration(page);

    await page.getByRole("button", { name: /Videojukeboks, fredag/i }).press("Enter");
    await page.getByLabel("Navn").fill("Kulturnatt");
    await page.getByText("Kultur", { exact: true }).click();
    await page.getByLabel("Lengste video (minutter)").fill("30");
    await page.getByLabel("Korteste video (minutter)").fill("45");
    await expect(page.getByText("Den korteste lengden er lengre enn den lengste.")).toBeVisible();
    await page.getByLabel("Korteste video (minutter)").fill("");
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/jukebox-theme.png` });
    await page.getByRole("button", { name: "Lagre" }).click();

    await expect
      .poll(() => patches.at(-1))
      .toMatchObject({
        organization: null,
        recipe: {
          kind: "jukebox",
          name: "Kulturnatt",
          categories: [1],
          shortest: null,
          longest: "00:30:00",
        },
      });

    // Saved as it stands, the theme isn't stored again.
    await page.getByRole("button", { name: /Videojukeboks, fredag/i }).press("Enter");
    await page.getByRole("button", { name: "Lagre" }).click();
    await expect.poll(() => patches.length).toBe(2);
    expect(patches.at(-1)).not.toHaveProperty("recipe");
  });
});
