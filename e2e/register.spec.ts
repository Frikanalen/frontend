import { expect, test, type Page } from "@playwright/test";
import { hangOn, rejectWith, resolveWith, stubApi, stubPage } from "./support/api";

const REGISTER = "/api/user/register";

test.beforeEach(async ({ page }) => {
  await stubApi(page);
  await page.goto("/register");
});

const formAlert = (page: Page) => page.locator("form").getByRole("alert");
const submit = (page: Page) => page.getByRole("button", { name: "Registrer deg" });

const fillInForm = async (page: Page) => {
  await page.getByLabel("Epost (brukernavn)").fill("ny@example.com");
  await page.getByLabel("Fornavn").fill("Kari");
  await page.getByLabel("Etternavn").fill("Nordmann");
  await page.getByLabel("Passord").fill("korrekt-hest-batteri");
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
});
