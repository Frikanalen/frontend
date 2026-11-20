import { expect, test } from "@playwright/test";
import { resolveWith, stubApi, stubPage } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const ACCEPT = "/api/invitations/good-token/accept";
const member = {
  id: 77,
  name: "Dag Dahl",
  email: "ny@example.test",
  isEditor: false,
  identityConfirmed: false,
};

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test("someone without an account makes one from the link and lands in Studio", async ({ page }) => {
  const requests = await resolveWith(page, ACCEPT, member);
  await stubPage(page, "/organization/3/admin");
  await page.goto("/invitation/good-token");
  await waitForHydration(page);

  await expect(page.getByRole("heading", { name: "Bli med i Havneforeningen" })).toBeVisible();
  await expect(page.getByText("Ada Lovelace har invitert deg")).toBeVisible();
  // The address is the invited one, and not something to type.
  await expect(page.getByText("ny@example.test", { exact: true })).toBeVisible();

  await fillAndConfirm(page.getByLabel("Fornavn"), "Dag");
  await fillAndConfirm(page.getByLabel("Etternavn"), "Dahl");
  await fillAndConfirm(page.getByLabel("Velg et passord"), "kaia-om-kvelden-1987");
  await page.getByRole("button", { name: "Lag bruker og bli med" }).click();

  await expect(page).toHaveURL(/\/organization\/3\/admin$/);
  expect(requests).toEqual([
    { firstName: "Dag", lastName: "Dahl", password: "kaia-om-kvelden-1987" },
  ]);
});

test("a link handed over in person asks for the new member's address", async ({ page }) => {
  const requests = await resolveWith(page, "/api/invitations/link-token/accept", member);
  await stubPage(page, "/organization/3/admin");
  await page.goto("/invitation/link-token");
  await waitForHydration(page);

  await fillAndConfirm(page.getByLabel("E-post (brukernavn)"), "eva@example.test");
  await fillAndConfirm(page.getByLabel("Fornavn"), "Eva");
  await fillAndConfirm(page.getByLabel("Etternavn"), "Eng");
  await fillAndConfirm(page.getByLabel("Velg et passord"), "kaia-om-kvelden-1987");
  await page.getByRole("button", { name: "Lag bruker og bli med" }).click();

  await expect(page).toHaveURL(/\/organization\/3\/admin$/);
  expect(requests).toEqual([
    {
      email: "eva@example.test",
      firstName: "Eva",
      lastName: "Eng",
      password: "kaia-om-kvelden-1987",
    },
  ]);
});

test("someone with an account logs in and comes back to the invitation", async ({ page }) => {
  await page.goto("/invitation/good-token");
  await waitForHydration(page);
  await expect(page.getByRole("link", { name: "Logg inn" }).last()).toHaveAttribute(
    "href",
    "/login?next=%2Finvitation%2Fgood-token",
  );
});

test("a logged-in user joins with one button", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  const requests = await resolveWith(page, ACCEPT, member);
  await stubPage(page, "/organization/3/admin");
  await page.goto("/invitation/good-token");
  await waitForHydration(page);

  await expect(page.getByText("Invitasjonen ble sendt til ny@example.test")).toBeVisible();
  await page.getByRole("button", { name: "Bli med i Havneforeningen" }).click();

  await expect(page).toHaveURL(/\/organization\/3\/admin$/);
  expect(requests).toEqual([{}]);
});

test("a used or expired link says so", async ({ page }) => {
  await page.goto("/invitation/old-token");
  await expect(page.getByRole("heading", { name: "Invitasjonen virker ikke" })).toBeVisible();
});
