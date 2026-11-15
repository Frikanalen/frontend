import { describe, expect, it } from "vitest";
import cases from "./paging-cases.json";
import { pageAtOffset, pageStarts, pagesProblem, readingSeconds, screenPages } from "./pages";

describe("pages of a text for the screen", () => {
  it("starts a new page at a blank line", () => {
    expect(screenPages("a\nb\n\n  \nc\n\n")).toEqual(["a\nb", "c"]);
    expect(screenPages("")).toEqual([""]);
  });

  // The same file the on-air graphics and Django are tested against.
  it.each(cases.map((c) => [c.name, c] as const))("pages %s as the graphics do", (_name, c) => {
    expect(screenPages(c.text)).toEqual(c.pages);
    expect(readingSeconds(c.heading, c.text)).toBe(c.minimumSeconds);
  });

  it("says when there are too many pages", () => {
    expect(pagesProblem("x".repeat(401))).toBeNull();
    expect(pagesProblem(Array(7).fill("kort").join("\n\n"))).toMatch(/7 sider/);
  });

  it("knows which page the cursor is on", () => {
    const text = "Første side.\n\nAndre side.\n\nTredje.";
    expect(pageStarts(text)).toEqual([0, 14, 27]);
    expect(pageAtOffset(text, 0)).toBe(0);
    expect(pageAtOffset(text, 13)).toBe(0);
    expect(pageAtOffset(text, 20)).toBe(1);
    expect(pageAtOffset(text, text.length)).toBe(2);
  });
});
