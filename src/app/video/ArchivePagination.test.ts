import { describe, it, expect } from "vitest";
import { pageWindow } from "./ArchivePagination";

describe("pageWindow", () => {
  it("spells out every page while they all fit", () => {
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the first and last page reachable from the middle", () => {
    expect(pageWindow(50, 108)).toEqual([1, "gap", 48, 49, 50, 51, 52, "gap", 108]);
  });

  it("marks only the runs it actually left out", () => {
    expect(pageWindow(3, 108)).toEqual([1, 2, 3, 4, 5, "gap", 108]);
  });

  it("closes the gap when the window reaches the end", () => {
    expect(pageWindow(106, 108)).toEqual([1, "gap", 104, 105, 106, 107, 108]);
  });

  // The window is clamped by the ends rather than shifted, so page one shows
  // fewer numbers than page fifty. Both are honest about where they are.
  it("does not invent pages past the last one", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it("has nothing to draw for a single page", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});
