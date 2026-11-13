import { describe, expect, it } from "vitest";
import { isValidOrgnr, normalizeOrgnr } from "./orgnr";

describe("isValidOrgnr", () => {
  it("accepts a number with the right check digit", () => {
    expect(isValidOrgnr("971526920")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidOrgnr("971526921")).toBe(false);
  });

  it("rejects anything but nine digits", () => {
    expect(isValidOrgnr("97152692")).toBe(false);
    expect(isValidOrgnr("9715269200")).toBe(false);
    expect(isValidOrgnr("97152692a")).toBe(false);
    expect(isValidOrgnr("")).toBe(false);
  });
});

describe("normalizeOrgnr", () => {
  it("drops spaces", () => {
    expect(normalizeOrgnr(" 971 526 920 ")).toBe("971526920");
  });
});
