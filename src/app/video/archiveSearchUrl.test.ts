import { describe, it, expect } from "vitest";
import { archiveSearchUrl, parseCategory, parseOrganization, parsePage } from "./archiveSearchUrl";

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

describe("parseOrganization", () => {
  it("reads a usable id", () => {
    expect(parseOrganization("82")).toBe(82);
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseOrganization(["82", "99"])).toBe(82);
  });

  // Anything unusable drops the narrowing entirely: standing in for an
  // organization the visitor didn't ask for is worse than not narrowing.
  it.each([undefined, "", "abc", "0", "-3", "1.5e3", "82abc", " 82"])("drops %o", (value) => {
    expect(parseOrganization(value)).toBeUndefined();
  });
});

describe("parsePage", () => {
  it("reads a usable page number", () => {
    expect(parsePage("4")).toBe(4);
  });

  it.each([undefined, "", "abc", "0", "-2"])("falls back to page 1 for %o", (value) => {
    expect(parsePage(value)).toBe(1);
  });
});

describe("parseCategory", () => {
  it("reads a category name", () => {
    expect(parseCategory("Idrett")).toBe("Idrett");
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseCategory(["Idrett", "Kultur"])).toBe("Idrett");
  });

  // Passed through as given: only the API knows the real category names, and
  // it rejects one it doesn't have rather than returning an empty archive.
  it("trims surrounding whitespace", () => {
    expect(parseCategory("  Idrett  ")).toBe("Idrett");
  });

  it.each([undefined, "", "   "])("reads %o as no category", (value) => {
    expect(parseCategory(value)).toBe("");
  });
});
