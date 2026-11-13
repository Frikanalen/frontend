import { expect, test, type Page } from "@playwright/test";
import { hangOn, rejectWith, resolveWith, stubApi, stubPage } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const REQUEST = "/api/user/password-reset";
const CONFIRM = "/api/user/password-reset/confirm";

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe("password reset request", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password-reset");
    await waitForHydration(page);
  });

  const submit = (page: Page) => page.getByRole("button", { name: "Send lenke" });

  test("is linked from the login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Glemt passordet?" }).click();
    await page.waitForURL("**/password-reset");
  });

  test("sends the address and says to check the inbox", async ({ page }) => {
    const requests = await resolveWith(page, REQUEST, { detail: "ok" });

    await fillAndConfirm(page.getByLabel("E-post"), "someone@example.com");
    await submit(page).click();

    await expect(page.getByRole("heading", { name: "Sjekk e-posten din" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("someone@example.com");
    expect(requests).toEqual([{ email: "someone@example.com" }]);
  });

  test("says a throttled request in Norwegian", async ({ page }) => {
    await rejectWith(page, REQUEST, 429, { detail: "Request was throttled." });

    await fillAndConfirm(page.getByLabel("E-post"), "someone@example.com");
    await submit(page).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "For mange forsøk. Vent litt og prøv igjen.",
    );
  });
});

test.describe("choosing a new password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password-reset/MQ/abc-123");
    await waitForHydration(page);
  });

  const newPassword = (page: Page) => page.getByLabel("Nytt passord", { exact: true });
  const repeat = (page: Page) => page.getByLabel("Gjenta nytt passord");
  const submit = (page: Page) => page.getByRole("button", { name: "Lagre passord" });

  test("keeps the token out of the Referer header", async ({ page }) => {
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  });

  test("sends uid, token and password, then lands on the profile", async ({ page }) => {
    const requests = await resolveWith(page, CONFIRM);
    await stubPage(page, "/profile");

    await fillAndConfirm(newPassword(page), "a long new password");
    await fillAndConfirm(repeat(page), "a long new password");
    await submit(page).click();

    await page.waitForURL("**/profile");
    expect(requests).toEqual([{ uid: "MQ", token: "abc-123", newPassword: "a long new password" }]);
  });

  test("catches a mismatch before the API", async ({ page }) => {
    const attempts = await hangOn(page, CONFIRM);

    await fillAndConfirm(newPassword(page), "a long new password");
    await fillAndConfirm(repeat(page), "a different password");
    await submit(page).click();

    await expect(page.getByText("Passordene er ikke like.")).toBeVisible();
    expect(attempts()).toBe(0);
  });

  test("offers a new link when the link is used or expired", async ({ page }) => {
    await rejectWith(page, CONFIRM, 400, {
      type: "validation_error",
      errors: [{ code: "invalid", detail: "Lenken er ugyldig eller utløpt.", attr: "token" }],
    });

    await fillAndConfirm(newPassword(page), "a long new password");
    await fillAndConfirm(repeat(page), "a long new password");
    await submit(page).click();

    await expect(page.getByRole("heading", { name: "Lenken virker ikke" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Be om en ny lenke" })).toHaveAttribute(
      "href",
      "/password-reset",
    );
  });

  test("shows the API's verdict on a weak password", async ({ page }) => {
    await rejectWith(page, CONFIRM, 400, {
      type: "validation_error",
      errors: [{ code: "invalid", detail: "Dette passordet er for vanlig.", attr: "new_password" }],
    });

    await fillAndConfirm(newPassword(page), "password123");
    await fillAndConfirm(repeat(page), "password123");
    await submit(page).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Dette passordet er for vanlig.",
    );
  });
});
