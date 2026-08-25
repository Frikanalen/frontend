import { expect, test, type Route } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const organization = {
  id: 3,
  name: "Havneforeningen",
  description: "",
  editorId: null,
  editorName: "",
  editorEmail: null,
  editorMsisdn: null,
  fkmember: true,
};

const series = {
  id: 9001,
  name: "Havna vår",
  synopsis: "Historier fra kaia.",
  imageUrl: "",
  organization,
  episodeCount: 3,
};

const video = (id: number, name: string, episodeNumber: number | null) => ({
  id,
  name,
  files: {},
  creator: "editor@example.test",
  organization,
  series,
  episodeNumber,
  duration: "00:05:00",
  durationSec: 300,
  categories: ["Kultur"],
  framerate: 25,
  createdTime: "2026-08-21T10:00:00Z",
  updatedTime: "2026-08-21T10:00:00Z",
  uploadedTime: null,
});

const episodes = [
  video(30, "Uten nummer", null),
  video(20, "Tredje episode", 3),
  video(10, "Første episode", 1),
];

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.route("**/api/series?**", (route) =>
    route.fulfill({
      status: 200,
      json: { count: 1, next: null, previous: null, results: [series] },
    }),
  );
  await page.route("**/api/videos?**", (route) =>
    route.fulfill({
      status: 200,
      json: { count: episodes.length, next: null, previous: null, results: episodes },
    }),
  );
});

test.describe("series management", () => {
  test("creates a series from the list-page modal", async ({ page }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route("**/api/series", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requests.push(route.request().postDataJSON() as Record<string, unknown>);
      return route.fulfill({
        status: 201,
        json: { ...series, id: 9002, name: "Nytt fra fjorden", episodeCount: 0 },
      });
    });

    await page.goto("/organization/3/series");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Ny serie" }).click();

    const dialog = page.getByRole("dialog", { name: "Opprett ny serie" });
    await dialog.getByLabel("Serienavn").fill("Nytt fra fjorden");
    await dialog.getByLabel("Beskrivelse (valgfritt)").fill("Ukentlige reportasjer.");
    await dialog.getByRole("button", { name: "Opprett serie" }).click();

    await expect(dialog).toBeHidden();
    expect(requests).toEqual([
      { name: "Nytt fra fjorden", synopsis: "Ukentlige reportasjer.", organization: 3 },
    ]);
  });

  test("edits series metadata on the dedicated page", async ({ page }) => {
    const patches: Record<string, unknown>[] = [];
    await page.route("**/api/series/9001", (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      const data = route.request().postDataJSON() as Record<string, unknown>;
      patches.push(data);
      return route.fulfill({ status: 200, json: { ...series, ...data } });
    });

    const response = await page.goto("/organization/3/series/9001");
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toContain('value="Havna vår"');
    await waitForHydration(page);

    await expect(page).toHaveURL("/organization/3/series/9001");
    await expect(page.getByRole("heading", { name: "Seriedetaljer" })).toBeVisible();
    await page.getByLabel("Navn").fill("Havna");
    await page.getByLabel("Beskrivelse").fill("Nye historier fra kaia.");
    await page.getByRole("button", { name: "Lagre", exact: true }).click();

    await expect(page.getByRole("status")).toHaveText("Serieopplysningene er lagret.");
    expect(patches).toEqual([{ name: "Havna", synopsis: "Nye historier fra kaia." }]);
  });

  test("reorders and consecutively renumbers every episode from the series editor", async ({
    page,
  }) => {
    const patches: { id: string; episodeNumber: number | null }[] = [];
    await page.route("**/api/videos/*", (route: Route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      const id = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const body = route.request().postDataJSON() as { episodeNumber: number | null };
      patches.push({ id, episodeNumber: body.episodeNumber });
      return route.fulfill({
        status: 200,
        json: video(Number(id), `Video ${id}`, body.episodeNumber),
      });
    });

    const response = await page.goto("/organization/3/series");
    expect(response?.status()).toBe(200);
    await waitForHydration(page);

    await page.getByRole("link", { name: "Rediger" }).click();
    await expect(page).toHaveURL("/organization/3/series/9001");
    await expect(page.getByRole("heading", { name: "Episoderekkefølge" })).toBeVisible();

    const editor = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Episoderekkefølge" }),
    });
    await expect(editor.getByRole("listitem").getByRole("link")).toHaveText([
      "Første episode",
      "Tredje episode",
      "Uten nummer",
    ]);

    await editor.getByRole("button", { name: "Flytt Tredje episode opp" }).click();
    await expect(editor.getByRole("listitem").getByRole("link")).toHaveText([
      "Tredje episode",
      "Første episode",
      "Uten nummer",
    ]);
    await editor.getByRole("button", { name: "Lagre rekkefølge" }).click();

    await expect.poll(() => patches.length).toBe(5);
    const finalNumbers = Object.fromEntries(
      patches.map(({ id, episodeNumber }) => [id, episodeNumber]),
    );
    expect(finalNumbers).toEqual({ "10": 2, "20": 1, "30": 3 });
    await expect(editor.getByRole("status")).toHaveText("Episoderekkefølgen er lagret.");
  });
});
