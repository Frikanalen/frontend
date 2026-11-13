import { generateKeyPairSync, randomBytes } from "node:crypto";
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

const b64url = (bytes: Buffer) => bytes.toString("base64url");

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

/**
 * Chromium's virtual authenticator, through the DevTools protocol: a
 * platform authenticator (think Touch ID) that says yes by itself.
 * `addPasskey` stores a passkey for localhost on it.
 */
const virtualAuthenticator = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  const addPasskey = async () => {
    const credentialId = randomBytes(16);
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    await cdp.send("WebAuthn.addCredential", {
      authenticatorId,
      credential: {
        credentialId: credentialId.toString("base64"),
        isResidentCredential: true,
        rpId: "localhost",
        privateKey: privateKey.export({ type: "pkcs8", format: "der" }).toString("base64"),
        userHandle: Buffer.from("user-1").toString("base64"),
        signCount: 0,
      },
    });
    return b64url(credentialId);
  };
  return { addPasskey };
};

/** The API says passkeys are switched on in this environment. */
const passkeysOn = (page: Page) =>
  page.route("**/api/user/login/passkey", (route) => route.fulfill({ json: { enabled: true } }));

const requestOptions = (allow: string[] = []) => ({
  challenge: b64url(randomBytes(32)),
  timeout: 60000,
  rpId: "localhost",
  allowCredentials: allow.map((id) => ({ type: "public-key", id })),
  userVerification: allow.length ? "discouraged" : "required",
});

const creationOptions = () => ({
  rp: { name: "Frikanalen", id: "localhost" },
  user: { id: b64url(Buffer.from("user-1")), name: "editor@example.test", displayName: "Editor" },
  challenge: b64url(randomBytes(32)),
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  timeout: 60000,
  excludeCredentials: [],
  authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  attestation: "none",
  extensions: { credProps: true },
});

const method = (over: Record<string, unknown> = {}) => ({
  id: "totp-1",
  kind: "totp",
  name: "Telefonen",
  passkey: null,
  createdAt: "2026-11-01T10:00:00Z",
  lastUsedAt: null,
  ...over,
});

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
    await page.getByRole("button", { name: "Logg inn", exact: true }).click();

    const code = page.getByLabel("Kode fra autentiseringsappen");
    await expect(code).toBeVisible();
    await expect(page.getByRole("button", { name: /sikkerhetsnøkkel/ })).toHaveCount(0);
    await expect(page.locator("form").getByRole("alert")).toHaveCount(0);
    await fillAndConfirm(code, "123456");
    await page.getByRole("button", { name: "Logg inn", exact: true }).click();

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
    await page.getByRole("button", { name: "Logg inn", exact: true }).click();
    await expect(page.getByLabel("Kode fra autentiseringsappen")).toBeVisible();

    await page.unroute("**/api/user/login");
    await rejectWith(page, "/api/user/login", 400, {
      type: "validation_error",
      errors: [{ code: "invalid", detail: "Koden stemmer ikke.", attr: "otp" }],
    });
    await fillAndConfirm(page.getByLabel("Kode fra autentiseringsappen"), "000000");
    await page.getByRole("button", { name: "Logg inn", exact: true }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("Koden stemmer ikke.");
  });
});

