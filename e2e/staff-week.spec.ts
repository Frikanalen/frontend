import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const organization = { id: 3, name: "Havneforeningen" };

const page_ = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

// Monday 14 January 2030, 18:00–19:00 in Oslo.
const grant = (overrides: Record<string, unknown> = {}) => ({
  id: 700,
  organization,
  starttime: "2030-01-14T17:00:00Z",
  endtime: "2030-01-14T18:00:00Z",
  state: "open",
  locksAt: "2030-01-06T23:00:00Z",
  lockExempt: false,
  recipe: null,
  originSlot: 5,
  items: [
    {
      position: 0,
      pinned: true,
      video: {
        id: 1,
        name: "Kaia i dag",
        duration: "00:20:00",
        organization,
        pendingUpload: false,
        liveSource: null,
      },
    },
  ],
  itemsDuration: "00:20:00",
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

/** Grant lists by the week they ask for, and every write the page sends. */
const backend = async (page: Page) => {
  const listed: string[] = [];
  const created: unknown[] = [];
  const writes: { method: string; url: string; body: Record<string, unknown> }[] = [];
  await page.route("**/api/grants?**", (route) => {
    const url = new URL(route.request().url());
    const before = Date.parse(url.searchParams.get("starts_before") ?? "");
    listed.push(new Date(before).toISOString());
    // Only the week of 14 January has anything in it.
    const inWeek = before === Date.parse("2030-01-20T23:00:00Z");
    return route.fulfill({ status: 200, json: page_(inWeek ? [grant(), ...created] : []) });
  });
  const record =
    (status: number, json: (_body: Record<string, unknown>) => unknown) =>
    (route: Parameters<Parameters<Page["route"]>[1]>[0]) => {
      const body = route.request().postDataJSON() ?? {};
      writes.push({ method: route.request().method(), url: route.request().url(), body });
      return route.fulfill({ status, json: json(body) });
    };
  await page.route(
    "**/api/grants",
    record(201, (body) => {
      const made = grant({
        id: 900,
        starttime: body.starttime,
        endtime: body.endtime,
        items: [],
        originSlot: null,
      });
      created.push(made);
      return made;
    }),
  );
  await page.route(
    "**/api/grants/700",
    record(200, () => grant({ state: "cancelled" })),
  );
  await page.route("**/api/videos?**", (route) =>
    route.fulfill({ status: 200, json: page_([libraryVideo]) }),
  );
  return { listed, writes };
};

/** Taps Tuesday at 08:00 on the week. */
const tapFreeTime = async (page: Page) => {
  const grid = page.getByTestId("week-grid");
  const box = (await grid.boundingBox())!;
  await page.mouse.click(box.x + box.width * (1.5 / 7), box.y + 8 * 40 + 4);
};

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  await stubApi(page);
  if (process.env.SCREENSHOT_DIR) await page.setViewportSize({ width: 1440, height: 1100 });
});

test.describe("the staff week", () => {
  test("shows the week's grants and steps between weeks", async ({ page }) => {
    const { listed } = await backend(page);
    await page.goto("/schedule/plan?uke=2030-01-16");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: /Uke 3/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Havneforeningen, 18:00–19:00/ })).toBeVisible();
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/week.png` });

    await page.getByRole("button", { name: "Neste uke" }).click();
    await expect(page.getByRole("heading", { name: /Uke 4/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Havneforeningen/ })).toHaveCount(0);
    await expect(page).toHaveURL(/uke=2030-01-21/);
    expect(listed).toContain("2030-01-27T23:00:00.000Z");

    await page.getByRole("button", { name: "Forrige uke" }).click();
    await expect(page.getByRole("heading", { name: /Uke 3/ })).toBeVisible();
  });

  test("every staff airtime page links to the others", async ({ page }) => {
    await backend(page);
    await page.route("**/api/recurring-slots?**", (route) =>
      route.fulfill({ status: 200, json: page_([]) }),
    );
    await page.goto("/schedule/plan");
    const tabs = page.getByRole("navigation", { name: "Sendetid" });
    await tabs.getByRole("link", { name: "Faste sendeflater" }).click();
    await expect(page.getByRole("heading", { name: "Faste sendeflater", level: 1 })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Faste sendeflater" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await tabs.getByRole("link", { name: "Uke" }).click();
    await expect(page.getByRole("heading", { name: "Sendetid", level: 1 })).toBeVisible();
  });

  test("staff give airtime in free time", async ({ page }) => {
    const { writes } = await backend(page);
    await page.goto("/schedule/plan?uke=2030-01-14");
    await waitForHydration(page);

    await tapFreeTime(page);
    const form = page.getByRole("form", { name: "Ledig tid" });
    await expect(form).toBeVisible();
    const give = form.getByRole("button", { name: "Gi sendetid", exact: true });
    await expect(give).toBeDisabled();
    await form.getByRole("combobox").selectOption("3");
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/week-give.png` });
    await give.click();

    await expect(page.getByRole("heading", { name: "Havneforeningen" })).toBeVisible();
    const post = writes.find(({ method }) => method === "POST")!;
    expect(post.body).toMatchObject({ organization: 3, recipe: { kind: "uploads" } });
    // Tuesday 08:00–09:00 in Oslo.
    expect(Date.parse(post.body.starttime as string)).toBe(Date.parse("2030-01-15T07:00:00Z"));
    expect(Date.parse(post.body.endtime as string)).toBe(Date.parse("2030-01-15T08:00:00Z"));
  });

  test("staff set up a single video for an organization", async ({ page }) => {
    const { writes } = await backend(page);
    await page.goto("/schedule/plan?uke=2030-01-14");
    await waitForHydration(page);

    await tapFreeTime(page);
    const form = page.getByRole("form", { name: "Ledig tid" });
    await form.getByRole("button", { name: "Én video" }).click();
    await form.getByRole("combobox").selectOption("3");
    await form.getByRole("button", { name: /Fjordglimt/ }).click();
    await expect(form).toContainText("«Fjordglimt» går");
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/week-video.png` });
    await form.getByRole("button", { name: "Gi sendetid med videoen" }).click();

    await expect(page.getByRole("heading", { name: "Havneforeningen" })).toBeVisible();
    const post = writes.find(({ method }) => method === "POST")!;
    expect(post.body).toMatchObject({ organization: 3, recipe: null, items: [{ video: 3 }] });
    expect(Date.parse(post.body.starttime as string)).toBe(Date.parse("2030-01-15T07:00:00Z"));
    // Exactly as long as the video.
    expect(Date.parse(post.body.endtime as string)).toBe(Date.parse("2030-01-15T07:30:00Z"));
  });

  test("staff delete a grant", async ({ page }) => {
    const { writes } = await backend(page);
    await page.goto("/schedule/plan?uke=2030-01-14");
    await waitForHydration(page);

    await page.getByRole("button", { name: /Havneforeningen, 18:00–19:00/ }).click();
    await expect(page.getByText("Kaia i dag")).toBeVisible();
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/week-grant.png` });
    await page.getByRole("button", { name: "Slett sendetiden" }).click();
    await page
      .getByRole("group", { name: "Bekreft sletting" })
      .getByRole("button", { name: "Slett sendetiden" })
      .click();

    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ method: "PATCH", body: { state: "cancelled" } });
  });
});
