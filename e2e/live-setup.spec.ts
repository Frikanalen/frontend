import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const issued = {
  id: 21,
  label: "ATEM",
  keyId: "8d6f6b8e-0000-4000-8000-000000000001",
  createdAt: "2026-11-11T14:00:00Z",
  revokedAt: null,
  password: "s3cret",
  connections: [
    { label: "SRT", url: "srt://live.example.test:8890?streamid=publish:contrib/live/x:k:s3cret" },
    { label: "RTMP", url: "rtmp://live.example.test:1935/contrib/live/x?user=k&pass=s3cret" },
  ],
  blackmagicConfig: "<?xml version='1.0'?><streaming />",
};
const listed = {
  id: issued.id,
  label: issued.label,
  keyId: issued.keyId,
  createdAt: issued.createdAt,
  revokedAt: null,
};

// What the server has on record from before the page was opened: forty
// minutes of signal, with a patch of recovered loss and one hole in it.
const recorded = () => {
  const end = Math.floor(Date.now() / 30_000) * 30_000;
  return Array.from({ length: 80 }, (_, index) => {
    const receiving = index !== 50;
    return {
      at: new Date(end - (79 - index) * 30_000).toISOString(),
      receiving,
      bitrate: receiving ? 8_000_000 : null,
      lost: index === 20 || index === 21 ? 14 : 0,
      dropped: 0,
      reconnected: false,
    };
  });
};

const stubSignal = async (page: Page) => {
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  await page.route("**/api/live-sources/9/signal/history?**", (route) =>
    route.fulfill({
      status: 200,
      json: { available: true, stepSeconds: 30, samples: recorded() },
    }),
  );
  await page.route("**/api/live-sources/9/signal", (route) =>
    route.fulfill({
      status: 200,
      json: {
        available: true,
        receiving: true,
        since,
        protocol: "SRT",
        video: { codec: "H264", width: 1280, height: 720, profile: "High" },
        audio: null,
        bytesReceived: 300_000_000,
        framesInError: 0,
        srt: {
          packetsReceived: 1000,
          packetsLost: 0,
          packetsRetransmitted: 0,
          packetsDropped: 0,
          roundTripMs: 12,
        },
        measuredAt: new Date().toISOString(),
      },
    }),
  );
};

const booking = (startsInMs: number) => ({
  id: 501,
  name: "Høstkonsert",
  starttime: new Date(Date.now() + startsInMs).toISOString(),
  endtime: new Date(Date.now() + startsInMs + 3_600_000).toISOString(),
});
const studio = (upcomingTransmissions: object[], overrides: object = {}) => ({
  id: 9,
  name: "Studio",
  enabled: true,
  isPulled: false,
  pullTarget: "",
  encoderCount: 1,
  canDelete: true,
  streamId: "cc1367cd-020e-456d-9d4c-b395eab6aa9c",
  upcomingTransmissions,
  ...overrides,
});

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
  // Not under test: the preview just fails quietly.
  await page.route("**/api/live-sources/9/preview-token", (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
});

const created = {
  id: 10,
  name: "Kirkesal",
  enabled: true,
  isPulled: false,
  pullTarget: "",
  streamId: "aa1367cd-020e-456d-9d4c-b395eab6aa9c",
  upcomingTransmissions: [],
};
const grant = {
  id: 77,
  organization: { id: 3, name: "Frikanalen" },
  starttime: "2030-01-10T18:00:00Z",
  endtime: "2030-01-10T19:00:00Z",
  canEdit: true,
  items: [],
};

