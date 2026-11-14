import { describe, expect, it } from "vitest";
import { posterMinimumSeconds, posterSlides, slideProblem } from "./posterSlides";

describe("poster slides", () => {
  it("starts a new slide at a blank line", () => {
    expect(posterSlides("a\nb\n\n  \nc\n\n")).toEqual(["a\nb", "c"]);
    expect(posterSlides("")).toEqual([""]);
  });

  // The same cases as the graphics and Django.
  it("needs every slide read once", () => {
    expect(posterMinimumSeconds("To ord", "en to tre\n\nfire")).toBe(9);
    expect(posterMinimumSeconds("Hei", "")).toBe(5);
    expect(posterMinimumSeconds("", Array(15).fill("ord").join(" "))).toBe(9);
  });

  it("says when a slide is too long or there are too many", () => {
    expect(slideProblem("x".repeat(400))).toBeNull();
    expect(slideProblem(`kort\n\n${"x".repeat(401)}`)).toMatch(/Side 2 har 401 tegn/);
    expect(slideProblem(Array(7).fill("kort").join("\n\n"))).toMatch(/høyst 6/);
  });
});
