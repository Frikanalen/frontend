import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const INVITATIONS = "/api/organization/3/invitations";
const LINK = "http://localhost:3100/invitation/abc";
// A real one-pixel SVG, so the QR image loads.
const QR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
  ).toString("base64");
const CREATED = {
  id: 5,
  email: "ny@example.test",
  createdAt: "2026-11-20T12:00:00Z",
  expiresAt: "2026-12-04T12:00:00Z",
  link: LINK,
  qrCode: QR,
};

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test("the editor sees the members and invites by e-mail", async ({ page, baseURL }) => {
  // Staff manage like the editor; the mock organization has no editor.
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  const invited: unknown[] = [];
  await page.route(`**/api/organization/3/members`, (route) =>
    route.fulfill({
      status: 200,
      json: [
        {
          id: 42,
          name: "Test Editor",
          email: "editor@example.test",
          isEditor: true,
          identityConfirmed: true,
        },
        {
          id: 43,
          name: "Bo Berg",
          email: "bo@example.test",
          isEditor: false,
          identityConfirmed: false,
        },
      ],
    }),
  );
  await page.route(`**${INVITATIONS}`, (route) => {
    if (route.request().method() === "POST") {
      invited.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: CREATED });
    }
    return route.fulfill({ status: 200, json: [] });
  });
  await page.goto("/organization/3/profile");
  await waitForHydration(page);

  const members = page.getByRole("region", { name: "Medlemmer" });
  await expect(members.getByText("Bo Berg")).toBeVisible();
  await expect(members.getByText("Identitet ikke bekreftet")).toBeVisible();

  await fillAndConfirm(page.getByRole("textbox", { name: "E-postadresse" }), "ny@example.test");
  await page.getByRole("button", { name: "Send på e-post" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Invitasjonen er sendt til ny@example.test.",
  );
  // The link is offered as well, to share another way.
  await expect(page.getByRole("textbox", { name: "Invitasjonslenke" })).toHaveValue(LINK);
  expect(invited).toEqual([{ email: "ny@example.test" }]);
});

test("the editor makes a link to copy or show as a QR code", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  // Clipboard permissions differ per browser, so the clipboard is stood in
  // for: what matters is that the link is what gets written.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          (window as unknown as { copied: string }).copied = text;
          return Promise.resolve();
        },
      },
    });
  });
  const invited: unknown[] = [];
  await page.route(`**/api/organization/3/members`, (route) =>
    route.fulfill({ status: 200, json: [] }),
  );
  await page.route(`**${INVITATIONS}`, (route) => {
    if (route.request().method() === "POST") {
      invited.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: { ...CREATED, email: "" } });
    }
    return route.fulfill({ status: 200, json: [] });
  });
  await page.goto("/organization/3/profile");
  await waitForHydration(page);

  await page.getByRole("button", { name: "Lag lenke" }).click();
  await expect(page.getByRole("status")).toContainText("Invitasjonen er klar.");
  await expect(page.getByRole("textbox", { name: "Invitasjonslenke" })).toHaveValue(LINK);
  expect(invited).toEqual([{}]);

  await page.getByRole("button", { name: "Kopier" }).click();
  await expect(page.getByRole("button", { name: "Kopiert" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(LINK);

  await page.getByRole("button", { name: "Vis QR-kode" }).click();
  await expect(page.getByRole("img", { name: "QR-kode med invitasjonslenken" })).toBeVisible();
});

test("a member sees the list but cannot invite", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await page.route(`**/api/organization/3/members`, (route) =>
    route.fulfill({
      status: 200,
      json: [
        {
          id: 7,
          name: "Ada Lovelace",
          email: "ada@example.test",
          isEditor: true,
          identityConfirmed: true,
        },
        {
          id: 42,
          name: "Test Editor",
          email: "editor@example.test",
          isEditor: false,
          identityConfirmed: true,
        },
      ],
    }),
  );
  await page.goto("/organization/3/profile");
  await waitForHydration(page);

  await expect(page.getByRole("button", { name: "Forlat organisasjonen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lag lenke" })).toHaveCount(0);
});
