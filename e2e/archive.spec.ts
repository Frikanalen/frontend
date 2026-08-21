import { expect, test, type Page } from "@playwright/test";
import { stubApi, stubPage } from "./support/api";
import { waitForHydration } from "./support/hydration";

const VIDEOS = "**/api/videos**";

// Inline so the suggestion thumbnails resolve without leaving the browser;
// a remote URL would just be a failed request the test has to wait out.
const THUMBNAIL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const MUSIKK = { id: 622320, name: "Uka-TV 17.02 - Musikk", organization: "UkaTV 09" };
const BAZAR = { id: 623283, name: "Bazar Børud spesial", organization: "Norea Mediemisjon" };

const asVideo = ({ id, name, organization }: typeof MUSIKK) => ({
  id,
  name,
  largeThumbnailUrl: THUMBNAIL,
  organization: { id: 54, name: organization },
});

/**
 * Answers the suggestion endpoint and records the URLs it was asked for, so a
 * test can check what the search box actually sent as well as what it drew.
 */
const stubSuggestions = async (page: Page, videos: (typeof MUSIKK)[]) => {
  const urls: string[] = [];

  await page.route(VIDEOS, (route) => {
    urls.push(route.request().url());
    return route.fulfill({
      status: 200,
      json: { count: videos.length, next: null, previous: null, results: videos.map(asVideo) },
    });
  });

  return urls;
};

const searchBox = (page: Page) => page.getByRole("combobox", { name: "Søk i arkivet" });

/**
 * The search box's own live region. Scoped to the search landmark because a
 * results page carries a second status region for the hit count.
 */
