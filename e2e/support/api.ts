import type { Page, Route } from "@playwright/test";

/**
 * The suite runs without a Django backend, so every call the page makes is
 * answered here. Anything not explicitly stubbed is failed loudly rather than
 * left to hang, which keeps an unexpected request from looking like a UI bug.
 */
export const stubApi = async (page: Page) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 500, json: {} }));
};

/** Answers a single endpoint with a DRF-shaped error body. */
export const rejectWith = (page: Page, path: string, status: number, body: unknown) =>
  page.route(`**${path}`, (route) => route.fulfill({ status, json: body }));

/** Answers a single endpoint with success, recording each request it receives. */
export const resolveWith = async (page: Page, path: string, body: unknown = {}) => {
  const requests: unknown[] = [];

  await page.route(`**${path}`, (route: Route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: body });
  });

  return requests;
};

/**
 * Serves a placeholder for a page we only care about having navigated to.
 * /profile renders from the backend and would bounce back to / without one.
 */
export const stubPage = (page: Page, path: string) =>
  page.route(`**${path}`, (route) =>
    route.request().resourceType() === "document"
      ? route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<html><body>ok</body></html>",
        })
      : route.continue(),
  );

/** Holds an endpoint open so the in-flight state can be observed. */
export const hangOn = async (page: Page, path: string) => {
  let count = 0;

  await page.route(`**${path}`, () => {
    count += 1;
    // Never fulfilled: the request stays pending for the life of the test.
  });

  return () => count;
};
