import { expect, test, type Page } from "@playwright/test";
import { hangOn, rejectWith, resolveWith, stubApi, stubPage } from "./support/api";
import { fillAndConfirm, fillBeforeHydration, waitForHydration } from "./support/hydration";

const REGISTER = "/api/user/register";

test.beforeEach(async ({ page }) => {
  await stubApi(page);
  await page.goto("/register");
  await waitForHydration(page);
});

const formAlert = (page: Page) => page.locator("form").getByRole("alert");
const submit = (page: Page) => page.getByRole("button", { name: "Registrer deg" });

const fillInForm = async (page: Page) => {
  await fillAndConfirm(page.getByLabel("Epost (brukernavn)"), "ny@example.com");
  await fillAndConfirm(page.getByLabel("Fornavn"), "Kari");
  await fillAndConfirm(page.getByLabel("Etternavn"), "Nordmann");
  await fillAndConfirm(page.getByLabel("Passord"), "korrekt-hest-batteri");
};

test.describe("register form", () => {
  test("uses autocomplete tokens a password manager will offer to save", async ({ page }) => {
    await expect(page.getByLabel("Epost (brukernavn)")).toHaveAttribute("autocomplete", "username");
    await expect(page.getByLabel("Fornavn")).toHaveAttribute("autocomplete", "given-name");
    await expect(page.getByLabel("Etternavn")).toHaveAttribute("autocomplete", "family-name");
    await expect(page.getByLabel("Passord")).toHaveAttribute("autocomplete", "new-password");
  });

  test("gives the email field an email input type", async ({ page }) => {
    await expect(page.getByLabel("Epost (brukernavn)")).toHaveAttribute("type", "email");
  });

  // React Aria's generated ids carry a random prefix that is regenerated on
  // every client-side render, so a form reached by SPA navigation used to look
  // like a brand new form to anything fingerprinting it by field id.
  test("keeps field ids stable when reached by client-side navigation", async ({ page }) => {
    const ids = () =>
      page.locator("form input").evaluateAll((els) => els.map((el) => el.id).sort());

    const onDirectLoad = await ids();
    expect(onDirectLoad).toEqual(["email", "firstName", "lastName", "password"]);

    await page.goto("/login");
    await page.locator('a[href="/register"]').first().click();
    await page.waitForURL("**/register");
    await waitForHydration(page);

    expect(await ids()).toEqual(onDirectLoad);
  });

  test("registers the account and redirects to the profile", async ({ page }) => {
    const requests = await resolveWith(page, REGISTER);
    await stubPage(page, "/profile");

    await fillInForm(page);
    await submit(page).click();

    await page.waitForURL("**/profile");
    expect(requests).toEqual([
      {
        email: "ny@example.com",
        firstName: "Kari",
        lastName: "Nordmann",
        password: "korrekt-hest-batteri",
      },
    ]);
  });

  test("shows the duplicate-email error rather than failing silently", async ({ page }) => {
    await rejectWith(page, REGISTER, 400, { email: ["Denne e-posten er allerede i bruk."] });

    await fillInForm(page);
    await submit(page).click();

    await expect(formAlert(page)).toHaveText("Denne e-posten er allerede i bruk.");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("shows every password complaint the backend returns", async ({ page }) => {
    await rejectWith(page, REGISTER, 400, {
      password: ["Passordet er for kort.", "Passordet er for vanlig."],
    });

    await fillInForm(page);
    await submit(page).click();

    const alert = formAlert(page);
    await expect(alert).toContainText("Passordet er for kort.");
    await expect(alert).toContainText("Passordet er for vanlig.");
  });

  test("reports a server error that carries no usable body", async ({ page }) => {
    await rejectWith(page, REGISTER, 500, {});

    await fillInForm(page);
    await submit(page).click();

    await expect(formAlert(page)).not.toBeEmpty();
  });

  test("does not register the account twice on a double click", async ({ page }) => {
    const attempts = await hangOn(page, REGISTER);

    await fillInForm(page);
    await submit(page).click();

    await expect(submit(page)).toBeDisabled();
    await submit(page).click({ force: true });

    expect(attempts()).toBe(1);
  });

  // A password manager fills as soon as it sees the fields, which can land
  // before the bundle runs. react-hook-form defaultValues used to overwrite
  // the email field during mount, wiping the fill.
  test("keeps a fill that lands before hydration", async ({ page }) => {
    await fillBeforeHydration(page, "/register", {
      email: "manager@example.com",
      password: "filled-by-manager",
    });

    await expect(page.locator('input[name="email"]')).toHaveValue("manager@example.com");
    await expect(page.locator('input[name="password"]')).toHaveValue("filled-by-manager");
  });
});