test("a member sets up a source to send to, and is led to the schedule", async ({ page }) => {
  const posted: unknown[] = [];
  const keys: unknown[] = [];
  await page.route("**/api/organization/3/live-sources", (route) => {
    posted.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: created });
  });
  await page.route("**/api/live-sources/9/encoder-keys", (route) =>
    route.fulfill({ status: 200, json: [] }),
  );
  await page.route("**/api/live-sources/10/encoder-keys", (route) => {
    keys.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: { ...issued, label: "OBS Studio" } });
  });
  await page.route("**/api/live-sources/10/preview-token", (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  await page.route("**/api/grants?**", (route) =>
    route.fulfill({
      status: 200,
      json: { count: 1, next: null, previous: null, results: [grant] },
    }),
  );
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  await page.getByRole("button", { name: "Ny direktekilde" }).click();
  await expect(page.getByText("Push · SRT · RTMP", { exact: true })).toBeVisible();
  await expect(page.getByText("Pull · SRT · RTMP · RTSP · HLS")).toBeVisible();
  await page.getByRole("button", { name: "Send til Frikanalen" }).click();

  const form = page.getByRole("form", { name: "Koble til koderen" });
  await form.getByLabel("Navn på kilden").fill("Kirkesal");
  await form.getByRole("button", { name: "Opprett kilde og vis innstillinger" }).click();
  await expect.poll(() => posted).toEqual([{ name: "Kirkesal" }]);
  await expect.poll(() => keys).toEqual([{ label: "OBS Studio" }]);

  // OBS wants the address in two fields, the server without a trailing slash.
  const settings = page.getByRole("region", { name: "Innstillinger for «Kirkesal»" });
  await expect(settings).toContainText("rtmp://live.example.test:1935/contrib/live");
  await expect(settings).toContainText("x?user=k&pass=s3cret");
  await expect(settings).toContainText("1080p50");

  await expect(page.getByRole("link", { name: "Legg direktesendingen her" })).toHaveAttribute(
    "href",
    "/organization/3/schedule/77?direkte=10",
  );
  await expect(
    page.getByRole("link", { name: "Be om sendetid til en direktesending" }),
  ).toHaveAttribute("href", "/organization/3/schedule/request?engang=1");
});

test("a member sets up a source for Frikanalen to fetch", async ({ page }) => {
  const posted: unknown[] = [];
  await page.route("**/api/organization/3/live-sources", (route) => {
    posted.push(route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      json: { ...created, name: "Kamera", isPulled: true, pullTarget: "kamera.example.no" },
    });
  });
  await page.route("**/api/live-sources/9/encoder-keys", (route) =>
    route.fulfill({ status: 200, json: [] }),
  );
  await page.route("**/api/live-sources/10/preview-token", (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  await page.route("**/api/grants?**", (route) =>
    route.fulfill({ status: 200, json: { count: 0, next: null, previous: null, results: [] } }),
  );
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  await page.getByRole("button", { name: "Ny direktekilde" }).click();
  await page.getByRole("button", { name: "La Frikanalen hente" }).click();
  const form = page.getByRole("form", { name: "Oppgi adressen" });
  await form.getByLabel("Navn på kilden").fill("Kamera");
  await form.getByText("RTSP", { exact: true }).click();
  await form.getByLabel("Adressen vi skal hente fra").fill("rtsp://kamera.example.no/stream");
  await form.getByRole("button", { name: "Opprett kilde og test" }).click();
  await expect
    .poll(() => posted)
    .toEqual([{ name: "Kamera", pullUrl: "rtsp://kamera.example.no/stream" }]);
  await expect(page.getByText("Dere har ingen kommende sendetid som kan endres.")).toBeVisible();
});

test("a source no encoder can send to says so, and encoders are added, rekeyed and removed", async ({
  page,
  baseURL,
}) => {
  let keys: object[] = [];
  const created: unknown[] = [];
  const calls: string[] = [];
  // The server's own word on the source: booked, and so far without encoders.
  const sourceIs = (state: string) =>
    page.context().addCookies([{ name: "e2e-live", value: state, url: baseURL! }]);
  await sourceIs("booked.used.noencoder");
  await page.route("**/api/organization/3/live-sources", (route) =>
    route.fulfill({
      status: 200,
      json: [studio([booking(5 * 3_600_000)], { encoderCount: keys.length, canDelete: false })],
    }),
  );
  await page.route("**/api/live-sources/9/signal", (route) =>
    route.fulfill({
      status: 200,
      json: { available: true, receiving: false, measuredAt: new Date().toISOString() },
    }),
  );
  await page.route("**/api/live-sources/9/encoder-keys", async (route) => {
    if (route.request().method() === "POST") {
      created.push(route.request().postDataJSON());
      keys = [listed];
      await sourceIs("booked.used");
      return route.fulfill({ status: 201, json: issued });
    }
    return route.fulfill({ status: 200, json: keys });
  });
  await page.route("**/api/live-sources/9/encoder-keys/21/replace", (route) => {
    calls.push("replace");
    keys = [{ ...listed, id: 22, lastUsedAt: null }];
    return route.fulfill({ status: 201, json: { ...issued, id: 22, password: "n3w" } });
  });
  await page.route("**/api/live-sources/9/encoder-keys/22", async (route) => {
    calls.push(route.request().method());
    keys = [];
    await sourceIs("booked.used.noencoder");
    return route.fulfill({ status: 204, body: "" });
  });
  const asked: string[] = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    void dialog.accept();
  });

  // Nothing can send to it: the check page says so and leads to the setup.
  await page.goto("/organization/3/live/9");
  await waitForHydration(page);
  await expect(page.getByRole("status").filter({ hasText: "Mangler koder" })).toBeVisible();
  await page.getByRole("link", { name: "Koble til en koder" }).click();
  await expect(page).toHaveURL(/\/organization\/3\/live\?oppsett=9$/);
  await waitForHydration(page);

  const row = page.getByRole("region", { name: "Studio" });
  await expect(row.getByRole("status").first()).toHaveText("Mangler koder");
  await expect(row.getByRole("link", { name: "Sjekk signalet" })).toHaveCount(0);
  await expect(
    row.getByText("Ingen koder er koblet til, så kilden kan ikke ta imot signal."),
  ).toBeVisible();
  // Booked, so it can be neither switched off nor deleted, and the page says why.
  await expect(
    row.getByText(/kan ikke slås av eller slettes før sendingen er flyttet/),
  ).toBeVisible();
  await expect(row.getByRole("button", { name: "Slå av kilden" })).toHaveCount(0);

  await row.getByLabel("Legg til en koder").fill("ATEM");
  await row.getByRole("button", { name: "Legg til" }).click();
  await expect.poll(() => created).toEqual([{ label: "ATEM" }]);

  const shown = page.getByRole("region", { name: "Innstillinger for «ATEM»" });
  await expect(shown).toContainText("vises bare denne ene gangen");
  await shown.getByRole("tab", { name: "Blackmagic" }).click();
  await expect(shown.getByRole("link", { name: /Blackmagic/ })).toHaveAttribute(
    "download",
    "frikanalen-ATEM.xml",
  );
  await shown.getByRole("tab", { name: "Annen koder" }).click();
  await expect(shown).toContainText(
    "rtmp://live.example.test:1935/contrib/live/x?user=k&pass=s3cret",
  );
  await shown.getByRole("button", { name: "Jeg har kopiert det" }).click();
  await expect(shown).toHaveCount(0);
  await expect(page.getByText("s3cret")).toHaveCount(0);
  // With an encoder connected, the source waits for its signal.
  await expect(row.getByRole("status").first()).toHaveText("Venter på signal");
  await expect(row.getByText("har ikke sendt ennå")).toBeVisible();

  // Lost settings: a new key for the same encoder, shown once again.
  await row.getByRole("button", { name: "Bytt nøkkel for «ATEM»" }).click();
  await expect.poll(() => calls).toEqual(["replace"]);
  expect(asked[0]).toContain("Den gamle slutter å virke med en gang");
  await expect(shown).toContainText("vises bare denne ene gangen");

  // Removing the only encoder of a booked source is allowed, with a warning.
  await row.getByRole("button", { name: "Fjern «ATEM»" }).click();
  await expect.poll(() => calls).toEqual(["replace", "DELETE"]);
  expect(asked[1]).toContain("den eneste koderen");
  expect(asked[1]).toContain("skal på lufta: «Høstkonsert»");
  await expect(shown).toHaveCount(0);
  await expect(row.getByRole("status").first()).toHaveText("Mangler koder");
});

