import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const CREATE_PAGE = "/organization/3/create";
const VIDEO_ID = 7001;

type JsonRecord = Record<string, unknown>;

const answerJson = (route: Route, status: number, json: JsonRecord) =>
  route.fulfill({ status, json });

const recordPost = async (page: Page, path: string, response: JsonRecord, status = 201) => {
  const bodies: JsonRecord[] = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bodies.push(route.request().postDataJSON() as JsonRecord);
    return answerJson(route, status, response);
  });
  return bodies;
};

const openSelect = async (trigger: Locator) => {
  // React Aria can receive the first click while its press handlers are still
  // settling after a streamed dev render. Retrying against aria-expanded
  // keeps this an interaction assertion instead of an arbitrary timeout.
  await expect(async () => {
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true", { timeout: 1_000 });
  }).toPass({ timeout: 5_000 });
};

const fillRequiredDetails = async (page: Page) => {
  await page.getByLabel("Tittel").fill("Ny episode fra kaia");
};

const chooseExistingSeries = async (page: Page) => {
  await openSelect(page.getByRole("button", { name: /Serie \(valgfritt\)/ }));
  const listbox = page.getByRole("listbox", { name: "Serie (valgfritt)" });
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: "Havna vår" }).click();
};

/** The file input: the dropzone on "Ny video", the upload panel on the video's page. */
const fileInput = (page: Page) =>
  page.url().includes("/edit")
    ? page.getByRole("region", { name: "Videofil" }).locator('input[type="file"]')
    : page.locator('input[type="file"]');

const selectVideoFile = (page: Page, name = "havna.mxf") =>
  fileInput(page).setInputFiles({
    name,
    mimeType: "application/mxf",
    buffer: Buffer.from("video"),
  });

