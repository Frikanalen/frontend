import { expect, test, type Page } from "@playwright/test";
import { hangOn, rejectWith, resolveWith, stubApi, stubPage } from "./support/api";
import { fillAndConfirm, fillBeforeHydration, waitForHydration } from "./support/hydration";

const LOGIN = "/api/user/login";

test.beforeEach(async ({ page }) => {
  await stubApi(page);
  await page.goto("/login");
  await waitForHydration(page);
});

const email = (page: Page) => page.getByLabel("E-post");
const password = (page: Page) => page.getByLabel("Passord");
const formAlert = (page: Page) => page.locator("form").getByRole("alert");
const submit = (page: Page) => page.getByRole("button", { name: "Logg inn" });

const fillInCredentials = async (page: Page) => {
  await fillAndConfirm(email(page), "someone@example.com");
  await fillAndConfirm(password(page), "hunter2");
};

test.describe("login form", () => {
  test("marks the credential fields up so password managers recognise them", async ({ page }) => {
    // Regression test for #10: `password` is not a valid autocomplete token,
    // and a section-* prefix hides the credential from the register form.
    await expect(email(page)).toHaveAttribute("autocomplete", "username");
    await expect(password(page)).toHaveAttribute("autocomplete", "current-password");
    await expect(password(page)).toHaveAttribute("type", "password");
  });

  test("submits the credentials and redirects to the profile", async ({ page }) => {
    const requests = await resolveWith(page, LOGIN);
    await stubPage(page, "/profile");

    await fillInCredentials(page);
    await submit(page).click();

    await page.waitForURL("**/profile");
    expect(requests).toEqual([{ email: "someone@example.com", password: "hunter2" }]);
  });

  test("announces a rejected login instead of failing silently", async ({ page }) => {
    await rejectWith(page, LOGIN, 400, { detail: "Feil brukernavn eller passord." });

    await fillInCredentials(page);
    await submit(page).click();

    await expect(formAlert(page)).toHaveText("Feil brukernavn eller passord.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("renders field errors as text rather than [object Object]", async ({ page }) => {
    await rejectWith(page, LOGIN, 400, { email: ["Ukjent konto."] });

    await fillInCredentials(page);
    await submit(page).click();

    const alert = formAlert(page);
    await expect(alert).toHaveText("Ukjent konto.");
    await expect(alert).not.toContainText("[object Object]");
  });

  test("clears a stale error once the next attempt succeeds", async ({ page }) => {
    await rejectWith(page, LOGIN, 400, { detail: "Feil passord." });

    await fillInCredentials(page);
    await submit(page).click();
    await expect(formAlert(page)).toBeVisible();

    await page.unroute(`**${LOGIN}`);
    await resolveWith(page, LOGIN);
    await stubPage(page, "/profile");
    await submit(page).click();

    await expect(formAlert(page)).toHaveCount(0);
  });

  test("does not fire a second request while the first is in flight", async ({ page }) => {
    const attempts = await hangOn(page, LOGIN);

    await fillInCredentials(page);
    await submit(page).click();

    await expect(submit(page)).toBeDisabled();
    await submit(page).click({ force: true });
    await submit(page).click({ force: true });

    expect(attempts()).toBe(1);
  });

  test("rejects a malformed email before reaching the API", async ({ page }) => {
    const attempts = await hangOn(page, LOGIN);

    await fillAndConfirm(email(page), "not-an-email");
    await fillAndConfirm(password(page), "hunter2");
    await submit(page).click();

    // type="email" means the browser's own constraint validation stops this
    // one; the zod schema behind it covers callers that bypass the widget.
    await expect(email(page)).toHaveJSProperty("validity.valid", false);
    expect(attempts()).toBe(0);
  });

  test("does not submit an empty form", async ({ page }) => {
    const attempts = await hangOn(page, LOGIN);

    await submit(page).click();

    expect(attempts()).toBe(0);
  });

  // A password manager fills as soon as it sees the fields, which can land
  // before the bundle runs. react-hook-form defaultValues used to overwrite
  // the email field during mount, wiping the fill.
  test("keeps a fill that lands before hydration", async ({ page }) => {
    await fillBeforeHydration(page, "/login", {
      email: "manager@example.com",
      password: "filled-by-manager",
    });

    await expect(page.locator('input[name="email"]')).toHaveValue("manager@example.com");
    await expect(page.locator('input[name="password"]')).toHaveValue("filled-by-manager");
  });
});
