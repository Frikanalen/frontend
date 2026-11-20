import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safeNext";

describe("safeNext", () => {
  it("follows a path on this site", () => {
    expect(safeNext("?next=%2Finvitation%2Fabc")).toBe("/invitation/abc");
  });

  it("goes to Min side without one, or when it leads elsewhere", () => {
    for (const search of [
      "",
      "?next=https://evil.example",
      "?next=//evil.example",
      "?next=/\\evil.example",
      "?next=profile",
    ]) {
      expect(safeNext(search)).toBe("/profile");
    }
  });
});
