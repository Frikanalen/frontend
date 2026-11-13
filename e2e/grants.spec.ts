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
  liveSource: null,
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
  fillSeries: null,
  fillSeriesName: null,
  originSlot: 5,
  items: [
    { position: 0, pinned: true, video: grantVideo(1, "Kaia i dag", "00:20:00") },
    { position: 1, pinned: true, video: grantVideo(2, "Båtliv", "00:15:00") },
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

const studio = {
  id: 9,
  name: "Studio",
  enabled: true,
  streamId: "cc1367cd-020e-456d-9d4c-b395eab6aa9c",
  contributionPath: "contrib/live/cc1367cd-020e-456d-9d4c-b395eab6aa9c",
  previewPath: "contrib/preview/cc1367cd-020e-456d-9d4c-b395eab6aa9c",
  upcomingTransmissions: [],
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

const editor = async (
  page: import("@playwright/test").Page,
  grantBody: object,
  library: object[] = [libraryVideo],
) => {
  await page.route("**/api/grants/700", (route) => route.fulfill({ status: 200, json: grantBody }));
  await page.route("**/api/videos?**", (route) =>
    route.fulfill({ status: 200, json: page_(library) }),
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
    await expect(cards.nth(0).getByText(/Åpen til man 7\. jan\. kl\. 00:00/)).toBeVisible();
    await expect(cards.nth(0).getByText("35:00 av 1:00:00 brukt, 25:00 grafikk")).toBeVisible();
    await expect(cards.nth(0).getByRole("link", { name: "Sett opp programmet" })).toHaveAttribute(
      "href",
      "/organization/3/schedule/700",
    );
  });

  test("leads with what can be set up, and folds away the rest", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([
          grant({
            id: 690,
            state: "compiled",
            canEdit: false,
            starttime: "2020-01-14T08:00:00Z",
            endtime: "2020-01-14T09:00:00Z",
          }),
          grant({ id: 701, state: "compiled", canEdit: false, locksAt: "2029-12-30T23:00:00Z" }),
          grant(),
        ]),
      }),
    );

    await page.goto("/organization/3/schedule");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Kan settes opp (1)" })).toBeVisible();
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(1);
    await expect(cards.getByText(/Åpen til man 7\. jan\. kl\. 00:00/)).toBeVisible();

    const locked = page.getByText("Låst, venter på sending (1)");
    await locked.click();
    await expect(page.getByText(/Låst man 31\. des\. kl\. 00:00/)).toBeVisible();

    await page.getByText("Allerede sendt i dag (1)").click();
    await expect(page.getByRole("link", { name: /14\. januar 09:00–10:00/ })).toHaveAttribute(
      "href",
      "/organization/3/schedule/690",
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
    await expect(focused).toHaveAttribute("aria-roledescription", "slippeindikator");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(focused).toHaveAttribute("aria-label", "Sett inn mellom Kaia i dag og Båtliv");
    await page.keyboard.press("Enter");
    await expect(listRows(page)).toHaveCount(3);
    await expect(listRows(page).nth(1)).toContainText("Fjordglimt");
    // Choosing videos doesn't turn automatic filling off.
    await expect(page.getByText("Automatisk fylt")).toBeVisible();
    await expect(page.getByText("Fylles automatisk når du lagrer")).toBeVisible();

    await page.getByRole("button", { name: "Flytt «Båtliv»" }).focus();
    await page.keyboard.press("Enter");
    await expect(focused).toHaveAttribute("aria-label", "Sett inn mellom Fjordglimt og Båtliv");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(focused).toHaveAttribute("aria-label", "Sett inn før Kaia i dag");
    await page.keyboard.press("Enter");
    await expect(listRows(page).nth(0)).toContainText("Båtliv");

    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect
      .poll(() => puts)
      .toEqual([{ items: [{ video: 2 }, { video: 1 }, { video: 3 }], automatic: true }]);
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

  test("an edit undone by hand is no change to save", async ({ page }) => {
    await editor(page, grant());
    await page.getByRole("button", { name: "Legg til" }).click();
    await expect(page.getByText("Ikke lagret")).toBeVisible();
    await page.getByRole("button", { name: "Fjern «Fjordglimt»" }).click();

    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeDisabled();
    await expect(page.getByText("Automatisk fylt")).toBeVisible();
  });

  test("can show only the videos that still fit", async ({ page }) => {
    await editor(page, grant(), [
      libraryVideo,
      { ...libraryVideo, id: 4, name: "Kortfilm", duration: "00:05:00" },
    ]);
    const library = page.getByRole("grid", { name: "Videoer du kan legge til" }).getByRole("row");

    // 25 minutes are left: the short film fits and comes first, Fjordglimt doesn't.
    await expect(library.nth(0)).toContainText("Kortfilm");
    await expect(library.nth(1)).toContainText("for lang for resten");
    await page.getByLabel(/Bare videoer som får plass/).check();
    await expect(library).toHaveCount(1);
  });

  test("keeps placeholders and live programmes apart", async ({ page }) => {
    await page.route("**/api/organization/3/live-sources", (route) =>
      route.fulfill({ status: 200, json: [studio] }),
    );
    await editor(page, grant({ endtime: "2030-01-14T18:30:00Z" }), [
      { ...libraryVideo, id: 5, name: "Kommer senere", properImport: false, liveSource: null },
      { ...libraryVideo, id: 6, name: "Valgvake", properImport: false, liveSource: studio.id },
    ]);
    const library = page.getByRole("grid", { name: "Videoer du kan legge til" }).getByRole("row");

    await page.getByRole("button", { name: "Plassholdere" }).click();
    await expect(library).toHaveCount(1);
    await expect(library.nth(0)).toContainText("Kommer senere");
    await expect(library.nth(0)).toContainText("venter på fil");

    await page.getByRole("button", { name: "Direktesending", exact: true }).click();
    await expect(library).toHaveCount(1);
    await expect(library.nth(0)).toContainText("Valgvake");
    await expect(library.nth(0)).toContainText("direkte fra Studio");

    await library.nth(0).getByRole("button", { name: "Legg til" }).click();
    await expect(listRows(page).nth(2)).toContainText("direkte fra Studio");
    await expect(listRows(page).nth(2).getByLabel("Direktesending")).toBeVisible();
  });

  test("creates a live programme and lists it", async ({ page }) => {
    const created: unknown[] = [];
    const valgvake = {
      ...libraryVideo,
      id: 50,
      name: "Valgvake",
      duration: "00:25:00",
      properImport: false,
      liveSource: studio.id,
    };
    await page.route("**/api/organization/3/live-sources", (route) =>
      route.fulfill({ status: 200, json: [studio] }),
    );
    await page.route("**/api/videos", (route) => {
      created.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: { ...valgvake, organization: 3 } });
    });
    await page.route("**/api/videos/50", (route) => route.fulfill({ status: 200, json: valgvake }));
    await editor(page, grant());

    await page.getByRole("button", { name: "Ny direktesending" }).click();
    const form = page.getByRole("form", { name: "Ny direktesending" });
    await form.getByLabel("Tittel").fill("Valgvake");
    // The length starts out as the 25 minutes left.
    await expect(form.getByLabel("Lengde (min)")).toHaveValue("25");
    await form.getByRole("button", { name: "Opprett og legg til" }).click();

    await expect
      .poll(() => created)
      .toEqual([
        {
          name: "Valgvake",
          duration: "00:25:00",
          organization: 3,
          categories: [],
          liveSource: studio.id,
        },
      ]);
    await expect(form).toHaveCount(0);
    await expect(listRows(page)).toHaveCount(3);
    await expect(listRows(page).nth(2)).toContainText("Valgvake");
    await expect(listRows(page).nth(2)).toContainText("direkte fra Studio");
  });

  test("creates a placeholder and lists it", async ({ page }) => {
    const created: unknown[] = [];
    const later = {
      ...libraryVideo,
      id: 51,
      name: "Kommer senere",
      duration: "00:10:00",
      properImport: false,
      liveSource: null,
    };
    await page.route("**/api/organization/3/live-sources", (route) =>
      route.fulfill({ status: 200, json: [] }),
    );
    await page.route("**/api/videos", (route) => {
      created.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: { ...later, organization: 3 } });
    });
    await page.route("**/api/videos/51", (route) => route.fulfill({ status: 200, json: later }));
    await editor(page, grant());

    await page.getByRole("button", { name: "Ny plassholder" }).click();
    const form = page.getByRole("form", { name: "Ny plassholder" });
    await form.getByLabel("Tittel").fill("Kommer senere");
    await form.getByLabel("Lengde (min)").fill("10");
    await form.getByRole("button", { name: "Opprett og legg til" }).click();

    await expect
      .poll(() => created)
      .toEqual([{ name: "Kommer senere", duration: "00:10:00", organization: 3, categories: [] }]);
    await expect(listRows(page).nth(2)).toContainText("Kommer senere");
    await expect(listRows(page).nth(2)).toContainText("venter på fil");
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

  test("keeps the tools away on a locked grant staff may still change", async ({ page }) => {
    await editor(page, grant({ state: "compiled", canEdit: true }));

    // Locked for transmission: the list as it will air, nothing about editing.
    await expect(page.getByRole("note")).toContainText("Listen er låst");
    await expect(page.getByText(/Endrer du den, blir den manuell/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lagre listen" })).toHaveCount(0);
    await expect(page.getByRole("grid", { name: "Videoer du kan legge til" })).toHaveCount(0);

    await page.getByRole("button", { name: "Endre likevel" }).click();
    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeVisible();
    await expect(page.getByRole("grid", { name: "Videoer du kan legge til" })).toBeVisible();
    await expect(page.getByRole("note")).toHaveCount(0);
  });

  test("offers no editing on a grant the user can't change", async ({ page }) => {
    await editor(page, grant({ state: "compiled", canEdit: false }));

    await expect(page.getByText("Klar for sending", { exact: false })).toBeVisible();
    await expect(page.getByText(/Listen ble låst/)).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Fristen er passert");
    // Nothing here can be changed, so don't explain how changing it works.
    await expect(page.getByText(/Endrer du den, blir den manuell/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Flytt/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lagre listen" })).toHaveCount(0);
    await expect(page.getByRole("grid", { name: "Videoer du kan legge til" })).toHaveCount(0);
  });

  test("says a grant that has aired can't be changed any more", async ({ page }) => {
    await editor(
      page,
      grant({
        state: "compiled",
        lockExempt: true,
        canEdit: false,
        starttime: "2020-01-14T17:00:00Z",
        endtime: "2020-01-14T18:00:00Z",
      }),
    );

    await expect(page.getByText("Sendetiden er over.")).toBeVisible();
    await expect(page.getByRole("note")).toContainText("kan ikke endres lenger");
    await expect(page.getByText(/kan endres helt frem til sending/)).toHaveCount(0);
  });

  test("chooses a series for one broadcast, or for its whole fixed slot", async ({ page }) => {
    const puts: unknown[] = [];
    const following = grant({ fillSeries: 8, fillSeriesName: "Ukens program" });
    await page.route("**/api/series?**", (route) =>
      route.fulfill({ status: 200, json: page_([{ id: 8, name: "Ukens program" }]) }),
    );
    await page.route("**/api/grants/700/items", (route) => {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: following });
    });
    await editor(page, grant());

    const source = page.getByRole("combobox", { name: "Fylles fra" });
    await expect(source).toHaveValue("");
    // Choosing is not saving.
    await source.selectOption({ label: "Serien «Ukens program»" });
    expect(puts).toEqual([]);
    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect
      .poll(() => puts)
      .toEqual([
        { items: [{ video: 1 }, { video: 2 }], automatic: true, series: 8, wholeSlot: false },
      ]);
    await expect(source).toHaveValue("8");
    await expect(page.getByRole("button", { name: "Lagre listen" })).toBeDisabled();

    await page.getByRole("checkbox", { name: /alle sendinger i denne faste sendeflaten/ }).check();
    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect.poll(() => puts.at(-1)).toMatchObject({ series: 8, wholeSlot: true });
  });

  test("the board says what each automatic broadcast fills from", async ({ page }) => {
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([
          grant({ fillSeries: 8, fillSeriesName: "Ukens program" }),
          grant({ id: 701, starttime: "2030-01-15T17:00:00Z", endtime: "2030-01-15T18:00:00Z" }),
        ]),
      }),
    );
    await page.goto("/organization/3/schedule");
    await waitForHydration(page);

    const cards = page.getByRole("article");
    await expect(cards.nth(0)).toContainText("Fylles fra serien «Ukens program»");
    await expect(cards.nth(1)).toContainText("Fylles fra alt dere laster opp");
  });

  test("keeps a video the rule picked, and lets the rule fill around it", async ({ page }) => {
    const puts: unknown[] = [];
    const filling = grant({
      items: [
        { position: 0, pinned: false, video: grantVideo(1, "Kaia i dag", "00:20:00") },
        { position: 1, pinned: false, video: grantVideo(2, "Båtliv", "00:15:00") },
      ],
    });
    await page.route("**/api/grants/700/items", (route) => {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: filling });
    });
    await editor(page, filling);

    // Nothing is chosen by hand; the rule's picks are listed apart.
    const filled = page.getByRole("list", { name: "Fylt automatisk" }).getByRole("listitem");
    await expect(filled).toHaveCount(2);
    await expect(filled.nth(1)).toContainText("18:20–18:35");

    await filled.nth(1).getByRole("button", { name: "Behold" }).click();
    await expect(listRows(page)).toHaveCount(1);
    await expect(listRows(page).nth(0)).toContainText("Båtliv");

    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect.poll(() => puts).toEqual([{ items: [{ video: 2 }], automatic: true }]);
  });

  test("turning automatic filling off keeps the list as a hand-made one", async ({ page }) => {
    const puts: unknown[] = [];
    const filling = grant({
      items: [
        { position: 0, pinned: true, video: grantVideo(1, "Kaia i dag", "00:20:00") },
        { position: 1, pinned: false, video: grantVideo(2, "Båtliv", "00:15:00") },
      ],
    });
    await page.route("**/api/grants/700/items", (route) => {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, json: grant({ fillRule: null }) });
    });
    await editor(page, filling);

    await page.getByRole("checkbox", { name: /Fyll resten av tiden automatisk/ }).uncheck();
    await expect(listRows(page)).toHaveCount(2);

    await page.getByRole("button", { name: "Lagre listen" }).click();
    await expect
      .poll(() => puts)
      .toEqual([{ items: [{ video: 1 }, { video: 2 }], automatic: false }]);
    await expect(page.getByText("Satt opp manuelt")).toBeVisible();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const fitsTheScreen = (page: import("@playwright/test").Page) =>
    expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

  const longTitle = grantVideo(
    1,
    "En veldig lang videotittel som ikke vil brytes pent",
    "00:20:00",
  );

  test("the staff board doesn't spill past the right edge", async ({ page, baseURL }) => {
    await page.context().clearCookies();
    await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
    await page.route("**/api/grants?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([grant({ items: [{ position: 0, video: longTitle }] })]),
      }),
    );
    await page.goto("/schedule/plan");
    await waitForHydration(page);

    await expect(page.getByRole("article")).toHaveCount(1);
    await fitsTheScreen(page);
  });

  test("the editor fits, with the time above the title", async ({ page }) => {
    await editor(page, grant({ items: [{ position: 0, video: longTitle }] }));

    await expect(listRows(page)).toHaveCount(1);
    await fitsTheScreen(page);
  });
});
