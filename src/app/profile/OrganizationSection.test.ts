import { describe, expect, it } from "vitest";
import type { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";
import { mergeMemberships } from "./OrganizationSection";

const org = (id: number, name: string): SimpleOrg => ({ id, name });

describe("mergeMemberships", () => {
  it("lists an organization once when the user is both member and editor", () => {
    const bergen = org(7, "Grønn Ungdom Bergen");

    expect(mergeMemberships([bergen], [bergen])).toEqual([{ ...bergen, isEditor: true }]);
  });

  it("keeps the editor role whichever list the organization is read from first", () => {
    const bergen = org(7, "Grønn Ungdom Bergen");

    // Editors are near-always also members, so the overlap is the normal case
    // rather than an edge one: getting it backwards would demote every editor
    // on the page to "Medlem".
    expect(mergeMemberships([bergen], [bergen])[0].isEditor).toBe(true);
  });

  it("marks membership-only organizations as such", () => {
    expect(mergeMemberships([org(12, "Norsk Amatørfilmforbund")], [])).toEqual([
      { id: 12, name: "Norsk Amatørfilmforbund", isEditor: false },
    ]);
  });

  it("includes organizations the user only edits", () => {
    expect(mergeMemberships([], [org(7, "Grønn Ungdom Bergen")])).toEqual([
      { id: 7, name: "Grønn Ungdom Bergen", isEditor: true },
    ]);
  });

  it("sorts by name so the list does not reshuffle between visits", () => {
    const merged = mergeMemberships(
      [org(31, "Studentradioen"), org(12, "Norsk Amatørfilmforbund")],
      [org(7, "Grønn Ungdom Bergen")],
    );

    expect(merged.map(({ name }) => name)).toEqual([
      "Grønn Ungdom Bergen",
      "Norsk Amatørfilmforbund",
      "Studentradioen",
    ]);
  });

  it("sorts Norwegian letters after z rather than by code point", () => {
    const merged = mergeMemberships([org(1, "Ås Bygdekino"), org(2, "Zebra Film")], []);

    expect(merged.map(({ name }) => name)).toEqual(["Zebra Film", "Ås Bygdekino"]);
  });

  it("returns nothing for an account with no organizations", () => {
    expect(mergeMemberships([], [])).toEqual([]);
  });
});