const suggestionStatus = (page: Page) => page.locator("search").getByRole("status");

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe("archive search", () => {
  test("suggests matching videos, with a thumbnail and the organization behind each", async ({
    page,
  }) => {
    const urls = await stubSuggestions(page, [MUSIKK, BAZAR]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");

    const suggestion = page.getByRole("option", { name: new RegExp(MUSIKK.name) });
    await expect(suggestion).toBeVisible();
    // alt="" on purpose - the title beside it already names the video - so the
    // thumbnail is decorative and carries no img role to look it up by.
    await expect(suggestion.locator("img")).toHaveAttribute("src", THUMBNAIL);
    await expect(suggestion).toContainText(MUSIKK.organization);
    await expect(page.getByRole("option", { name: new RegExp(BAZAR.name) })).toBeVisible();

    expect(urls.at(-1)).toContain("q=musikk");
  });

  test("leaves a single letter alone rather than suggesting half the archive", async ({ page }) => {
    const urls = await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("m");

    await expect(page.getByRole("listbox")).toBeHidden();
    expect(urls).toEqual([]);
  });

  test("searches for the typed text on Enter, and keeps it in the field", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    await searchBox(page).press("Enter");

    await page.waitForURL("**/video?q=musikk");
    await expect(searchBox(page)).toHaveValue("musikk");
  });

  test("opens the arrowed-to suggestion on Enter instead of searching", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK, BAZAR]);
    await stubPage(page, `/video/${BAZAR.id}`);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    await expect(page.getByRole("option", { name: new RegExp(BAZAR.name) })).toBeVisible();

    await searchBox(page).press("ArrowDown");
    await searchBox(page).press("ArrowDown");
    await searchBox(page).press("Enter");

    await page.waitForURL(`**/video/${BAZAR.id}`);
  });

  test("opens a suggestion that is clicked", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await stubPage(page, `/video/${MUSIKK.id}`);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    await page.getByRole("option", { name: new RegExp(MUSIKK.name) }).click();

    await page.waitForURL(`**/video/${MUSIKK.id}`);
  });

  test("offers the whole search as the last row of the list", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    await page.getByRole("option", { name: "Vis alle treff på «musikk»" }).click();

    await page.waitForURL("**/video?q=musikk");
  });

  test("says so when nothing matches, rather than showing an empty panel", async ({ page }) => {
    await stubSuggestions(page, []);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("finnesikke");

    // Drawn for people who can see the panel, and announced for people who
    // can't. The drawn copy is aria-hidden so it isn't read out twice.
    await expect(suggestionStatus(page)).toHaveText("Ingen treff på «finnesikke».");
    await expect(page.locator("p[aria-hidden]")).toContainText("Ingen treff på «finnesikke».");
  });

  test("announces how many suggestions arrived", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK, BAZAR]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");

    await expect(suggestionStatus(page)).toHaveText("2 forslag");
  });

  test("puts the field ahead of its own submit button in the tab order", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    // Asserted as document order rather than by pressing Tab, because WebKit
    // skips buttons in the tab ring unless macOS "keyboard navigation" is
    // switched on. Document order is what decides the order wherever Tab does
    // reach them.
    const buttonFollowsField = await page.locator("form").evaluate((form) => {
      const field = form.querySelector('input[name="q"]')!;
      const button = form.querySelector('button[type="submit"]')!;

      return Boolean(field.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING);
    });

    expect(buttonFollowsField).toBe(true);
  });

  test("wires the combobox to the listbox only while the listbox exists", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await expect(searchBox(page)).toHaveAttribute("aria-expanded", "false");
    await expect(searchBox(page)).not.toHaveAttribute("aria-controls", /./);

    await searchBox(page).fill("musikk");

    await expect(searchBox(page)).toHaveAttribute("aria-expanded", "true");
    const listboxId = await page.getByRole("listbox").getAttribute("id");
    await expect(searchBox(page)).toHaveAttribute("aria-controls", listboxId!);
  });

  test("points aria-activedescendant at the arrowed-to option", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK, BAZAR]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    // Waiting for the list to land first: the debounce releases the highlight
    // when a new query arrives, so arrowing before then is undone by design.
    await expect(page.getByRole("option", { name: new RegExp(BAZAR.name) })).toBeVisible();
    await expect(searchBox(page)).not.toHaveAttribute("aria-activedescendant", /./);

    await searchBox(page).press("ArrowDown");

    const active = page.getByRole("option", { name: new RegExp(MUSIKK.name) });
    await expect(active).toHaveAttribute("aria-selected", "true");
    await expect(searchBox(page)).toHaveAttribute(
      "aria-activedescendant",
      (await active.getAttribute("id"))!,
    );
    // APG marks only the active option; "false" on every other row makes
    // several screen readers announce "not selected" down the whole list.
    await expect(page.getByRole("option", { name: new RegExp(BAZAR.name) })).not.toHaveAttribute(
      "aria-selected",
      /./,
    );
  });

  test("does not suggest against a results page it was handed a query for", async ({ page }) => {
    const urls = await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video?q=musikk");
    await waitForHydration(page);

    // The field shows the query, but nothing was asked of it yet: no request,
    // and nothing announced about a list that is not on screen.
    await expect(searchBox(page)).toHaveValue("musikk");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(suggestionStatus(page)).toHaveText("");
    expect(urls).toEqual([]);

    await searchBox(page).click();

    await expect(page.getByRole("option", { name: new RegExp(MUSIKK.name) })).toBeVisible();
    expect(urls.at(-1)).toContain("q=musikk");
  });

  // The list endpoint does not hide unpublished videos on its own, so every
  // public-facing caller has to ask for the filter by name. This one is
  // reachable from the browser; the server-rendered callers are not.
  test("asks only for published videos", async ({ page }) => {
    const urls = await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");

    await expect(page.getByRole("option", { name: new RegExp(MUSIKK.name) })).toBeVisible();
    expect(urls.at(-1)).toContain("publish_on_web=true");
  });

  test("searches the whole archive when nothing narrows it to an organization", async ({
    page,
  }) => {
    const urls = await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");

    await expect(page.getByRole("option", { name: new RegExp(MUSIKK.name) })).toBeVisible();
    expect(urls.at(-1)).not.toContain("organization=");
  });

  test("dismisses the suggestions on Escape", async ({ page }) => {
    await stubSuggestions(page, [MUSIKK]);
    await page.goto("/video");
    await waitForHydration(page);

    await searchBox(page).fill("musikk");
    await expect(page.getByRole("listbox")).toBeVisible();

    await searchBox(page).press("Escape");

    await expect(page.getByRole("listbox")).toBeHidden();
  });
});

