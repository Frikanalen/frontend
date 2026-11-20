import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./support/hydration";

const asApplicant = async (page: Page, baseURL: string, affidavit?: string) => {
  const url = baseURL;
  await page
    .context()
    .addCookies([
      { name: "e2e-member", value: "1", url },
      { name: "e2e-applicant", value: "1", url },
      ...(affidavit ? [{ name: "e2e-affidavit", value: affidavit, url }] : []),
    ]);
};

test("hands out the organization's own declaration as a PDF", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!);

  const response = await page.request.get("/organization/3/affidavit/pdf");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("keeps the PDF to the organization's own people", async ({ page }) => {
  const response = await page.request.get("/organization/3/affidavit/pdf");

  expect(response.status()).toBe(401);
});

test("uploads the signed scan for Frikanalen to check", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!);
  const uploads: string[] = [];
  await page.route("**/api/organization/3/affidavit", (route) => {
    uploads.push(route.request().headers()["content-type"] ?? "");
    return route.fulfill({ status: 201, json: {} });
  });
  await page.goto("/organization/3/affidavit");
  await waitForHydration(page);

  await expect(page.getByRole("link", { name: "Last ned erklæringen (PDF)" })).toHaveAttribute(
    "href",
    "/organization/3/affidavit/pdf",
  );
  const send = page.getByRole("button", { name: "Send til Frikanalen" });
  await expect(send).toBeDisabled();
  await page.getByLabel("Skannet erklæring").setInputFiles({
    name: "erklaering.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\n"),
  });
  await send.click();

  await expect.poll(() => uploads.length).toBe(1);
  expect(uploads[0]).toContain("multipart/form-data");
});

test("refuses a file over 10 MB before sending it", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!);
  await page.goto("/organization/3/affidavit");
  await waitForHydration(page);

  await page.getByLabel("Skannet erklæring").setInputFiles({
    name: "stor.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });

  await expect(page.getByText("Filen er for stor.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send til Frikanalen" })).toBeDisabled();
});

test("says a scan is waiting for review", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!, "pending");
  await page.goto("/organization/3/affidavit");

  await expect(page.getByText("venter på at Frikanalen sjekker den")).toBeVisible();
});

test("passes on why a scan was turned down", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!, "rejected");
  await page.goto("/organization/3/affidavit");

  await expect(page.getByText("Frikanalen kunne ikke godkjenne erklæringen.")).toBeVisible();
  await expect(page.getByText("Signaturen mangler.")).toBeVisible();
});

test("shows a member organization its approval instead", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await page.goto("/organization/3/affidavit");

  await expect(page.getByText("Frikanalen har godkjent erklæringen.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send til Frikanalen" })).toHaveCount(0);
});

test("tells an unfinished organization what is left on its other pages", async ({
  page,
  baseURL,
}) => {
  await asApplicant(page, baseURL!);
  await page.goto("/organization/3/admin");

  const banner = page.getByRole("region", { name: "Medlemskap" });
  await expect(banner).toContainText("Registreringen er ikke ferdig");
  await expect(
    banner.getByRole("link", { name: "Last ned og last opp erklæringen →" }),
  ).toHaveAttribute("href", "/organization/3/affidavit");
});

test("shows a rejected declaration on the other pages too", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!, "rejected");
  await page.goto("/organization/3/admin");

  await expect(page.getByRole("region", { name: "Medlemskap" })).toContainText(
    "Erklæringen ble ikke godkjent",
  );
});

test("leaves the banner off the start page itself", async ({ page, baseURL }) => {
  await asApplicant(page, baseURL!);
  await page.goto("/organization/3/start");

  await expect(page.getByRole("heading", { name: "Kom i gang" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Medlemskap" })).toHaveCount(0);
});