test("a source is renamed, switched off into its own fold, and deleted if never used", async ({
  page,
  baseURL,
}) => {
  await stubSignal(page);
  const sourceIs = (state: string) =>
    page.context().addCookies([{ name: "e2e-live", value: state, url: baseURL! }]);
  await sourceIs("old");
  const sent: unknown[] = [];
  await page.route("**/api/live-sources/*/encoder-keys", (route) =>
    route.fulfill({ status: 200, json: [] }),
  );
  await page.route("**/api/live-sources/9", async (route) => {
    const request = route.request();
    if (request.method() === "DELETE") {
      sent.push("DELETE");
      await sourceIs("old.gone");
      return route.fulfill({ status: 204, body: "" });
    }
    sent.push(request.postDataJSON());
    return route.fulfill({ status: 200, json: studio([]) });
  });
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  // Switched-off sources are out of the way until asked for.
  const old = page.getByRole("region", { name: "Gammel sal" });
  await expect(old).toBeHidden();
  await page.getByText("Avslåtte kilder (1)").click();
  await expect(old.getByRole("status")).toHaveText("Slått av");
  await old.getByRole("button", { name: "Oppsett" }).click();
  await expect(old.getByText(/brukt i et program og kan derfor ikke slettes/)).toBeVisible();
  await expect(old.getByRole("button", { name: "Slett kilden" })).toHaveCount(0);
  await expect(old.getByRole("button", { name: "Slå på kilden" })).toBeVisible();

  const row = page.getByRole("region", { name: "Studio", exact: true });
  await row.getByRole("button", { name: "Oppsett" }).click();
  await row.getByLabel("Navn", { exact: true }).fill("Store sal");
  await row.getByRole("button", { name: "Lagre navn" }).click();
  await expect.poll(() => sent).toEqual([{ name: "Store sal" }]);

  await row.getByRole("button", { name: "Slett kilden" }).click();
  await expect.poll(() => sent).toEqual([{ name: "Store sal" }, "DELETE"]);
  await expect(row).toHaveCount(0);
});

