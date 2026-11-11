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

test("a member sets up a source", async ({ page }) => {
  const posted: unknown[] = [];
  await page.route("**/api/organization/3/live-sources", (route) => {
    posted.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: {} });
  });
  await page.route("**/api/live-sources/9/encoder-keys", (route) =>
    route.fulfill({ status: 200, json: [] }),
  );
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  const form = page.getByRole("form", { name: "Ny direktekilde" });
  await form.getByLabel("Ny direktekilde").fill("Kirkesal");
  await form.getByRole("button", { name: "Opprett kilde" }).click();
  await expect.poll(() => posted).toEqual([{ name: "Kirkesal" }]);
});

test("issues an encoder key once, then lists and revokes it", async ({ page }) => {
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
  await page.goto("/organization/3/live");
  await waitForHydration(page);

  await expect(page.getByText("Ingen nøkler ennå.", { exact: false })).toBeVisible();
  await page.getByLabel("Ny nøkkel").fill("ATEM");
  await page.getByRole("button", { name: "Lag nøkkel" }).click();
  await expect.poll(() => created).toEqual([{ label: "ATEM" }]);

  const shown = page.getByRole("region", { name: "Ny nøkkel «ATEM»" });
  await expect(shown).toContainText("vises bare denne ene gangen");
  await expect(shown).toContainText(
    "rtmp://live.example.test:1935/contrib/live/x?user=k&pass=s3cret",
  );
  await expect(shown.getByRole("link", { name: /Blackmagic/ })).toHaveAttribute(
    "download",
    "frikanalen-ATEM.xml",
  );
  await shown.getByRole("button", { name: "Jeg har kopiert det" }).click();
  await expect(shown).toHaveCount(0);
  await expect(page.getByText("s3cret")).toHaveCount(0);

  await page.getByRole("button", { name: "Trekk tilbake «ATEM»" }).click();
  await expect.poll(() => revoked).toEqual(["DELETE"]);
  await expect(page.getByText("Ingen nøkler ennå.", { exact: false })).toBeVisible();
});
