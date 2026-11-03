import { expect, type Locator, type Page, type Route } from "@playwright/test";

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
  // `waitUntil: "commit"` alone leaves a race: on a fast browser, Next can
  // hydrate the form before the test fills it. Hold its client bundles until
  // the inputs are filled so this reliably exercises a pre-hydration fill.
  const pendingScripts: Route[] = [];
  let allowScripts = false;
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, async (route) => {
    if (allowScripts) {
      await route.continue();
    } else {
      pendingScripts.push(route);
    }
  });

  await page.goto(path, { waitUntil: "commit" });
  await page.waitForSelector("form input", { state: "attached" });
  for (const [name, value] of Object.entries(values)) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }

  allowScripts = true;
  await Promise.all(pendingScripts.map((route) => route.continue()));
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
