import { describe, it, expect } from "vitest";
import {
  ArchiveState,
  archiveSearchUrl,
  archiveStateFrom,
  archiveUrlWith,
  resolveSort,
  sortsFor,
} from "./archiveSearchUrl";

describe("archiveSearchUrl", () => {
  it("puts a plain search on the query string", () => {
    expect(archiveSearchUrl({ query: "musikk" })).toBe("/video?q=musikk");
  });

  it("leaves page 1 implicit, so a shared link carries no noise", () => {
    expect(archiveSearchUrl({ query: "musikk", page: 1 })).toBe("/video?q=musikk");
    expect(archiveSearchUrl({ query: "musikk", page: 2 })).toBe("/video?q=musikk&page=2");
  });

  it("narrows to an organization without a query, which is how an organization's whole catalogue is linked", () => {
    expect(archiveSearchUrl({ organization: 82 })).toBe("/video?organization=82");
  });

  it("combines both narrowings when searching inside an organization", () => {
    expect(archiveSearchUrl({ query: "linux", organization: 82, page: 3 })).toBe(
      "/video?q=linux&organization=82&page=3",
    );
  });

  it("drops an empty query rather than sending a search for nothing", () => {
    expect(archiveSearchUrl({ query: "", organization: 82 })).toBe("/video?organization=82");
  });

  it("narrows to a category without a query, which is what a chip links to", () => {
    expect(archiveSearchUrl({ category: "Idrett" })).toBe("/video?category=Idrett");
  });

  it("keeps the query when a chip narrows the search already on screen", () => {
    expect(archiveSearchUrl({ query: "musikk", category: "Kultur" })).toBe(
      "/video?q=musikk&category=Kultur",
    );
  });

  it("escapes a category name with a space in it", () => {
    expect(archiveSearchUrl({ category: "Barn og ungdom" })).toBe("/video?category=Barn+og+ungdom");
  });

  it("carries the category through to page two", () => {
    expect(archiveSearchUrl({ category: "Idrett", page: 2 })).toBe("/video?category=Idrett&page=2");
  });

  it("drops an empty category rather than sending a filter for nothing", () => {
    expect(archiveSearchUrl({ query: "musikk", category: "" })).toBe("/video?q=musikk");
  });

  it("falls back to the bare archive when nothing narrows it", () => {
    expect(archiveSearchUrl({})).toBe("/video");
  });

  it("escapes what it is given", () => {
    expect(archiveSearchUrl({ query: "rock & roll" })).toBe("/video?q=rock+%26+roll");
  });
});

describe("archiveSearchUrl, with a length band and a sort", () => {
  it("carries a length band", () => {
    expect(archiveSearchUrl({ length: "30-60" })).toBe("/video?length=30-60");
  });

  it("carries a sort", () => {
    expect(archiveSearchUrl({ sort: "lengst" })).toBe("/video?sort=lengst");
  });

  it("combines every narrowing there is", () => {
    expect(
      archiveSearchUrl({
        query: "musikk",
        organization: 82,
        category: "Kultur",
        length: "under-10",
        sort: "tittel",
        page: 2,
      }),
    ).toBe("/video?q=musikk&organization=82&category=Kultur&length=under-10&sort=tittel&page=2");
  });
});

describe("archiveUrlWith", () => {
  const state: ArchiveState = {
    query: "musikk",
    organization: 82,
    category: "Kultur",
    length: "30-60",
    sort: "nyest",
    page: 7,
  };

  it("changes one narrowing and leaves the rest alone", () => {
    expect(archiveUrlWith(state, { category: "Idrett" })).toBe(
      "/video?q=musikk&organization=82&category=Idrett&length=30-60&sort=nyest",
    );
  });

  it("drops a narrowing when handed an empty one", () => {
    expect(archiveUrlWith(state, { length: "" })).toBe(
      "/video?q=musikk&organization=82&category=Kultur&sort=nyest",
    );
  });

  it("drops the organization when handed no id", () => {
    expect(archiveUrlWith(state, { organization: undefined })).toBe(
      "/video?q=musikk&category=Kultur&length=30-60&sort=nyest",
    );
  });

  // Otherwise narrowing from page 7 lands on page 7 of a result set that may
  // now have two pages, which reads as an empty archive.
  it("always goes back to the first page", () => {
    expect(archiveUrlWith(state, {})).not.toContain("page=");
  });
});

describe("archiveStateFrom", () => {
  it("reads a whole URL", () => {
    expect(
      archiveStateFrom({
        q: "  musikk  ",
        organization: "82",
        category: "  Idrett  ",
        length: "30-60",
        sort: "lengst",
        page: "4",
      }),
    ).toEqual({
      query: "musikk",
      organization: 82,
      category: "Idrett",
      length: "30-60",
      sort: "lengst",
      page: 4,
    });
  });

  it("reads an empty URL as the unnarrowed archive", () => {
    expect(archiveStateFrom({})).toEqual({
      query: "",
      organization: undefined,
      category: "",
      length: "",
      sort: "",
      page: 1,
    });
  });

  it("takes the first of a repeated parameter", () => {
    expect(archiveStateFrom({ q: ["musikk", "kultur"], organization: ["82", "99"] })).toMatchObject(
      {
        query: "musikk",
        organization: 82,
      },
    );
  });

  // Anything unusable drops the narrowing entirely: standing in for an
  // organization the visitor didn't ask for is worse than not narrowing.
  it.each([undefined, "", "abc", "0", "-3", "1.5e3", "82abc", " 82"])(
    "drops an organization of %o",
    (organization) => {
      expect(archiveStateFrom({ organization }).organization).toBeUndefined();
    },
  );

  it.each([undefined, "", "abc", "0", "-2", "1.5", "4abc"])(
    "falls back to page 1 for %o",
    (page) => {
      expect(archiveStateFrom({ page }).page).toBe(1);
    },
  );

  // Passed through as given: only the API knows the real category names, and
  // it rejects one it doesn't have rather than returning an empty archive.
  it.each([undefined, "", "   "])("reads a category of %o as no category", (category) => {
    expect(archiveStateFrom({ category }).category).toBe("");
  });

  it.each([undefined, "", "40-50", "kort", "0"])("drops a length band of %o", (length) => {
    expect(archiveStateFrom({ length }).length).toBe("");
  });

  it.each([undefined, "", "-created_time", "name", "tilfeldig"])("drops a sort of %o", (sort) => {
    expect(archiveStateFrom({ sort }).sort).toBe("");
  });
});

describe("resolveSort", () => {
  it("ranks a search by relevance when nothing was chosen", () => {
    expect(resolveSort("", true)).toBe("relevans");
  });

  it("puts the newest first when there is nothing to rank", () => {
    expect(resolveSort("", false)).toBe("nyest");
  });

  it("keeps a sort that was chosen", () => {
    expect(resolveSort("tittel", true)).toBe("tittel");
    expect(resolveSort("tittel", false)).toBe("tittel");
  });

  // What is left in the URL when a search is cleared while sorted by
  // relevance: there is no longer anything for the API to rank.
  it("falls back when relevance outlives the query that earned it", () => {
    expect(resolveSort("relevans", false)).toBe("nyest");
  });
});

describe("sortsFor", () => {
  it("offers relevance only alongside a query", () => {
    expect(sortsFor(true)).toContain("relevans");
    expect(sortsFor(false)).not.toContain("relevans");
  });
});
