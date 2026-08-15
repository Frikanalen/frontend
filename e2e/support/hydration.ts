import { expect, type Locator, type Page } from "@playwright/test";

/**
 * react-hook-form writes its defaultValues into the inputs when the form
 * mounts, so anything typed before hydration finishes is silently wiped. Wait
 * for the client bundle to settle before touching a field, or a fast fill
 * races the reset and the field ends up empty.
 */
export const waitForHydration = async (page: Page) => {
  await page.waitForLoadState("networkidle");
};

/**
 * Loads a page and fills fields before the client bundle runs - the window an
 * eager password manager fills in. Anything the form clobbers during mount
 * shows up as an empty field afterwards.
 */
export const fillBeforeHydration = async (
  page: Page,
  path: string,
  values: Record<string, string>,
) => {
  await page.goto(path, { waitUntil: "commit" });
  await page.waitForSelector("form input", { state: "attached" });
  await page.evaluate((pairs) => {
    for (const [name, value] of Object.entries(pairs)) {
      const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
      if (!el) continue;
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, values);
  await page.waitForLoadState("networkidle");
};

/**
 * Fills a field and confirms the value survived. Without the assertion a lost
 * race shows up much later as a confusing "required field is empty" failure
 * rather than pointing at the fill itself.
 */
export const fillAndConfirm = async (field: Locator, value: string) => {
  await field.fill(value);
  await expect(field).toHaveValue(value);
};