test("the check page gives one verdict with its reasons, and leads on to airtime", async ({
  page,
}) => {
  await stubSignal(page);
  await page.route("**/api/grants?**", (route) =>
    route.fulfill({
      status: 200,
      json: { count: 1, next: null, previous: null, results: [grant] },
    }),
  );
  await page.goto("/organization/3/live/9");
  await waitForHydration(page);

  const verdict = page.getByRole("status").filter({ hasText: "Ikke klar for sending" });
  await expect(verdict).toContainText("Lyd: Signalet har ikke noe lydspor");
  await expect(verdict).toContainText("Bilde: Lavere oppløsning enn anbefalt");
  // The receiver's report on the member's signal, not the preview's numbers,
  // each figure in its own slot.
  const panel = page.getByRole("region", { name: "Signalet deres" });
  await expect(panel.getByText("Oppløsning")).toBeVisible();
  await expect(panel.getByText("1280×720")).toBeVisible();
  await expect(panel.getByText("H.264")).toBeVisible();
  await expect(panel.getByText("VP8")).toHaveCount(0);
  await expect(page.getByText("Forhåndsvisningen er en liten kopi i lav kvalitet.")).toBeVisible();
  // The measures start with what happened before the page was opened.
  await expect(panel.getByText(/pakker siste (39|4\d) min/)).toBeVisible();
  await expect(panel.getByText("28", { exact: true })).toBeVisible();
  await expect(panel.getByText("1", { exact: true })).toBeVisible();

  await expect(page.getByText("Ingen sending er satt opp.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Legg direktesendingen her" })).toHaveAttribute(
    "href",
    "/organization/3/schedule/77?direkte=9",
  );
  await expect(page.getByRole("link", { name: "Åpne sendeskjerm" })).toHaveAttribute(
    "href",
    "/organization/3/live/9/monitor",
  );
});

test("the monitor counts down to air and turns red on air", async ({ page }) => {
  await stubSignal(page);
  let bookings = [booking(90_000)];
  await page.route("**/api/organization/3/live-sources", (route) =>
    route.fulfill({ status: 200, json: [studio(bookings)] }),
  );
  await page.route("**/api/live-sources/9/preview-token", (route) =>
    route.fulfill({
      status: 201,
      json: {
        token: "t",
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
        contributionPath: "contrib/live/x",
        previewPath: "contrib/preview/x",
        programPath: "",
      },
    }),
  );
  await page.route("**/contrib/**", (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto("/organization/3/live/9/monitor");
  await waitForHydration(page);

  const monitor = page.locator("[data-state]");
  await expect(monitor).toHaveAttribute("data-state", "soon");
  const timer = page.getByRole("timer");
  await expect(timer).toContainText("Direkte om");
  await expect(timer).toContainText(/01:\d\d/);
  await expect(timer).toContainText("Høstkonsert");
  await expect(page.getByRole("region", { name: "Fra dere" })).toBeVisible();
  // No programme return on this receiver: its tile is left out, not empty.
  await expect(page.getByRole("region", { name: "Frikanalen sender nå" })).toHaveCount(0);
  await expect(page.getByText(/Mbit\/s/).first()).toBeVisible();
  await expect(page.getByText(/Siste (39|4\d) min: 1 brudd, 1 pakketap/)).toBeVisible();
  // The buttons keep out of the picture until the pointer is over it.
  const close = page.getByRole("link", { name: "Lukk" });
  await page.mouse.move(0, 0);
  await monitor.hover({ position: { x: 200, y: 200 } });
  await expect(close).toHaveCSS("opacity", "1");

  bookings = [booking(-60_000)];
  await page.reload();
  await waitForHydration(page);
  await expect(monitor).toHaveAttribute("data-state", "onair");
  await expect(timer).toContainText("På lufta");
  await expect(timer).toContainText(/5\d:\d\d/);
});