const stubUpload = async (page: Page) => {
  const requests: { method: string; headers: Record<string, string>; bytes: number }[] = [];
  const tusHeaders = {
    "Access-Control-Expose-Headers": "Location, Tus-Resumable, Upload-Length, Upload-Offset",
    "Tus-Resumable": "1.0.0",
  };

  await page.route(`**/api/videos/${VIDEO_ID}/upload_token`, (route) =>
    answerJson(route, 200, { uploadToken: "upload-token", uploadUrl: "/uploads" }),
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

/**
 * Ingest, one report at a time. A video has a single ingest job, so the same
 * endpoint answers for every file uploaded to it -- which is the whole point
 * of the retry test below.
 */
const stubIngest = async (page: Page) => {
  let job: JsonRecord = {
    video: VIDEO_ID,
    state: "pending",
    percentageDone: null,
    errorCode: "",
    updatedTime: null,
  };

  await page.route(`**/api/videos/${VIDEO_ID}/ingest`, (route) => answerJson(route, 200, job));

  return (report: JsonRecord) => {
    job = { video: VIDEO_ID, percentageDone: null, errorCode: "", ...report };
  };
};

const SUBMIT = "Last opp og fortsett";

test.beforeEach(async ({ page, baseURL }) => {
  // The video's page, where the upload carries on, is for members only.
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.goto(CREATE_PAGE);
  await waitForHydration(page);
});

test.describe("video creation", () => {
  test("asks for the file and the little needed to create the video", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Ny video" })).toBeVisible();
    await expect(page.getByText("Opplastingen starter med en gang")).toBeVisible();
    await expect(page.getByLabel("Beskrivelse")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Serie \(valgfritt\)/ })).toBeVisible();
    await expect(page.getByText("La stå som «Ingen serie»")).toBeVisible();
    await expect(page.getByLabel("Episodenummer")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Videofil" })).toContainText(
      "Slipp videofilen her",
    );
    await expect(page.getByRole("button", { name: SUBMIT })).toBeVisible();
  });

  test("takes a first guess at the title from the file name", async ({ page }) => {
    await selectVideoFile(page, "havna_vaar_episode_4.mov");
    await expect(page.getByLabel("Tittel")).toHaveValue("havna vaar episode 4");
  });

  test("aligns series creation with the series selector", async ({ page }) => {
    const select = page.getByRole("button", { name: /Serie \(valgfritt\)/ });
    const createSeries = page.getByRole("button", { name: "Opprett ny serie" });
    const [selectBox, buttonBox] = await Promise.all([
      select.boundingBox(),
      createSeries.boundingBox(),
    ]);

    expect(selectBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(
      Math.abs(selectBox!.y + selectBox!.height - (buttonBox!.y + buttonBox!.height)),
    ).toBeLessThanOrEqual(2);
  });

  test("accepts a video by drag and drop", async ({ page }) => {
    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(["video"], "sluppet-opptak.mp4", { type: "video/mp4" }));
      return transfer;
    });

    await page.getByRole("button", { name: "Videofil" }).dispatchEvent("drop", { dataTransfer });

    await expect(page.getByText("sluppet-opptak.mp4")).toBeVisible();
    await expect(page.getByText(/Klikk eller slipp en annen fil/)).toBeVisible();
  });

  test("creates the next episode and carries on uploading on its own page", async ({ page }) => {
    const videoRequests = await recordPost(page, "/api/videos", { id: VIDEO_ID });
    const uploadRequests = await stubUpload(page);
    await stubIngest(page);

    await fillRequiredDetails(page);
    await chooseExistingSeries(page);
    await selectVideoFile(page);
    await page.getByRole("button", { name: SUBMIT }).click();

    await expect(page).toHaveURL(new RegExp(`/video/${VIDEO_ID}/edit$`));
    await expect(page.getByRole("heading", { name: /Laster opp havna\.mxf/ })).toBeVisible();
    await expect(page.getByLabel("Beskrivelse")).toBeVisible();
    await expect.poll(() => uploadRequests.map(({ method }) => method)).toContain("PATCH");

    expect(videoRequests).toHaveLength(1);
    expect(videoRequests[0]).toMatchObject({
      name: "Ny episode fra kaia",
      organization: 3,
      categories: [],
      seriesId: 9001,
      episodeNumber: 4,
    });

    const createUpload = uploadRequests.find(({ method }) => method === "POST");
    expect(createUpload?.headers["upload-metadata"]).toContain("videoID NzAwMQ==");
    expect(createUpload?.headers["upload-metadata"]).toContain("uploadToken dXBsb2FkLXRva2Vu");
  });

  test("follows the replacement through when ingest rejects the first file", async ({ page }) => {
    await recordPost(page, "/api/videos", { id: VIDEO_ID });
    await stubUpload(page);
    const report = await stubIngest(page);

    await fillRequiredDetails(page);
    await selectVideoFile(page);
    await page.getByRole("button", { name: SUBMIT }).click();

    await expect(page).toHaveURL(new RegExp(`/video/${VIDEO_ID}/edit$`));
    report({ state: "failed", errorCode: "not_compliant", updatedTime: "2026-08-21T10:00:00Z" });
    await expect(page.getByText(/Filformatet kan ikke sendes/)).toBeVisible();

    await selectVideoFile(page, "havna-omkodet.mp4");

    // The job still carries the verdict on the file just replaced: ingest has
    // not been handed the new one yet, and until it has, that verdict is not
    // about anything the uploader is waiting for.
    await expect(
      page.getByRole("heading", { name: /Laster opp havna-omkodet\.mp4/ }),
    ).toBeVisible();
    await expect(page.getByText(/Filformatet kan ikke sendes/)).toHaveCount(0);

    report({ state: "done", percentageDone: 100, updatedTime: "2026-08-21T10:05:00Z" });
    await expect(page.getByRole("heading", { name: "Videoen er klar!" })).toBeVisible();
    // The member is already where the video is worked on: no jump elsewhere.
    await expect(page).toHaveURL(new RegExp(`/video/${VIDEO_ID}/edit$`));
  });

  test("creates and selects a new series with episode one", async ({ page }) => {
    const seriesRequests = await recordPost(page, "/api/series", {
      id: 9002,
      name: "Nytt fra fjorden",
      synopsis: "Ukentlige reportasjer.",
      imageUrl: "",
      organization: 3,
      episodeCount: 0,
    });
    const videoRequests = await recordPost(page, "/api/videos", { id: VIDEO_ID });

    await page.getByRole("button", { name: "Opprett ny serie" }).click();
    const dialog = page.getByRole("dialog", { name: "Opprett ny serie" });
    await dialog.getByLabel("Serienavn").fill("Nytt fra fjorden");
    await dialog.getByLabel("Beskrivelse (valgfritt)").fill("Ukentlige reportasjer.");
    await dialog.getByRole("button", { name: "Opprett serie" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /Serie \(valgfritt\)/ })).toContainText(
      "Nytt fra fjorden",
    );

    await fillRequiredDetails(page);
    await selectVideoFile(page, "fjord.mp4");
    await page.getByRole("button", { name: SUBMIT }).click();
    await expect.poll(() => videoRequests.length).toBe(1);

    expect(seriesRequests).toEqual([
      { name: "Nytt fra fjorden", synopsis: "Ukentlige reportasjer.", organization: 3 },
    ]);
    expect(videoRequests[0]).toMatchObject({ seriesId: 9002, episodeNumber: 1 });
  });

  test("leaves series and episode out for a standalone video", async ({ page }) => {
    const videoRequests = await recordPost(page, "/api/videos", { id: VIDEO_ID });

    await fillRequiredDetails(page);
    await selectVideoFile(page, "enkeltvideo.mp4");
    await page.getByRole("button", { name: SUBMIT }).click();
    await expect.poll(() => videoRequests.length).toBe(1);

    expect(videoRequests[0].seriesId).toBeFalsy();
    expect(videoRequests[0].episodeNumber).toBeFalsy();
  });
});
