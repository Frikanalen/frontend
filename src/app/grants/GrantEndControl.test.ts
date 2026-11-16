import { describe, expect, it } from "vitest";
import { endFromTime } from "./GrantEndControl";

describe("the end staff type", () => {
  const grant = { starttime: "2026-11-16T12:00:00Z" }; // 13:00 Oslo

  it("falls on the grant's day in Oslo", () => {
    expect(Date.parse(endFromTime(grant, "15:00")!)).toBe(Date.parse("2026-11-16T14:00:00Z"));
  });

  it("falls on the next day for a time before the start", () => {
    expect(Date.parse(endFromTime(grant, "00:30")!)).toBe(Date.parse("2026-11-16T23:30:00Z"));
  });

  it("refuses what isn't a time", () => {
    expect(endFromTime(grant, "")).toBeUndefined();
  });
});
