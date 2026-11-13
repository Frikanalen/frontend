import { expect, test, type Page } from "@playwright/test";
import { rejectWith, resolveWith, stubApi } from "./support/api";
import { fillAndConfirm, waitForHydration } from "./support/hydration";

const ORGNR = "971526920";
const LOOKUP = `/api/organization/brreg/${ORGNR}`;

const entity = {
  orgnr: ORGNR,
  name: "TESTFORENINGEN",
  organizationForm: "Forening/lag/innretning",
  homepage: "https://www.testforeningen.no",
  purpose: "Foreningen skal lage lokal-TV.",
  streetAddress: "Testgata 1\n0150 OSLO",
  postalAddress: "Postboks 1\n0101 OSLO",
  bankrupt: false,
  beingDissolved: false,
};

const fetchButton = (page: Page) => page.getByRole("button", { name: "Hent fra Brønnøysund" });

test.beforeEach(async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "e2e-member", value: "1", url: baseURL! }]);
  await stubApi(page);
  await page.goto("/organization/register");
  await waitForHydration(page);
});

test("fills the form from Enhetsregisteret", async ({ page }) => {
  await resolveWith(page, LOOKUP, entity);

  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), "971 526 920");
  await fetchButton(page).click();

  await expect(page.getByText("Hentet fra Enhetsregisteret")).toBeVisible();
  await expect(page.getByLabel("Organisasjonens navn")).toHaveValue("TESTFORENINGEN");
  await expect(page.getByLabel("Organisasjonens nettside")).toHaveValue(
    "https://www.testforeningen.no",
  );
  await expect(page.getByLabel("En kort beskrivelse av organisasjonen")).toHaveValue(
    "Foreningen skal lage lokal-TV.",
  );
  await expect(page.getByLabel("Besøksadresse")).toHaveValue("Testgata 1\n0150 OSLO");
  await expect(page.getByLabel("Postadresse")).toHaveValue("Postboks 1\n0101 OSLO");
});

test("asks for a long purpose to be shortened", async ({ page }) => {
  await resolveWith(page, LOOKUP, { ...entity, purpose: "Formål. ".repeat(40) });

  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), ORGNR);
  await fetchButton(page).click();

  await expect(page.getByText("Høyst 255 tegn. Kort ned teksten.")).toBeVisible();
});

test("waits for the button, then replaces what is there", async ({ page }) => {
  let asked = 0;
  await page.route(`**${LOOKUP}`, (route) => {
    asked += 1;
    return route.fulfill({ status: 200, json: entity });
  });

  await fillAndConfirm(page.getByLabel("Organisasjonens navn"), "Testforeningen");
  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), ORGNR);
  await expect(page.getByLabel("Organisasjonens navn")).toHaveValue("Testforeningen");
  expect(asked).toBe(0);

  await fetchButton(page).click();

  await expect(page.getByLabel("Organisasjonens navn")).toHaveValue("TESTFORENINGEN");
  expect(asked).toBe(1);
});

test("catches a mistyped number without asking the register", async ({ page }) => {
  let asked = false;
  await page.route("**/api/organization/brreg/**", (route) => {
    asked = true;
    return route.fulfill({ status: 200, json: entity });
  });

  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), "971526921");

  await expect(page.getByText("Nummeret stemmer ikke")).toBeVisible();
  await expect(fetchButton(page)).toBeDisabled();
  expect(asked).toBe(false);
});

test("says so when the register has no such organization", async ({ page }) => {
  await rejectWith(page, LOOKUP, 404, {});

  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), ORGNR);
  await fetchButton(page).click();

  await expect(page.getByText("Fant ingen organisasjon med dette nummeret")).toBeVisible();
});

test("sends the number along with the new organization", async ({ page }) => {
  await resolveWith(page, LOOKUP, entity);
  const created = await resolveWith(page, "/api/organization", { id: 99 });
  await page.route("**/organization/99/start", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html>ok</html>" }),
  );

  await fillAndConfirm(page.getByLabel("Organisasjonsnummer"), "971 526 920");
  await fetchButton(page).click();
  await expect(page.getByLabel("Organisasjonens navn")).toHaveValue("TESTFORENINGEN");
  await page.getByRole("button", { name: "Opprett organisasjon" }).click();

  await expect.poll(() => created.length).toBe(1);
  expect(created[0]).toMatchObject({
    orgnr: ORGNR,
    name: "TESTFORENINGEN",
    description: "Foreningen skal lage lokal-TV.",
    streetAddress: "Testgata 1\n0150 OSLO",
  });
});
