import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";
import { waitForHydration } from "./support/hydration";

const page_ = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-staff", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.route("**/api/recurring-slots?**", (route) =>
    route.fulfill({ status: 200, json: page_([]) }),
  );
});

test.describe("giving airtime directly", () => {
  test("staff give an organization airtime, and get a link to its list", async ({ page }) => {
    const posts: Record<string, unknown>[] = [];
    await page.route("**/api/grants", (route) => {
      const body = route.request().postDataJSON();
      posts.push(body);
      return route.fulfill({
        status: 201,
        json: {
          id: 900,
          organization: { id: 3, name: "Havneforeningen" },
          starttime: body.starttime,
          endtime: body.endtime,
          state: "open",
          locksAt: body.starttime,
          lockExempt: true,
          originSlot: null,
          recipe: null,
          items: [],
          canEdit: true,
        },
      });
    });
    await page.goto("/schedule/plan");
    await page.getByRole("link", { name: "Gi sendetid" }).click();
    await waitForHydration(page);
    await expect(page.getByRole("heading", { name: "Gi sendetid", level: 1 })).toBeVisible();

    const give = page.getByRole("button", { name: "Gi sendetid" });
    await expect(give).toBeDisabled();
    await page
      .getByRole("form", { name: "Gi sendetid" })
      .getByRole("combobox")
      .selectOption({ index: 1 });
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/give-airtime.png` });
    await give.click();

    await expect(page.getByRole("status")).toContainText("har fått sendetid");
    await expect(page.getByRole("link", { name: "Åpne sendelisten" })).toHaveAttribute(
      "href",
      "/organization/3/schedule/900",
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ organization: 3, recipe: { kind: "uploads" } });
    const length =
      Date.parse(posts[0].endtime as string) - Date.parse(posts[0].starttime as string);
    expect(length).toBe(60 * 60 * 1000);
    // Given once: the button rests until something changes.
    await expect(give).toBeDisabled();
  });

  test("shows why the server refused", async ({ page }) => {
    await page.route("**/api/grants", (route) =>
      route.fulfill({
        status: 400,
        json: {
          type: "validation_error",
          errors: [{ code: "invalid", detail: "Overlaps the grant X.", attr: "non_field_errors" }],
        },
      }),
    );
    await page.goto("/schedule/plan/give?organization=3");
    await waitForHydration(page);

    await expect(page.getByRole("form", { name: "Gi sendetid" }).getByRole("combobox")).toHaveValue(
      "3",
    );
    await page.getByRole("button", { name: "Gi sendetid" }).click();

    await expect(page.getByText("Overlaps the grant X.")).toBeVisible();
  });
});
