import { expect, test } from "@playwright/test";
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

test("issues an encoder key once, then lists and revokes it", async ({ page }) => {
  await page.route("**/api/live-sources/9/signal", (route) =>
    route.fulfill({
      status: 200,
      json: {
        available: true,
        receiving: true,
        since: new Date(Date.now() - 5 * 60_000).toISOString(),
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
  let keys: object[] = [];
  const created: unknown[] = [];
  const revoked: string[] = [];
  await page.route("**/api/live-sources/9/encoder-keys", (route) => {
    if (route.request().method() === "POST") {
      created.push(route.request().postDataJSON());
      keys = [listed];
      return route.fulfill({ status: 201, json: issued });
    }
    return route.fulfill({ status: 200, json: keys });
  });
  await page.route("**/api/live-sources/9/encoder-keys/21", (route) => {
    revoked.push(route.request().method());
    keys = [];
    return route.fulfill({ status: 204, body: "" });
  });
  await page.route("**/api/grants?**", (route) =>
    route.fulfill({
      status: 200,
      json: { count: 1, next: null, previous: null, results: [grant] },
    }),
  );
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  await expect(page.getByText("Ingen nøkler ennå.", { exact: false })).toBeVisible();

  // The receiver's report on the signal, not the preview's own numbers.
  const report = page.getByRole("region", { name: "Studio" });
  await expect(report.getByRole("status")).toHaveText("Mottar signal");
  await expect(report).toContainText("SRT · inne i");
  await expect(report).toContainText("1280×720 · H.264 High");
  await expect(report).toContainText("Lavere oppløsning enn anbefalt");
  await expect(report).toContainText("Ingen lyd");
  await expect(report).not.toContainText("Kodek");

  await page.getByLabel("Ny nøkkel").fill("ATEM");
  await page.getByRole("button", { name: "Lag nøkkel" }).click();
  await expect.poll(() => created).toEqual([{ label: "ATEM" }]);

  const shown = page.getByRole("region", { name: "Ny nøkkel «ATEM»" });
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
  // A source that is already set up leads on to the airtime too.
  await expect(page.getByRole("link", { name: "Legg direktesendingen her" })).toHaveAttribute(
    "href",
    "/organization/3/schedule/77?direkte=9",
  );
  await shown.getByRole("button", { name: "Jeg har kopiert det" }).click();
  await expect(shown).toHaveCount(0);
  await expect(page.getByText("s3cret")).toHaveCount(0);

  await page.getByRole("button", { name: "Trekk tilbake «ATEM»" }).click();
  await expect.poll(() => revoked).toEqual(["DELETE"]);
  await expect(page.getByText("Ingen nøkler ennå.", { exact: false })).toBeVisible();
});
