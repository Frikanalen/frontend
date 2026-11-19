import { expect, test } from "@playwright/test";

test("prints the organization's own declaration, filled in", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await page.goto("/organization/3/affidavit");

  await expect(page.getByRole("heading", { name: "Redaktørerklæringen" })).toBeVisible();
  const affidavit = page.locator("#affidavit");
  await expect(affidavit.getByText("Havneforeningen")).toBeVisible();
  await expect(affidavit.getByText("971526920")).toBeVisible();
  await expect(affidavit.getByText("+47 22 33 44 55")).toBeVisible();
  await expect(affidavit.getByText("Som redaktør på vegne av min organisasjon")).toBeVisible();
  await expect(page.getByRole("button", { name: "Skriv ut" })).toBeVisible();
});
