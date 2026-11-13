import { expect, test, type Page } from "@playwright/test";
import { hangOn, rejectWith, resolveWith, stubApi } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const USER = "/api/user";
const CHANGE = "/api/user/password";
const RESET = "/api/user/password-reset";

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.goto("/profile/edit");
  await waitForHydration(page);
});

const passwordCard = (page: Page) => page.getByRole("region", { name: "Passord" });

const fillPasswords = async (page: Page, current: string, next: string, repeat = next) => {
  await fillAndConfirm(page.getByLabel("Nåværende passord"), current);
  await fillAndConfirm(page.getByLabel("Nytt passord", { exact: true }), next);
  await fillAndConfirm(page.getByLabel("Gjenta nytt passord"), repeat);
};

test.describe("profile details", () => {
  test("shows the email as the username rather than an editable field", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Endre profil", level: 1 })).toBeVisible();
    const details = page.getByRole("region", { name: "Personopplysninger" });
    await expect(details.getByText("editor@example.test", { exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "E-post" })).toHaveCount(0);
  });

  test("saves only once something changed, and stays on the page", async ({ page }) => {
    const save = page.getByRole("button", { name: "Lagre endringer" });
    await expect(save).toBeDisabled();

    const requests: unknown[] = [];
    await page.route(`**${USER}`, (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      requests.push(route.request().postDataJSON());
      return route.fulfill({
        status: 200,
        json: { firstName: "Testa", lastName: "Editor", phoneNumber: "" },
      });
    });

    await fillAndConfirm(page.getByLabel("Fornavn"), "Testa");
    await save.click();

    await expect(page.getByRole("status")).toHaveText("Lagret");
    await expect(page).toHaveURL(/\/profile\/edit$/);
    expect(requests).toEqual([{ firstName: "Testa", lastName: "Editor", phoneNumber: "" }]);
  });
});

test.describe("password", () => {
  test("changes it with the current one and confirms", async ({ page }) => {
    const requests = await resolveWith(page, CHANGE);

    await fillPasswords(page, "old secret", "a long new password");
    await passwordCard(page).getByRole("button", { name: "Bytt passord" }).click();

    await expect(passwordCard(page).getByRole("status")).toContainText("Passordet er byttet");
    expect(requests).toEqual([
      { currentPassword: "old secret", newPassword: "a long new password" },
    ]);
    await expect(page.getByLabel("Nåværende passord")).toHaveValue("");
  });

  test("catches a mismatch before the API", async ({ page }) => {
    const attempts = await hangOn(page, CHANGE);

    await fillPasswords(page, "old secret", "a long new password", "something else");
    await passwordCard(page).getByRole("button", { name: "Bytt passord" }).click();

    await expect(page.getByText("Passordene er ikke like.")).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test("shows a wrong current password", async ({ page }) => {
    await rejectWith(page, CHANGE, 400, {
      type: "validation_error",
      errors: [
        { code: "invalid", detail: "Ditt gamle passord var feil.", attr: "current_password" },
      ],
    });

    await fillPasswords(page, "not it", "a long new password");
    await passwordCard(page).getByRole("button", { name: "Bytt passord" }).click();

    await expect(passwordCard(page).locator("form").getByRole("alert")).toHaveText(
      "Ditt gamle passord var feil.",
    );
  });

  test("mails a reset link to someone who forgot the current one", async ({ page }) => {
    const requests = await resolveWith(page, RESET, { detail: "ok" });

    await passwordCard(page).getByRole("button", { name: "Send lenke på e-post" }).click();

    await expect(passwordCard(page).getByRole("status")).toContainText("editor@example.test");
    expect(requests).toEqual([{ email: "editor@example.test" }]);
  });
});