test.describe("passkeys and security keys at login", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "virtual authenticator is Chromium's");

  const stubPasskeyLogin = async (page: Page) => {
    await stubApi(page);
    await passkeysOn(page);
    await page.route("**/api/user/login/passkey/begin", (route) =>
      route.fulfill({ json: requestOptions() }),
    );
    const completes = await resolveWith(page, "/api/user/login/passkey/complete", {
      email: "editor@example.test",
    });
    await stubPage(page, "/profile");
    return completes;
  };

  test("logs in with the passkey button, no email or password", async ({ page }) => {
    const completes = await stubPasskeyLogin(page);
    const authenticator = await virtualAuthenticator(page);
    await page.goto("/login");
    await waitForHydration(page);
    // Stored only now, so the autofill offer that started with the page
    // finds nothing and the button does the work.
    const credentialId = await authenticator.addPasskey();

    await page.getByRole("button", { name: "Logg inn med passkey" }).click();

    await page.waitForURL("**/profile");
    expect(completes).toHaveLength(1);
    expect(completes[0]).toMatchObject({ credential: { id: credentialId, type: "public-key" } });
  });

  test("switched off, the login page does not offer passkeys", async ({ page }) => {
    await stubApi(page);
    await page.route("**/api/user/login/passkey", (route) =>
      route.fulfill({ json: { enabled: false } }),
    );
    const begins = await resolveWith(page, "/api/user/login/passkey/begin", requestOptions());
    await page.goto("/login");
    await waitForHydration(page);

    await expect(page.getByLabel("E-post")).toBeVisible();
    await expect(page.getByRole("button", { name: "Logg inn med passkey" })).toHaveCount(0);
    expect(begins).toEqual([]);
  });

  test("offers the passkey in the email field's autofill", async ({ page }) => {
    const completes = await stubPasskeyLogin(page);
    const authenticator = await virtualAuthenticator(page);
    const credentialId = await authenticator.addPasskey();

    // The virtual authenticator picks the offered passkey by itself.
    await page.goto("/login");

    await page.waitForURL("**/profile", { timeout: 60_000 });
    expect(completes[0]).toMatchObject({ credential: { id: credentialId } });
  });

  test("password, then a security key instead of a code", async ({ page }) => {
    await stubApi(page);
    await passkeysOn(page);
    const credentialId = await (await virtualAuthenticator(page)).addPasskey();
    const logins: unknown[] = [];
    await page.route("**/api/user/login", (route) => {
      logins.push(route.request().postDataJSON());
      return logins.length === 1
        ? route.fulfill({ status: 400, json: otpRequired })
        : route.fulfill({ json: {} });
    });
    await page.route("**/api/user/2fa/webauthn/begin", (route) =>
      route.fulfill({ json: requestOptions([credentialId]) }),
    );
    const completes: unknown[] = [];
    await page.route("**/api/user/2fa/webauthn/complete", (route) => {
      completes.push(route.request().postDataJSON());
      return route.fulfill({ status: 204 });
    });
    await stubPage(page, "/profile");
    await page.goto("/login");
    await waitForHydration(page);

    await fillAndConfirm(page.getByLabel("E-post"), "someone@example.com");
    await fillAndConfirm(page.getByLabel("Passord"), "a long secret phrase");
    await page.getByRole("button", { name: "Logg inn", exact: true }).click();
    await page.getByRole("button", { name: "Bruk sikkerhetsnøkkel eller passkey" }).click();

    await page.waitForURL("**/profile");
    expect(completes).toHaveLength(1);
    expect(logins).toEqual([
      { email: "someone@example.com", password: "a long secret phrase" },
      { email: "someone@example.com", password: "a long secret phrase" },
    ]);
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

test.describe("sign-in methods in Endre profil", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
    await stubApi(page);
  });

  const card = (page: Page) =>
    page.getByRole("region", { name: "Innlogging og totrinnsbekreftelse" });

  test("switched off, only an app can be added", async ({ page }) => {
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({
        json: {
          enabled: false,
          recoveryCodesLeft: 0,
          verified: false,
          methods: [],
          passkeys: false,
        },
      }),
    );
    await page.goto("/profile/edit");
    await waitForHydration(page);

    await expect(
      card(page).getByRole("button", { name: "Legg til autentiseringsapp" }),
    ).toBeVisible();
    await expect(card(page).getByRole("button", { name: /passkey/ })).toHaveCount(0);
  });

  test("add an app: scan, confirm with a code, keep the recovery codes", async ({ page }) => {
    let methods: unknown[] = [];
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({
        json: {
          enabled: methods.length > 0,
          recoveryCodesLeft: methods.length ? 10 : 0,
          verified: methods.length > 0,
          methods,
        },
      }),
    );
    const setups = await resolveWith(page, "/api/user/2fa/totp/setup", {
      secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Frikanalen:editor@example.test?secret=x",
      qrCode: QR,
    });
    const codes = ["abcd2345", "efgh6723", "ijkl2345", "mnop6723", "qrst2345"];
    const confirms: unknown[] = [];
    await page.route("**/api/user/2fa/totp/confirm", (route) => {
      confirms.push(route.request().postDataJSON());
      methods = [method()];
      return route.fulfill({
        status: 201,
        json: { method: methods[0], recoveryCodes: codes },
      });
    });

    await page.goto("/profile/edit");
    await waitForHydration(page);
    await card(page).getByRole("button", { name: "Legg til autentiseringsapp" }).click();
    await fillAndConfirm(card(page).getByLabel("Navn, så du kjenner den igjen"), "Telefonen");
    await card(page).getByRole("button", { name: "Fortsett" }).click();

    await expect(
      card(page).getByRole("img", { name: "QR-kode for autentiseringsappen" }),
    ).toBeVisible();
    await expect(card(page).getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
    await fillAndConfirm(card(page).getByLabel("Kode", { exact: true }), "123456");
    await card(page).getByRole("button", { name: "Bekreft" }).click();

    await expect(card(page).getByText("Totrinnsbekreftelse er slått på.")).toBeVisible();
    for (const code of codes) await expect(card(page).getByText(code)).toBeVisible();
    expect(setups).toEqual([{ name: "Telefonen" }]);
    expect(confirms).toEqual([{ code: "123456" }]);

    await card(page).getByRole("button", { name: "Jeg har tatt vare på dem" }).click();
    await expect(card(page).getByText("Totrinnsbekreftelse er på.")).toBeVisible();
    await expect(card(page).getByText("Telefonen")).toBeVisible();
    await expect(card(page).getByText("10 gjenopprettingskoder igjen.")).toBeVisible();
  });

  test("an unverified session confirms before it can change anything", async ({ page }) => {
    let verified = false;
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({
        json: { enabled: true, recoveryCodesLeft: 7, verified, methods: [method()] },
      }),
    );
    const verifies: unknown[] = [];
    await page.route("**/api/user/2fa/verify", (route) => {
      verifies.push(route.request().postDataJSON());
      verified = true;
      return route.fulfill({ status: 204 });
    });

    await page.goto("/profile/edit");
    await waitForHydration(page);
    await expect(card(page).getByText("Telefonen")).toBeVisible();
    await expect(card(page).getByRole("button", { name: "Fjern" })).toHaveCount(0);
    await expect(card(page).getByRole("button", { name: /Legg til/ })).toHaveCount(0);

    await fillAndConfirm(
      card(page).getByLabel("Kode fra appen eller en gjenopprettingskode"),
      "987654",
    );
    await card(page).getByRole("button", { name: "Bekreft" }).click();

    await expect(card(page).getByRole("button", { name: "Fjern" })).toBeVisible();
    expect(verifies).toEqual([{ code: "987654" }]);
  });

  test("removing the last method warns that two-factor goes off", async ({ page }) => {
    await page.route("**/api/user/2fa", (route) =>
      route.fulfill({
        json: { enabled: true, recoveryCodesLeft: 7, verified: true, methods: [method()] },
      }),
    );
    const deletes: string[] = [];
    await page.route("**/api/user/2fa/methods/*", (route) => {
      deletes.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      return route.fulfill({ status: 204 });
    });

    await page.goto("/profile/edit");
    await waitForHydration(page);
    await card(page).getByRole("button", { name: "Fjern" }).click();
    await expect(card(page).getByText(/totrinnsbekreftelse slås av/)).toBeVisible();
    await card(page).getByRole("button", { name: "Fjern" }).click();

    await expect.poll(() => deletes).toEqual(["DELETE /api/user/2fa/methods/totp-1"]);
  });

  test.describe("with a passkey", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "virtual authenticator is Chromium's",
    );

    test("add a passkey next to an app", async ({ page }) => {
      await virtualAuthenticator(page);
      let methods: unknown[] = [method()];
      await page.route("**/api/user/2fa", (route) =>
        route.fulfill({
          json: { enabled: true, recoveryCodesLeft: 10, verified: true, methods, passkeys: true },
        }),
      );
      await page.route("**/api/user/2fa/webauthn/register/begin", (route) =>
        route.fulfill({ json: creationOptions() }),
      );
      const completes: Record<string, unknown>[] = [];
      await page.route("**/api/user/2fa/webauthn/register/complete", (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        completes.push(body);
        const added = method({
          id: "webauthn-1",
          kind: "webauthn",
          name: body.name,
          passkey: true,
          createdAt: "2026-11-13T17:00:00Z",
        });
        methods = [...methods, added];
        return route.fulfill({ status: 201, json: { method: added, recoveryCodes: null } });
      });

      await page.goto("/profile/edit");
      await waitForHydration(page);
      await card(page)
        .getByRole("button", { name: "Legg til passkey eller sikkerhetsnøkkel" })
        .click();
      await fillAndConfirm(card(page).getByLabel("Navn, så du kjenner den igjen"), "MacBook");
      await card(page).getByRole("button", { name: "Fortsett" }).click();

      await expect(card(page).getByText("MacBook")).toBeVisible();
      await expect(card(page).getByText("Passkey, logger inn uten passord")).toBeVisible();
      expect(completes).toHaveLength(1);
      expect(completes[0]).toMatchObject({
        name: "MacBook",
        credential: { type: "public-key", response: { attestationObject: expect.any(String) } },
      });
      // A second method keeps the codes there were: none shown again.
      await expect(card(page).getByText("Gjenopprettingskoder", { exact: true })).toHaveCount(0);
    });
  });
});
