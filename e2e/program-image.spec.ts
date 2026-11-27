import { expect, test, type Page, type Route } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const VIDEO_ID = 7002;
const EDIT_PAGE = `/video/${VIDEO_ID}/edit`;

type JsonRecord = Record<string, unknown>;

const answerJson = (route: Route, status: number, json: JsonRecord) =>
  route.fulfill({ status, json });

// A 1x1 PNG, so the browser's own decode check lets it through.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const stubUpload = async (page: Page) => {
  const requests: { method: string; headers: Record<string, string>; bytes: number }[] = [];
  const tusHeaders = {
    "Access-Control-Expose-Headers": "Location, Tus-Resumable, Upload-Length, Upload-Offset",
    "Tus-Resumable": "1.0.0",
  };

  await page.route(`**/api/videos/${VIDEO_ID}/upload`, (route) =>
    answerJson(route, 200, { uploadUrl: "/uploads" }),
  );
  // The offset tusd would be keeping, taken from what the client says it is
  // sending rather than from the bytes on the wire: WebKit does not hand
  // request bodies to routes, so counting those would hold every upload at
  // zero there and leave the client retrying the same PATCH forever.
  let length = 0;
  let offset = 0;

  await page.route("**/uploads**", (route) => {
    const request = route.request();
    const method = request.method();
    const body = request.postDataBuffer();
    requests.push({ method, headers: request.headers(), bytes: body?.length ?? 0 });

    if (method === "POST") {
      length = Number(request.headers()["upload-length"] ?? 0);
      offset = 0;
      return route.fulfill({
        status: 201,
        headers: {
          ...tusHeaders,
          Location: new URL("/uploads/created", request.url()).href,
          "Upload-Offset": "0",
        },
      });
    }

    if (method === "PATCH") {
      // A body we cannot see is taken as the rest of the file: these uploads
      // are a few bytes, and the client sends them in one PATCH.
      offset = Math.min(length, offset + (body?.length ?? length));
      return route.fulfill({
        status: 204,
        headers: { ...tusHeaders, "Upload-Offset": String(offset) },
      });
    }

    if (method === "HEAD") {
      return route.fulfill({
        status: 200,
        headers: {
          ...tusHeaders,
          "Upload-Length": String(length),
          "Upload-Offset": String(offset),
        },
      });
    }

    return route.fulfill({ status: 204, headers: tusHeaders });
  });

  return requests;
};

/** The video's images as the browser sees them while it waits for the new one. */
const stubImages = async (page: Page) => {
  let results: JsonRecord[] = [];
  await page.route(`**/api/videos/${VIDEO_ID}/images**`, (route) =>
    answerJson(route, 200, { count: results.length, next: null, previous: null, results }),
  );
  return (next: JsonRecord[]) => {
    results = next;
  };
};

const openDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Endre bilde" }).click();
  return page.getByRole("dialog");
};

const chooseImage = (page: Page, name = "bilde.png", buffer = PNG) =>
  page.getByRole("dialog").locator('input[type="file"]').setInputFiles({
    name,
    mimeType: "image/png",
    buffer,
  });

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
});

test.describe("programme image upload", () => {
  test("says the image is being processed, then that it is in use", async ({ page }) => {
    await stubUpload(page);
    const setImages = await stubImages(page);
    await page.goto(EDIT_PAGE);
    await waitForHydration(page);

    const dialog = await openDialog(page);
    await chooseImage(page);
    await dialog.getByRole("button", { name: "Last opp bilde.png" }).click();

    await expect(dialog.getByText("Behandles automatisk")).toBeVisible();
    await expect(dialog.getByText("kontrollert")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Last opp eget bilde" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Endre bilde" })).toContainText(
      "Nytt bilde behandles",
    );
    if (process.env.SCREENSHOT_DIR)
      await dialog.screenshot({ path: `${process.env.SCREENSHOT_DIR}/processing.png` });

    setImages([
      {
        id: 41,
        url: "/favicon.ico",
        width: 1920,
        height: 1080,
        mediaType: "image/png",
        role: "key_art_titled",
      },
    ]);
    await expect(dialog.getByText("Det nye bildet er klart og er nå i bruk.")).toBeVisible();
    if (process.env.SCREENSHOT_DIR)
      await dialog.screenshot({ path: `${process.env.SCREENSHOT_DIR}/ready.png` });
  });

  test("says so when the image never comes through", async ({ page }) => {
    await page.clock.install();
    await stubUpload(page);
    await stubImages(page);
    await page.goto(EDIT_PAGE);
    await waitForHydration(page);

    const dialog = await openDialog(page);
    await chooseImage(page);
    await dialog.getByRole("button", { name: "Last opp bilde.png" }).click();
    await expect(dialog.getByText("Behandles automatisk")).toBeVisible();

    await page.clock.runFor(65_000);
    await expect(dialog.getByText("ble ikke ferdig behandlet")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Last opp eget bilde" })).toBeEnabled();
    if (process.env.SCREENSHOT_DIR)
      await dialog.screenshot({ path: `${process.env.SCREENSHOT_DIR}/stalled.png` });
  });

  test("turns away a file the browser cannot read as an image", async ({ page }) => {
    await page.goto(EDIT_PAGE);
    await waitForHydration(page);

    const dialog = await openDialog(page);
    await chooseImage(page, "ikke-et-bilde.png", Buffer.from("not an image"));

    await expect(dialog.getByText("Filen kan ikke leses som et bilde.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Last opp ikke-et-bilde/ })).toHaveCount(0);
  });
});
