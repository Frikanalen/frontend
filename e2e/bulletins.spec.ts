import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const page_ = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const bulletin = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  heading: "Velkommen tilbake",
  text: "Vi sender igjen.",
  template: "standard",
  pages: ["Vi sender igjen."],
  pageSeconds: [5],
  readingSeconds: 5,
  createdTime: "2026-11-15T10:00:00Z",
  updatedTime: "2026-11-15T10:00:00Z",
  isPublished: true,
  isCurrent: true,
  startsAt: null,
  endsAt: null,
  priority: 0,
  onAir: true,
  onInfographics: true,
  ...overrides,
});

// Three sentences that are too long for one page between them.
const LONG = [
  "Dette er den første setningen i en lang melding, og den er skrevet for å fylle godt opp på skjermen uten å bli for lang til å lese.",
  "Den andre setningen fortsetter der den første slapp, og sammen blir de to for lange til å få plass på én side i sendingen.",
  "Den tredje setningen avslutter meldingen, slik at den som leser får med seg hele poenget før sendeplanen kommer.",
].join(" ");

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  await stubApi(page);
});

test.describe("bulletins", () => {
  test("lists the bulletins by where they are in their life", async ({ page }) => {
    await page.route("**/api/news/bulletins?**", (route) =>
      route.fulfill({
        status: 200,
        json: page_([
          bulletin(),
          bulletin({ id: 10, heading: "Kladd", isPublished: false, isCurrent: false }),
          bulletin({
            id: 11,
            heading: "Gammel",
            endsAt: "2026-01-01T10:00:00Z",
            isCurrent: false,
            onInfographics: false,
          }),
        ]),
      }),
    );
    await page.goto("/schedule/plan/bulletins");
    await waitForHydration(page);

    await expect(page.getByRole("link", { name: "Meldinger" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const showing = page.getByRole("region", { name: "Vises nå" });
    await expect(showing.getByRole("listitem")).toHaveCount(1);
    await expect(showing).toContainText("Velkommen tilbake");
    await expect(showing).toContainText("mellom programmer og i infografikken");
    await expect(page.getByRole("region", { name: "Utkast" })).toContainText("Kladd");
    await expect(page.getByRole("region", { name: "Ferdige" })).toContainText(
      "Ferdig 1.1. kl. 11:00 · mellom programmer",
    );
  });

  test("writes a long bulletin, sees it paged, and publishes it", async ({ page }) => {
    const created: unknown[] = [];
    await page.route("**/api/news/bulletins?**", (route) =>
      route.fulfill({ status: 200, json: page_([]) }),
    );
    await page.route("**/api/news/bulletins", (route) => {
      created.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: bulletin() });
    });
    await page.goto("/schedule/plan/bulletins");
    await waitForHydration(page);
    await expect(page.getByRole("region", { name: "Vises nå" })).toContainText(
      "Ingen meldinger vises nå",
    );

    await page.getByRole("button", { name: "Ny melding" }).click();
    const form = page.getByRole("form", { name: "Ny melding" });
    await form.getByLabel("Overskrift").fill("Til seerne");
    await form.getByLabel("Tekst").fill(LONG);

    // One frame of the on-air graphics, on the slate, and the pages beside it.
    const frame = form.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("src", /\/graphics\/\?.*view=slate/);
    const pages = form.getByRole("list", { name: "Sidene" }).getByRole("listitem");
    await expect(pages).toHaveCount(2);
    await expect(pages.first()).toContainText("Dette er den første setningen");
    await expect(pages.nth(1)).toContainText("Den tredje setningen");
    await expect(form.getByRole("status")).toContainText("2 sider");
    // The cursor is at the end, so the last page shows; pick the first.
    await expect(frame).toHaveAttribute("data-page", "1");
    await form.getByRole("button", { name: "Vis side 1" }).click();
    await expect(frame).toHaveAttribute("data-page", "0");

    await form.getByLabel("Infografikk").uncheck();
    await form.getByRole("button", { name: "Velg sluttid" }).click();
    await expect(form.getByRole("group", { name: "Vises til" })).toContainText("Fjern");
    await form.getByRole("button", { name: "Publiser" }).click();

    await expect.poll(() => created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      template: "standard",
      heading: "Til seerne",
      text: LONG,
      onAir: true,
      onInfographics: false,
      isPublished: true,
      startsAt: null,
      priority: 0,
    });
    expect((created[0] as { endsAt: string }).endsAt).toMatch(/T12:00:00/);
  });

  test("a text with too many pages cannot be saved", async ({ page }) => {
    await page.route("**/api/news/bulletins?**", (route) =>
      route.fulfill({ status: 200, json: page_([]) }),
    );
    await page.goto("/schedule/plan/bulletins");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Ny melding" }).click();
    const form = page.getByRole("form", { name: "Ny melding" });
    await form.getByLabel("Overskrift").fill("For mye");
    await form.getByLabel("Tekst").fill(Array(7).fill("En side.").join("\n\n"));

    await expect(form).toContainText("Teksten blir 7 sider på skjermen");
    await expect(form.getByRole("button", { name: "Publiser" })).toBeDisabled();
  });
});
