import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const INVITATIONS = "/api/organization/3/invitations";

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
      return route.fulfill({
        status: 201,
        json: {
          id: 5,
          email: "ny@example.test",
          createdAt: "2026-11-20T12:00:00Z",
          expiresAt: "2026-12-04T12:00:00Z",
        },
      });
    }
    return route.fulfill({ status: 200, json: [] });
  });
  await page.goto("/organization/3/profile");
  await waitForHydration(page);

  const members = page.getByRole("region", { name: "Medlemmer" });
  await expect(members.getByText("Bo Berg")).toBeVisible();
  await expect(members.getByText("Identitet ikke bekreftet")).toBeVisible();

  await fillAndConfirm(page.getByRole("textbox", { name: "Inviter et medlem" }), "ny@example.test");
  await page.getByRole("button", { name: "Send invitasjon" }).click();

  await expect(page.getByRole("status")).toHaveText("Invitasjonen er sendt til ny@example.test.");
  expect(invited).toEqual([{ email: "ny@example.test" }]);
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
  await expect(page.getByRole("textbox", { name: "Inviter et medlem" })).toHaveCount(0);
});
