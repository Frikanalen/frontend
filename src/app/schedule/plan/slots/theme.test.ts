import { describe, expect, it } from "vitest";
import { sameTheme, themeOf, themeProblem } from "./theme";

const jukebox = {
  id: 1,
  kind: "jukebox",
  description: "",
  seriesName: null,
  name: "Kulturnatt",
  categories: [4, 2],
  shortest: null,
  longest: "00:30:00",
  newerThanDays: null,
  olderThanDays: 365,
} as const;

describe("jukebox theme", () => {
  it("reads a recipe's theme, lengths in minutes", () => {
    expect(themeOf({ ...jukebox, categories: [4, 2] })).toEqual({
      name: "Kulturnatt",
      categories: [2, 4],
      shortest: null,
      longest: 30,
      newerThanDays: null,
      olderThanDays: 365,
    });
  });

  it("has no theme for anything but a jukebox", () => {
    expect(themeOf(null).categories).toEqual([]);
    expect(themeOf({ ...jukebox, kind: "uploads", categories: [] }).name).toBe("");
  });

  it("only counts a real change", () => {
    const theme = themeOf({ ...jukebox, categories: [2, 4] });
    expect(sameTheme(theme, { ...theme, name: " Kulturnatt " })).toBe(true);
    expect(sameTheme(theme, { ...theme, longest: 20 })).toBe(false);
  });

  it("refuses limits that leave nothing", () => {
    const theme = themeOf(null);
    expect(themeProblem(theme)).toBeNull();
    expect(themeProblem({ ...theme, shortest: 40, longest: 30 })).toMatch(/korteste/);
    expect(themeProblem({ ...theme, newerThanDays: 30, olderThanDays: 60 })).toMatch(/nyere/);
  });
});