/**
 * The archive itself, rather than the box at the top of it. These read the
 * server-rendered page, so they run against the fixture backend rather than
 * against routes installed in the browser.
 */
test.describe("archive browsing", () => {
  /** The desktop rail. Its facets are also rendered into the phone's
   *  disclosure, which is display:none here but still in the DOM. */
  const rail = (page: Page) => page.getByRole("complementary", { name: "Filtrer og sorter" });

  const results = (page: Page) => page.getByRole("region", { name: "Søkeresultater" });

  test("lists the archive itself, a page at a time", async ({ page }) => {
    await page.goto("/video");

    await expect(page.getByRole("status").filter({ hasText: "videoer" })).toContainText(
      "side 1 av 5",
    );
    // Counted by their titles rather than by list items: the pagination below
    // the rows is a list of its own, inside the same section.
    await expect(results(page).getByRole("heading", { level: 3 })).toHaveCount(24);
  });

  test("gives every result the running time, date and category it was missing", async ({
    page,
  }) => {
    await page.goto("/video");

    const first = results(page).getByRole("listitem").first();
    await expect(first).toContainText("26:06");
    await expect(first).toContainText("9. mars 2011");
    await expect(first).toContainText("Kultur");
    // Drawn as a clock reading, and spelled out for anyone who can't see it.
    await expect(first.getByText("Varighet 26 minutter")).toBeAttached();
  });

  test("narrows to a category without throwing away the search on screen", async ({ page }) => {
    await page.goto("/video?q=musikk");

    await rail(page)
      .getByRole("link", { name: /^Kultur/ })
      .click();

    await page.waitForURL("**/video?q=musikk&category=Kultur");
  });

  test("counts a category only while the archive is what is being counted", async ({ page }) => {
    await page.goto("/video");
    await expect(rail(page).getByRole("link", { name: "Kultur, 243 videoer" })).toBeVisible();

    // Beside "n treff på …" the archive-wide count is a promise the filter
    // cannot keep, so it goes away rather than misleading.
    await page.goto("/video?q=musikk");
    await expect(rail(page).getByRole("link", { name: "Kultur, 243 videoer" })).toBeHidden();
    await expect(rail(page).getByRole("link", { name: "Kultur" })).toBeVisible();
  });

  test("leaves out a category that leads nowhere", async ({ page }) => {
    await page.goto("/video");

    await expect(rail(page).getByRole("link", { name: /Beredskap/ })).toBeHidden();
  });

  test("takes off one narrowing at a time", async ({ page }) => {
    await page.goto("/video?q=musikk&category=Kultur&length=under-10");

    await page.getByRole("link", { name: "Fjern filteret Kultur" }).click();

    await page.waitForURL("**/video?q=musikk&length=under-10");
    await expect(page.getByRole("link", { name: "Fjern filteret «musikk»" })).toBeVisible();
  });

  test("goes back to the first page when the narrowing changes", async ({ page }) => {
    await page.goto("/video?page=4");

    await rail(page)
      .getByRole("link", { name: /^Kultur/ })
      .click();

    await page.waitForURL("**/video?category=Kultur");
  });

  test("says which page of the results you are on", async ({ page }) => {
    await page.goto("/video?page=3");

    const pages = page.getByRole("navigation", { name: "Sider med treff" });
    await expect(pages.getByText("3", { exact: true })).toHaveAttribute("aria-current", "page");
    await expect(pages.getByRole("link", { name: "Side 5" })).toBeVisible();
  });

  test("gets a keyboard user past the rail in one press", async ({ page }) => {
    await page.goto("/video");
    await waitForHydration(page);

    await page.getByRole("link", { name: "Hopp til resultatene" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("#arkiv-resultater")).toBeFocused();
  });
});
