import { expect, test, type Page } from "@playwright/test";
import { rejectWith, resolveWith, stubApi, stubPage } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const QR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
  ).toString("base64");

const otpRequired = {
  type: "validation_error",
  errors: [{ code: "otp_required", detail: "Skriv inn koden.", attr: "otp" }],
};

/** Answers with `otp_required` until a request carries `otp`, then succeeds. */
const askForCode = async (page: Page, path: string, ok: unknown = {}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route(`**${path}`, (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    return body.otp
      ? route.fulfill({ status: 200, json: ok })
      : route.fulfill({ status: 400, json: otpRequired });
  });
  return requests;
};

test.describe("login with two-factor", () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
    await page.goto("/login");
    await waitForHydration(page);
  });

  test("asks for the code after the password, then logs in", async ({ page }) => {
    const requests = await askForCode(page, "/api/user/login");
    await stubPage(page, "/profile");

    await fillAndConfirm(page.getByLabel("E-post"), "someone@example.com");
    await fillAndConfirm(page.getByLabel("Passord"), "a long secret phrase");
    await page.getByRole("button", { name: "Logg inn" }).click();

    const code = page.getByLabel("Kode fra autentiseringsappen");
    await expect(code).toBeVisible();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(0);
    await fillAndConfirm(code, "123456");
    await page.getByRole("button", { name: "Logg inn" }).click();

    await page.waitForURL("**/profile");
    expect(requests).toEqual([
      { email: "someone@example.com", password: "a long secret phrase" },
      { email: "someone@example.com", password: "a long secret phrase", otp: "123456" },
    ]);
  });

  test("shows a wrong code", async ({ page }) => {
    await askForCode(page, "/api/user/login");
    await fillAndConfirm(page.getByLabel("E-post"), "someone@example.com");
    await fillAndConfirm(page.getByLabel("Passord"), "a long secret phrase");
    await page.getByRole("button", { name: "Logg inn" }).click();
    await expect(page.getByLabel("Kode fra autentiseringsappen")).toBeVisible();

    await page.unroute("**/api/user/login");
    await rejectWith(page, "/api/user/login", 400, {
      type: "validation_error",
      errors: [{ code: "invalid", detail: "Koden stemmer ikke.", attr: "otp" }],
    });
    await fillAndConfirm(page.getByLabel("Kode fra autentiseringsappen"), "000000");
    await page.getByRole("button", { name: "Logg inn" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("Koden stemmer ikke.");
  });
});

test("password reset asks for the code too", async ({ page }) => {
  await stubApi(page);
  await page.goto("/password-reset/MQ/abc-123");
  await waitForHydration(page);
  const requests = await askForCode(page, "/api/user/password-reset/confirm");
  await stubPage(page, "/profile");

  await fillAndConfirm(page.getByLabel("Nytt passord", { exact: true }), "kaffekopp på brygga");
  await fillAndConfirm(page.getByLabel("Gjenta nytt passord"), "kaffekopp på brygga");
  await page.getByRole("button", { name: "Lagre passord" }).click();
  await fillAndConfirm(page.getByLabel("Kode fra autentiseringsappen"), "654321");
  await page.getByRole("button", { name: "Lagre passord" }).click();

  await page.waitForURL("**/profile");
  expect(requests.at(-1)).toMatchObject({ otp: "654321", uid: "MQ", token: "abc-123" });
});

test.describe("turning it on in Endre profil", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
    await stubApi(page);
  });

  const card = (page: Page) => page.getByRole("region", { name: "Totrinnsbekreftelse" });

  test("scan, confirm with a code, keep the recovery codes", async ({ page }) => {
    let enabled = false;
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({ json: { enabled, recoveryCodesLeft: enabled ? 10 : 0 } }),
    );
    await resolveWith(page, "/api/user/2fa/setup", {
      secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Frikanalen:editor@example.test?secret=x",
      qrCode: QR,
    });
    const codes = ["abcd2345", "efgh6723", "ijkl2345", "mnop6723", "qrst2345"];
    const confirms: unknown[] = [];
    await page.route("**/api/user/2fa/confirm", (route) => {
      confirms.push(route.request().postDataJSON());
      enabled = true;
      return route.fulfill({ status: 201, json: { recoveryCodes: codes } });
    });

    await page.goto("/profile/edit");
    await waitForHydration(page);
    await card(page).getByRole("button", { name: "Slå på totrinnsbekreftelse" }).click();

    await expect(
      card(page).getByRole("img", { name: "QR-kode for autentiseringsappen" }),
    ).toBeVisible();
    await expect(card(page).getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
    await fillAndConfirm(card(page).getByLabel("Kode", { exact: true }), "123456");
    await card(page).getByRole("button", { name: "Bekreft" }).click();

    await expect(card(page).getByText("Totrinnsbekreftelse er slått på.")).toBeVisible();
    for (const code of codes) await expect(card(page).getByText(code)).toBeVisible();
    expect(confirms).toEqual([{ code: "123456" }]);

    await card(page).getByRole("button", { name: "Jeg har tatt vare på dem" }).click();
    await expect(card(page).getByText("Totrinnsbekreftelse er på.")).toBeVisible();
    await expect(card(page).getByText("10 gjenopprettingskoder igjen.")).toBeVisible();
  });

  test("turning it off takes a code", async ({ page }) => {
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({ json: { enabled: true, recoveryCodesLeft: 7 } }),
    );
    const requests = await resolveWith(page, "/api/user/2fa/disable");

    await page.goto("/profile/edit");
    await waitForHydration(page);
    await card(page).getByRole("button", { name: "Slå av" }).click();
    await fillAndConfirm(
      card(page).getByLabel("Kode fra appen eller en gjenopprettingskode"),
      "987654",
    );
    await card(page).getByRole("button", { name: "Slå av" }).click();

    await expect.poll(() => requests).toEqual([{ code: "987654" }]);
  });
});
